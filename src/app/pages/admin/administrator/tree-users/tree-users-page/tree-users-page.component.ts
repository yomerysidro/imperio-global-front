import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { TreeViewComponent } from '@shared/components/tree-view/tree-view.component';
import { ECONode, IECONode, Orientation } from '@shared/interfaces/econode.type';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { getCodeUuid } from '@shared/utilities/functions';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserTreeDetailComponent } from '@shared/components/user-tree-detail/user-tree-detail.component';

@Component({
  selector: 'app-tree-users-page',
  templateUrl: './tree-users-page.component.html',
  styleUrls: ['./tree-users-page.component.scss']
})
export class TreeUsersPageComponent implements OnInit {
  Orientation = Orientation;
  nodeSelected: ECONode = null;
  isChart: boolean = false;
  data!: IECONode;
  environment = environment;
  fallback = CONSTANTS.IMAGE.FALLBACK;

  // Contadores de cabecera
  usuarioDirectos: number = 0;
  usuarioActivos: number = 0;
  usuarioTotal: number = 0;

  // Info del Patrocinador
  userSponsor: string = "--";
  codeSponsor: string = "--";

  // ✅ Variables para puntos del usuario principal
  puntosPersonales: number = 0;
  puntosRed: number = 0;
  puntosTotales: number = 0;
  puntosPatrocinio: number = 0;
  puntosResidual: number = 0;

  listPoints: Array<any> = [];
  private currentUser: UserModel | null = null;

