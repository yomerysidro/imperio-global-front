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
  nodeSelected: ECONode | null = null;
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
   * Calcula estadísticas del árbol (Red Total y Activos)
   */
  private getTreeStats(nodes: IECONode[]): { total: number, active: number } {
    let total = 0;
    let active = 0;

    const traverse = (childrenList: IECONode[]) => {
      for (const node of childrenList) {
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
 * 🔥 CORREGIDO: Solo marca como activo si el estado del pago es 2 y es el mes actual o gracia.
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

    // 🔥 CORRECCIÓN CRÍTICA: Verificar el estado del pago y la fecha
    let isNodeActive = false;

    // 1. Obtener el pago del usuario (puede venir en payment o payment_active)
    const paymentObj = uHijo.payment || uHijo.payment_active || point.payment;

    if (paymentObj) {
      // 2. Verificar si el estado es PAGADO (2)
      const isPaid = (paymentObj.state === 2 || paymentObj.state === '2');

      if (isPaid) {
        // 3. Obtener la fecha del pago
        const paymentDate = paymentObj.created_at || paymentObj.updated_at;
        if (paymentDate) {
          const date = new Date(paymentDate);
          const now = new Date();

          const paymentMonth = date.getMonth();
          const paymentYear = date.getFullYear();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          // Calcular mes anterior para período de gracia
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

          const isCurrentMonth = (paymentMonth === currentMonth && paymentYear === currentYear);
          const isGracePeriod = (paymentMonth === prevMonth && paymentYear === prevYear && now.getDate() <= 2);

          // ✅ SOLO si está pagado y es el mes actual o gracia, está activo
          if (isCurrentMonth || isGracePeriod) {
            isNodeActive = true;
          }
        }
      }
    }

    // 🔥 Si no cumple con la condición estricta, isNodeActive se queda en false (inactivo)

    tree.push({
      data: {
        id: point.user_code,
        photo: image,
        name: uHijo.name,
        email: uHijo.email
      },
      selected: true,
      active: isNodeActive, // ✅ Ahora solo será verde si cumple la condición
      children: this.nodeTreeParse(listPoints, point.user_code),
      admin: !!uHijo.is_admin
    });
  });

  return tree;
}

  /**
   * BUSCA UN USUARIO EN EL ÁRBOL DE MANERA RECURSIVA
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
   * BUSCA UN USUARIO EN LA LISTA DE PUNTOS LOCAL
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
   * 🔥 CORREGIDO: Evento al hacer clic en un nodo del árbol
   */
  public onSeletedUser(usercode: string): void {
    if (!usercode || usercode.startsWith("-")) return;

    const codeStr = String(usercode);
    const codeUuid = getCodeUuid();
    const isSelf = codeUuid ? (codeStr.toLowerCase() === codeUuid.toLowerCase()) : false;

    if (isSelf) {
      this.apiService.getAuthenticationUser().subscribe(res => {
        this.openModal(res.data, "Tu Detalle", false);
      });
      return;
    }

    // 🔥 CORRECCIÓN: Primero intentar buscar por código (uuid) usando getUsersFindAll
    console.log('📡 Buscando usuario por código (uuid):', codeStr);
    this.apiService.getUsersFindAll({ code: codeStr, limit: 1, page: 1 }).subscribe({
      next: (res) => {
        if (res.success && res.data?.items && res.data.items.length > 0) {
          const userData = res.data.items[0];
          console.log('✅ Usuario encontrado por código:', userData);
          this.openModal(userData, `Detalle: ${userData.name || codeStr}`, true);
        } else {
          // Si falla por código, intentar por ID numérico (si es número)
          const numericId = parseInt(codeStr, 10);
          if (!isNaN(numericId)) {
            console.log('📡 Intentando buscar por ID numérico:', numericId);
            this.apiService.getUserById(numericId).subscribe({
              next: (resById) => {
                if (resById.success && resById.data) {
                  console.log('✅ Usuario encontrado por ID:', resById.data);
                  this.openModal(resById.data, `Detalle: ${resById.data.name || codeStr}`, true);
                } else {
                  console.warn('⚠️ Usuario no encontrado por ningún método:', codeStr);
                  this.fallbackOpenModal(codeStr);
                }
              },
              error: (errById) => {
                console.error('❌ Error al obtener usuario por ID:', errById);
                this.fallbackOpenModal(codeStr);
              }
            });
          } else {
            console.warn('⚠️ Usuario no encontrado por código y no es un ID numérico válido:', codeStr);
            this.fallbackOpenModal(codeStr);
          }
        }
      },
      error: (err) => {
        console.error('❌ Error al obtener usuario por código:', err);
        // Intentar por ID numérico como fallback
        const numericId = parseInt(codeStr, 10);
        if (!isNaN(numericId)) {
          console.log('📡 Fallback: Intentando buscar por ID numérico:', numericId);
          this.apiService.getUserById(numericId).subscribe({
            next: (resById) => {
              if (resById.success && resById.data) {
                console.log('✅ Usuario encontrado por ID (fallback):', resById.data);
                this.openModal(resById.data, `Detalle: ${resById.data.name || codeStr}`, true);
              } else {
                this.fallbackOpenModal(codeStr);
              }
            },
            error: (errById) => {
              console.error('❌ Error al obtener usuario por ID (fallback):', errById);
              this.fallbackOpenModal(codeStr);
            }
          });
        } else {
          this.fallbackOpenModal(codeStr);
        }
      }
    });
  }

  /**
   * 🔥 Método fallback: abre el modal con los datos del árbol o la lista de puntos
   */
  private fallbackOpenModal(codeStr: string): void {
    const fallbackUser = this.findUserInTree(codeStr) || this.findUserInListPoints(codeStr);
    if (fallbackUser) {
      this.openModal(fallbackUser, `Detalle: ${fallbackUser.name || codeStr}`, true);
    } else {
      console.error('❌ Usuario no encontrado en ninguna fuente:', codeStr);
    }
  }

  /**
   * 🔥 CORREGIDO: Abre el modal de detalle
   * @param user Objeto del usuario
   * @param title Título del modal
   * @param sendTree Indica si debe enviar el árbol de la red (true para socios, false para perfil propio)
   */
  private openModal(user: any, title: string, sendTree: boolean = true) {
    const userData = user.data || user;
    const userCode = userData.id || userData.uuid || '';
    const userCodeStr = String(userCode);

    console.log('📌 ABRIENDO MODAL PARA CÓDIGO:', userCodeStr);
    console.log('📌 Datos completos del usuario:', userData);
    console.log('📌 Enviar árbol de red:', sendTree);

    // 🔥 OBTENER PUNTOS DESDE USER_DETAIL (ENVIADO POR EL BACKEND)
    const userDetail = userData.user_detail || {};
    const pts = userData.points || {};

    console.log('📌 user_detail RECIBIDO EN OPENMODAL:', userDetail);
    console.log('📌 points RECIBIDOS EN OPENMODAL:', pts);

    let personales = Number(userDetail.puntos_personales ?? pts.personal ?? 0);
    let redTotal = Number(userDetail.puntos_red ?? pts.pointGroup ?? 0);
    let granTotalPuntos = Number(userDetail.total_puntos ?? pts.total_general ?? 0);

    // 🔥 PAQUETES
    let packs = [];
    const userPacks = pts?.compra?.detalles || [];
    const paymentPack = userData.payment?.payment_order?.pack;
    
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
        fecha: userData.payment?.created_at || new Date().toISOString()
      });
    }
    
    if (packs.length === 0 && userData.package_name) {
      packs.push({
        paquete: userData.package_name || 'Plan Base',
        puntos: personales || 0,
        fecha: userData.created_at || new Date().toISOString()
      });
    }
    
    if (packs.length === 0) {
      packs.push({
        paquete: 'Sin paquetes activos',
        puntos: 0,
        fecha: new Date().toISOString()
      });
    }

    // 🔥 CREAR OBJETO PARA EL MODAL
    const userForModal = {
      ...userData,
      name: userData.name || 'Usuario',
      uuid: userData.uuid || userData.id || '',
      email: userData.email || '',
      photo: userData.photo || this.fallback,
      points: pts,
      totalPoints: userData.totalPoints || granTotalPuntos,
      payment: userData.payment || userData.payment_active,
      payment_active: userData.payment_active || userData.payment,
      active: userData.active || false,
      package_name: userData.package_name || '',
      user_detail: userDetail
    };

    console.log('📌 Enviando al modal (datos filtrados):', {
      userModel: userForModal,
      user_detail: userDetail,
      points: pts,
      sendTree: sendTree
    });

    // 🔥 DECISIÓN CLAVE: SI ES SOCIO, ENVÍO EL ÁRBOL. SI ES YO, NO LO ENVÍO.
    const treeToSend = sendTree ? this.listPoints : [];

    this.nzModalService.create({
      nzTitle: title,
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzWidth: '450px',
      nzData: {
        userModel: userForModal,
        listPoints: treeToSend, // ✅ Ahora el árbol se envía solo cuando es necesario
        paquetes: packs,
        paymentOrder: userForModal.payment || userForModal.payment_active
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