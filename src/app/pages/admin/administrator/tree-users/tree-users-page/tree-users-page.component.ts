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

  // Variables para puntos del usuario principal
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
          
          const pointsUser = pointsData?.user || {};
          const { points, ...pointsUserProps } = pointsData || {};

          const user = {
            ...authUser,
            ...pointsUser,
            ...pointsUserProps
          };
          this.currentUser = user;

          // 🔥 FILTRAR SOLO PUNTOS DE TIPO COMPRA (B) Y LEGACY
          const allPoints = Array.isArray(points) ? points : [];
          
          this.listPoints = allPoints.filter(p => 
            p.type === 'B' || p.type === 'COMPRA' || p.is_legacy === true
          );

          console.log('📊 Puntos filtrados para el árbol:', this.listPoints.length);
          console.log('📊 Total puntos recibidos:', allPoints.length);

          const myId = user?.uuid || getCodeUuid() || '';
          
          // 🔥 Construir árbol REAL (sin placeholders para los contadores)
          let realChildren = this.nodeTreeParse(this.listPoints, myId);
          
          // 🔥 CALCULAR ESTADÍSTICAS REALES (sin placeholders)
          const realStats = this.getTreeStats(realChildren);

          // 🔥 CONTADORES - USAR LOS VALORES DEL BACKEND PRIMERO
          // Si el backend dice 0, debe mostrar 0, no usar fallbacks incorrectos
          this.usuarioDirectos = user?.directos !== undefined ? user.directos : realChildren.length;
          this.usuarioActivos = user?.activos !== undefined ? user.activos : realStats.active;
          this.usuarioTotal = user?.red_total !== undefined ? user.red_total : realStats.total;

          console.log('📊 Contadores del backend:', {
            directos: user?.directos,
            activos: user?.activos,
            red_total: user?.red_total
          });
          console.log('📊 Contadores calculados localmente:', {
            directos: realChildren.length,
            activos: realStats.active,
            total: realStats.total
          });

          // 🔥 SOLO USAR PLACEHOLDERS PARA EL ÁRBOL VISUAL (no para contadores)
          let childrenForDisplay = realChildren;
          if (childrenForDisplay.length === 0) {
            // Solo placeholders visuales, no afectan contadores
            if (myId === 'DOSB' || this.listPoints.length === 0) {
              childrenForDisplay = [];
              for (let index = 0; index < 4; index++) {
                childrenForDisplay.push({
                  data: { id: "-" + index, photo: 'assets/images/Ellipse 4.png', name: "Vacío" },
                  active: false,
                  selected: true,
                  children: [],
                  admin: false
                });
              }
            }
          }

          // 🔥 PUNTOS DEL USUARIO
          if (user?.points) {
            this.puntosPersonales = user.points.personal || 0;
            this.puntosRed = user.points.pointGroup || 0;
            this.puntosTotales = user.totalPoints || user.points.compra?.total_puntos || 0;
            this.puntosPatrocinio = user.points.patrocinioTotal || user.points.patrocinio || 0;
            this.puntosResidual = user.points.residual || 0;
          } else {
            this.puntosPersonales = 0;
            this.puntosRed = 0;
            this.puntosTotales = 0;
            this.puntosPatrocinio = 0;
            this.puntosResidual = 0;
          }

          this.userSponsor = user?.sponsor_name || "Sistema";
          this.codeSponsor = user?.sponsor_uuid || "--";

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

          this.data = {
            data: {
              id: myId,
              photo: image,
              name: user?.name,
              admin: !!user?.is_admin
            },
            active: (user?.payment?.state == 2) || (user?.payment_active?.state == 2) || !!user?.active || (user?.estado_visual?.toUpperCase() === 'ACTIVO'),
            selected: true,
            children: childrenForDisplay
          };

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
   * 🔥 SOLO cuenta nodos reales, no placeholders
   */
  private getTreeStats(nodes: IECONode[]): { total: number, active: number } {
    let total = 0;
    let active = 0;

    const traverse = (childrenList: IECONode[]) => {
      for (const node of childrenList) {
        // 🔥 Ignorar placeholders (IDs que empiezan con "-")
        if (node.data?.id?.startsWith('-')) continue;
        
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

    const childrenPoints = listPoints.filter(p => {
      const isMatch = p.sponsor_code?.toLowerCase() === code.toLowerCase();
      const isValidType = p.type === 'B' || p.type === 'COMPRA' || p.is_legacy === true;
      return isMatch && isValidType;
    });
    
    const processedCodes = new Set();

    childrenPoints.forEach((point) => {
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
   * 🔥 BUSCA UN USUARIO EN EL ÁRBOL DE MANERA RECURSIVA
   */
  private findUserInTree(userCode: string): any {
    if (!this.data) return null;
    
    const searchCode = String(userCode);

    const searchInNode = (node: IECONode): any => {
      if (!node) return null;

      const nodeId = node.data?.id || '';
      if (String(nodeId).toLowerCase() === searchCode.toLowerCase()) {
        return node.data;
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const childId = child.data?.id || '';
          if (String(childId).toLowerCase() === searchCode.toLowerCase()) {
            return child.data;
          }
          const found = searchInNode(child);
          if (found) {
            return found;
          }
        }
      }

      return null;
    };

    return searchInNode(this.data);
  }

  /**
   * 🔥 BUSCA UN USUARIO EN LA LISTA DE PUNTOS LOCAL
   */
  private findUserInListPoints(userCode: string): any {
    if (!this.listPoints || this.listPoints.length === 0) return null;

    const searchCode = String(userCode);

    const point = this.listPoints.find(p => {
      const pCode = p.user_code || '';
      return String(pCode).toLowerCase() === searchCode.toLowerCase();
    });

    if (point) {
      return point.user || point.user_point || point;
    }

    return null;
  }

  /**
   * Evento al hacer clic en un nodo del árbol
   */
  public onSeletedUser(usercode: string): void {
    if (!usercode || usercode.startsWith("-")) return;

    const codeStr = String(usercode);
    const isSelf = codeStr.toLowerCase() === getCodeUuid().toLowerCase();

    if (isSelf) {
      this.apiService.getAuthenticationUser().subscribe(res => {
        this.openModal(res.data, "Tu Detalle");
      });
      return;
    }

    let targetUser = this.findUserInTree(codeStr);
    
    if (!targetUser) {
      targetUser = this.findUserInListPoints(codeStr);
    }

    if (targetUser) {
      const userName = targetUser.name || targetUser.data?.name || codeStr;
      this.openModal(targetUser, `Detalle: ${userName}`);
      return;
    }

    console.log('📡 Usuario no encontrado localmente, consultando al backend:', codeStr);
    
    this.apiService.getUsersFindAll({ code: codeStr, limit: 1, page: 1 }).subscribe({
      next: (res) => {
        if (res.success && res.data?.items?.length > 0) {
          const user = res.data.items[0];
          this.openModal(user, `Detalle: ${user.name}`);
        } else {
          const fallbackUser = this.findUserInTree(codeStr) || this.findUserInListPoints(codeStr);
          if (fallbackUser) {
            const userName = fallbackUser.name || fallbackUser.data?.name || codeStr;
            this.openModal(fallbackUser, `Detalle: ${userName}`);
          } else {
            console.warn('⚠️ Usuario no encontrado en ninguna fuente:', codeStr);
          }
        }
      },
      error: (err) => {
        console.error('❌ Error al obtener usuario:', err);
        const fallbackUser = this.findUserInTree(codeStr) || this.findUserInListPoints(codeStr);
        if (fallbackUser) {
          const userName = fallbackUser.name || fallbackUser.data?.name || codeStr;
          this.openModal(fallbackUser, `Detalle: ${userName}`);
        }
      }
    });
  }

  /**
   * Abre el modal de detalle
   */
  private openModal(user: any, title: string) {
    const userData = user.data || user;
    
    const userCode = userData.id || userData.uuid || '';
    const userCodeStr = String(userCode);

    let pts = userData.points;
    if (typeof pts === 'string') {
      try {
        pts = JSON.parse(pts);
      } catch {
        pts = {};
      }
    }
    pts = pts || {};

    const fullUser = this.listPoints.find(p => {
      const pUserCode = p.user_code || '';
      return String(pUserCode).toLowerCase() === String(userCodeStr).toLowerCase();
    })?.user || userData;

    const personales = Number(pts?.personal || fullUser?.points?.personal || 0);
    const grupales = Number(pts?.pointGroup || fullUser?.points?.pointGroup || 0);
    const infinito = Number(pts?.infinito || fullUser?.points?.infinito || 0);

    const redTotal = grupales + infinito;
    const granTotalPuntos = personales + redTotal;

    let packs = [];
    
    const userPacks = pts?.compra?.detalles || [];
    const paymentPack = fullUser.payment?.payment_order?.pack;
    
    if (userPacks.length > 0) {
      packs = userPacks.map((pack: any) => ({
        paquete: pack.paquete || pack.title || pack.name || 'Paquete',
        puntos: pack.puntos || pack.point || 0,
        fecha: pack.created_at || pack.fecha || new Date().toISOString()
      }));
    }
    
    if (paymentPack && packs.length === 0) {
      packs.push({
        paquete: paymentPack.title || 'Membresía Activa',
        puntos: paymentPack.points || personales || 0,
        fecha: fullUser.payment?.created_at || new Date().toISOString()
      });
    }
    
    if (packs.length === 0 && fullUser.package_name) {
      packs.push({
        paquete: fullUser.package_name || 'Plan Base',
        puntos: personales || 0,
        fecha: fullUser.created_at || new Date().toISOString()
      });
    }
    
    if (packs.length === 0) {
      packs.push({
        paquete: 'Sin paquetes activos',
        puntos: 0,
        fecha: new Date().toISOString()
      });
    }

    const userForModal = {
      ...fullUser,
      name: fullUser.name || userData.name || 'Usuario',
      uuid: fullUser.uuid || userData.id || userData.uuid || '',
      email: fullUser.email || userData.email || '',
      photo: fullUser.photo || userData.photo || this.fallback,
      points: pts,
      totalPoints: fullUser.totalPoints || granTotalPuntos,
      payment: fullUser.payment || userData.payment,
      payment_active: fullUser.payment_active || userData.payment_active,
      active: fullUser.active || userData.active || false,
      package_name: fullUser.package_name || fullUser.packageName || ''
    };

    this.nzModalService.create({
      nzTitle: title,
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzWidth: '450px',
      nzData: {
        userModel: userForModal,
        listPoints: this.listPoints,
        paquetes: packs,
        paymentOrder: userForModal.payment || userForModal.payment_active,
        pointTotal: personales,
        pointRed: redTotal,
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