  constructor(
    private apiService: ApiService,
    private nzModalService: NzModalService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carga la red completa desde el Backend
   */
  /**
   * Carga la red completa desde el Backend
   */
  public loadData(): void {
    this.isChart = false;
    this.usuarioTotal = 0;

    forkJoin({
      pointsRes: this.apiService.getPointListUser(),
      authRes: this.apiService.getAuthenticationUser()
    }).subscribe({
      next: ({ pointsRes, authRes }) => {
        if (pointsRes.success) {
          const authUser = authRes.success ? authRes.data : null;
          const pointsData = pointsRes.data;
          
          // Tratar de obtener el user desde la respuesta de puntos, si existe
          const pointsUser = pointsData?.user || {};
          
          // Extraer la lista de puntos y otros metadatos
          const { points, ...pointsUserProps } = pointsData || {};

          // Combinar datos del perfil del usuario
          const user = {
            ...authUser,
            ...pointsUser,
            ...pointsUserProps
          };
          this.currentUser = user;

          // Controlar si points viene como array de árbol estructurado o inicializar vacío
          this.listPoints = Array.isArray(points) ? points : [];

          // 5. Construir árbol recursivo (Infinito)
          const myId = user?.uuid || getCodeUuid() || '';
          let children = this.nodeTreeParse(this.listPoints, myId);

          // Placeholders visuales si la red está vacía o es la cuenta raíz 'DOSB' esperando inyección
          if (children.length === 0) {
            if (myId === 'DOSB' || this.listPoints.length === 0) {
              for (let index = 0; index < 4; index++) {
                children.push({
                  data: { id: "-" + index, photo: 'assets/images/Ellipse 4.png', name: "Vacío" },
                  active: false,
                  selected: true,
                  children: [],
                  admin: false
                });
              }
            }
          }

          // Calcular estadísticas locales recursivas desde el árbol construido
          const stats = this.getTreeStats(children);

          // 2. Sincronizar contadores (Mapeo directo desde el Backend, con fallback calculado localmente)
          this.usuarioDirectos = user?.directos || children.length;
          this.usuarioActivos = user?.activos || stats.active;
          this.usuarioTotal = user?.red_total || stats.total;

          // Forzar fallback si los contadores del Backend vienen en 0 pero sí hay elementos en el árbol
          if (this.usuarioTotal === 0 && stats.total > 0) {
            this.usuarioTotal = stats.total;
          }
          if (this.usuarioDirectos === 0 && children.length > 0) {
            this.usuarioDirectos = children.length;
          }
          if (this.usuarioActivos === 0 && stats.active > 0) {
            this.usuarioActivos = stats.active;
          }

          // ✅ 3. Cargar puntos del usuario
          if (user?.points) {
            this.puntosPersonales = user.points.personal || 0;
            this.puntosRed = user.points.pointGroup || 0;
            this.puntosTotales = user.totalPoints || 0;
            this.puntosPatrocinio = user.points.patrocinioTotal || user.points.patrocinio || 0;
            this.puntosResidual = user.points.residual || 0;
          } else {
            this.puntosPersonales = 0;
            this.puntosRed = 0;
            this.puntosTotales = 0;
            this.puntosPatrocinio = 0;
            this.puntosResidual = 0;
          }

          // 4. Información del Patrocinador Superior
          this.userSponsor = user?.sponsor_name || "Sistema";
          this.codeSponsor = user?.sponsor_uuid || "--";

          // Si el sponsor sigue siendo genérico, intentar buscarlo en la lista de puntos
          if (this.userSponsor === "Sistema" && this.codeSponsor === "--") {
            const myPoint = this.listPoints.find(p => p.user_code?.toLowerCase() === myId?.toLowerCase());
            if (myPoint?.sponsor) {
              this.userSponsor = myPoint.sponsor.name || "Sistema";
              this.codeSponsor = myPoint.sponsor.uuid || "--";
            }
          }

          const image = user?.file?.path
            ? environment.hostUrl + '/storage/' + user.file.path
            : this.fallback;

          // Definición de la data del árbol
          this.data = {
            data: {
              id: myId,
              photo: image,
              name: user?.name,
              admin: !!user?.is_admin
            },
            active: (user?.payment?.state == 2) || (user?.payment_active?.state == 2) || !!user?.active || (user?.estado_visual?.toUpperCase() === 'ACTIVO'),
            selected: true,
            children: children
          };

          // Activamos el gráfico después de procesar todo
          this.isChart = true;
        }
      },
      error: (err) => {
        console.error("Error al cargar la red", err);
      }
    });
  }

  /**
   * Calculates tree statistics recursively (Red Total and Activos)
   */
  private getTreeStats(nodes: IECONode[]): { total: number, active: number } {
    let total = 0;
    let active = 0;

    const traverse = (childrenList: IECONode[]) => {
      for (const node of childrenList) {
        total++;
        if (node.active) {
          active++;
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };

    traverse(nodes);
    return { total, active };
  }

  /**
   * Parsea la lista plana de puntos en una estructura de árbol recursiva
   */
  private nodeTreeParse(listPoints: any[], code: string): Array<IECONode> {
    let tree: Array<IECONode> = [];

    // Filtramos los hijos basándonos en el sponsor_code
    const childrenPoints = listPoints.filter(p => p.sponsor_code?.toLowerCase() === code.toLowerCase());
    const processedCodes = new Set();

    childrenPoints.forEach((point) => {
      // Evitar duplicidad de nodos si un usuario tiene varios registros de puntos
      if (processedCodes.has(point.user_code)) return;
      processedCodes.add(point.user_code);

      const uHijo = point.user || point.user_point;
      if (!uHijo) return;

      const image = uHijo?.file?.path
        ? environment.hostUrl + '/storage/' + uHijo.file.path
        : this.fallback;

      const isNodeActive = !!point.active || 
                           !!uHijo?.active || 
                           (uHijo?.payment_active?.state == 2) || 
                           (uHijo?.payment?.state == 2) || 
                           (uHijo?.estado_visual?.toUpperCase() === 'ACTIVO');

      tree.push({
        data: {
          id: point.user_code,
          photo: image,
          name: uHijo.name,
          email: uHijo.email
        },
        selected: true,
        active: isNodeActive,
        children: this.nodeTreeParse(listPoints, point.user_code),
        admin: !!uHijo.is_admin
      });
    });

    return tree;
  }

  /**
   * Evento al hacer clic en un nodo del árbol
   */
  public onSeletedUser(usercode: string): void {
    if (!usercode || usercode.startsWith("-")) return;

    const isSelf = usercode.toLowerCase() === getCodeUuid().toLowerCase();

    if (isSelf) {
      this.apiService.getAuthenticationUser().subscribe(res => {
        this.openModal(res.data, "Tu Detalle");
      });
    } else {
      // Buscamos la info del socio seleccionado
      this.apiService.getUsersFindAll({ code: usercode, limit: 1, page: 1 }).subscribe(res => {
        if (res.success && res.data.items.length > 0) {
          const targetUser = res.data.items[0];
          this.openModal(targetUser, `Detalle: ${targetUser.name}`);
        }
      });
    }
  }

  /**
   * Abre el modal de detalle con lógica de puntos híbrida
   */
  private openModal(user: any, title: string) {
    // 1. Parseo seguro de puntos
    const pts = typeof user.points === 'string' ? JSON.parse(user.points) : user.points;

    // 2. Puntos personales (volumen de compra)
    const personales = Number(pts?.personal || 0);
    const grupales = Number(pts?.pointGroup || 0);
    const infinito = Number(pts?.infinito || 0);

    // 3. Puntos de Red estrictos
    const redTotal = grupales + infinito;
    const granTotalPuntos = personales + redTotal;

    // 4. Gestión de Paquetes
    let packs = pts?.compra?.detalles || [];
    if (packs.length === 0 && (user.payment?.payment_order?.pack || user.package_name)) {
      packs.push({
        paquete: user.package_name || user.payment?.payment_order?.pack?.title || "Membresía Activa",
        puntos: personales
      });
    }

    // ✅ 5. Lanzar el Modal con todos los datos necesarios
    this.nzModalService.create({
      nzTitle: title,
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzWidth: '450px',
      nzData: {
        userModel: user,
        listPoints: this.listPoints,
        paquetes: packs,
        paymentOrder: user.payment || user.payment_active,
        pointTotal: personales,       // Puntos Personales
        pointRed: redTotal,           // Puntos Grupales + Infinito
        granTotalPuntos: granTotalPuntos
      }
    });
  }

  /**
   * Lógica visual para seleccionar nodos hermanos
   */
  selectSlibingNodes(treeView: TreeViewComponent, node: ECONode) {
    if (node == this.nodeSelected) {
      this.nodeSelected = null;
      treeView.nodes.forEach(x => x.isSelected = false);
    } else {
      this.nodeSelected = node;
      const nodes = treeView.getSlibingNodes(node).map(x => x.id);
      treeView.nodes.forEach(x => {
        x.isSelected = x.id == node.id || nodes.indexOf(x.id) >= 0;
      });
    }
  }
}