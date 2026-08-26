import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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
import { isUserMembershipActive } from '@shared/utilities/user-activity';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
  selector: 'app-tree-users-page',
  templateUrl: './tree-users-page.component.html',
  styleUrls: ['./tree-users-page.component.scss']
})
export class TreeUsersPageComponent implements OnInit {
  @ViewChild('treeViewport') treeViewport?: ElementRef<HTMLElement>;
  @ViewChild('treeContainer') treeContainer?: ElementRef<HTMLElement>;
  @ViewChild('treeView') treeView?: TreeViewComponent;

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

  treeSearch: string = '';
  searchMessage: string = '';
  highlightedNodeCode: string = '';
  treeZoom: number = 1;
  isFullScreen: boolean = false;

  get zoomPercent(): number {
    return Math.round(this.treeZoom * 100);
  }

  get treeCanvasWidth(): number {
    return Number(this.treeView?.tree?.width || 1) * this.treeZoom;
  }

  get treeCanvasHeight(): number {
    return Number(this.treeView?.tree?.height || 1) * this.treeZoom;
  }

  constructor(
    private apiService: ApiService,
    private nzModalService: NzModalService,
    private overlayContainer: OverlayContainer
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
          const allPoints = Array.isArray(pointsData?.volume_records)
            ? pointsData.volume_records
            : Array.isArray(pointsData?.point_records)
              ? pointsData.point_records
              : Array.isArray(points)
                ? points
                : [];
          
          this.listPoints = allPoints.filter(p => 
            p.type === 'B' || p.type === 'G' || p.type === 'COMPRA' || p.is_legacy === true
          );

 
          const myId = user?.uuid || getCodeUuid() || '';
          
          // 🔥 Construir árbol REAL (sin placeholders para los contadores)
          let realChildren = this.nodeTreeParse(this.listPoints, myId);
          
          // 🔥 CALCULAR ESTADÍSTICAS REALES (sin placeholders)
          const realStats = this.getTreeStats(realChildren);

          // 🔥 CONTADORES - USAR LOS VALORES DEL BACKEND PRIMERO
          this.usuarioDirectos = user?.directos !== undefined ? user.directos : realChildren.length;
          this.usuarioActivos = user?.activos !== undefined ? user.activos : realStats.active;
          this.usuarioTotal = user?.red_total !== undefined ? user.red_total : realStats.total;

        
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
            this.puntosPersonales = Number(user.points.personal ?? 0);
            this.puntosRed = Number(user.points.pointGroup ?? 0);
            this.puntosTotales = Number(user.points.total_general ?? user.totalPoints ?? 0);
            this.puntosPatrocinio = Number(user.points.patrocinioTotal ?? user.points.patrocinio ?? 0);
            this.puntosResidual = Number(user.points.residual ?? 0);
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
              email: user?.email,
              admin: !!user?.is_admin
            },
            active: isUserMembershipActive(user),
            selected: true,
            children: childrenForDisplay
          };

          this.isChart = true;
          this.scheduleInitialTreeCenter();
        }
      },
      error: (err) => {
        console.error("Error al cargar la red", err);
      }
    });
  }

  public searchTreeNode(): void {
    const term = this.treeSearch.trim().toLowerCase();
    if (!term) {
      this.searchMessage = 'Ingresa un ID o correo para buscar.';
      this.highlightedNodeCode = '';
      return;
    }

    const node = this.findTreeNodeByTerm(this.data, term);
    if (!node || String(node.data?.id || '').startsWith('-')) {
      this.highlightedNodeCode = '';
      this.searchMessage = 'No se encontró ningún afiliado con ese ID o correo.';
      return;
    }

    this.highlightedNodeCode = String(node.data.id);
    this.searchMessage = `Afiliado encontrado: ${node.data.email || node.data.id}`;
    setTimeout(() => this.centerHighlightedNode(), 0);
  }

  public clearTreeSearch(): void {
    this.treeSearch = '';
    this.searchMessage = '';
    this.highlightedNodeCode = '';
  }

  public zoomIn(): void {
    this.treeZoom = Math.min(1.5, Number((this.treeZoom + 0.1).toFixed(1)));
  }

  public zoomOut(): void {
    this.treeZoom = Math.max(0.6, Number((this.treeZoom - 0.1).toFixed(1)));
  }

  public resetTreeView(): void {
    this.treeZoom = 1;
    this.clearTreeSearch();
    this.scheduleInitialTreeCenter();
  }

  public async toggleFullScreen(): Promise<void> {
    const container = this.treeContainer?.nativeElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      this.moveOverlayToFullScreen();
    } else {
      await document.exitFullscreen();
    }
  }

  @HostListener('document:fullscreenchange')
  public onFullScreenChange(): void {
    this.isFullScreen = document.fullscreenElement === this.treeContainer?.nativeElement;
    if (this.isFullScreen) {
      this.moveOverlayToFullScreen();
    } else {
      this.restoreOverlayContainer();
    }
    this.scheduleInitialTreeCenter();
  }

  /**
   * Espera a que el componente del árbol termine de calcular su ancho y
   * coloca el nodo raíz en el centro horizontal del área visible.
   */
  private scheduleInitialTreeCenter(): void {
    this.treeZoom = 1;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.positionTreeFromLeft());
    });

    // La librería amplía el lienzo mientras dibuja niveles y conectores.
    [80, 220, 500].forEach(delay => {
      setTimeout(() => this.positionTreeFromLeft(), delay);
    });
  }

  private positionTreeFromLeft(): void {
    const viewport = this.treeViewport?.nativeElement;
    if (!viewport || !this.data?.data?.id) return;

    const rootCode = String(this.data.data.id);
    const rootNode = Array.from(
      viewport.querySelectorAll<HTMLElement>('[data-node-code]')
    ).find(element => element.dataset.nodeCode === rootCode);
    if (!rootNode) return;

    const viewportRect = viewport.getBoundingClientRect();
    const rootRect = rootNode.getBoundingClientRect();
    const desiredLeft = viewport.scrollLeft + rootRect.left - viewportRect.left - 24;

    viewport.scrollLeft = Math.max(0, desiredLeft);
    viewport.scrollTop = 0;
  }

  private centerTreeOnRoot(): void {
    const viewport = this.treeViewport?.nativeElement;
    if (!viewport || !this.data?.data?.id) return;

    const rootCode = String(this.data.data.id);
    const rootNode = Array.from(
      viewport.querySelectorAll<HTMLElement>('[data-node-code]')
    ).find(element => element.dataset.nodeCode === rootCode);

    if (!rootNode) return;

    const viewportRect = viewport.getBoundingClientRect();
    const rootRect = rootNode.getBoundingClientRect();
    const desiredLeft = viewport.scrollLeft
      + (rootRect.left - viewportRect.left)
      + (rootRect.width / 2)
      - (viewport.clientWidth / 2);

    const maximumLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollLeft = Math.min(maximumLeft, Math.max(0, desiredLeft));
    viewport.scrollTop = 0;
  }

  private findTreeNodeByTerm(node: IECONode, term: string): IECONode | null {
    if (!node) return null;
    const id = String(node.data?.id || '').toLowerCase();
    const email = String(node.data?.email || '').toLowerCase();
    if (id === term || email === term || id.includes(term) || email.includes(term)) return node;

    for (const child of node.children || []) {
      const found = this.findTreeNodeByTerm(child, term);
      if (found) return found;
    }
    return null;
  }

  private centerHighlightedNode(): void {
    const viewport = this.treeViewport?.nativeElement;
    if (!viewport || !this.highlightedNodeCode) return;

    const nodes = Array.from(viewport.querySelectorAll<HTMLElement>('[data-node-code]'));
    const target = nodes.find(element => element.dataset.nodeCode === this.highlightedNodeCode);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
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

  /** Parsea la lista plana usando la regla mensual común de actividad. */
private nodeTreeParse(listPoints: any[], code: string): Array<IECONode> {
  let tree: Array<IECONode> = [];

  const childrenPoints = listPoints.filter(p => {
    const isMatch = p.sponsor_code?.toLowerCase() === code.toLowerCase();
    const isValidType = p.type === 'B' || p.type === 'G' || p.type === 'COMPRA' || p.is_legacy === true;
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

    const isNodeActive = isUserMembershipActive(uHijo, point);

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
    this.openSelectedUser(usercode);
  }

  private openSelectedUser(usercode: string): void {
    if (!usercode || usercode.startsWith("-")) return;

    const codeStr = String(usercode);
    const codeUuid = getCodeUuid();
    const isSelf = codeUuid ? (codeStr.toLowerCase() === codeUuid.toLowerCase()) : false;

    this.apiService.getUserByCode(codeStr).subscribe({
      next: searchResponse => {
        const users = searchResponse?.data?.items || [];
        const selectedUser = users.find(user =>
          String(user?.uuid || '').toLowerCase() === codeStr.toLowerCase()
        );

        if (!searchResponse?.success || !selectedUser) {
          return;
        }

        const numericId = Number(selectedUser.id);
        if (!Number.isInteger(numericId) || numericId <= 0) {
          return;
        }

        this.apiService.getUserById(numericId).subscribe({
          next: detailResponse => {
            if (!detailResponse?.success || !detailResponse.data) {
              return;
            }

            const userData = detailResponse.data;
            const responseCode = String(userData.uuid || '').toLowerCase();
            if (responseCode !== codeStr.toLowerCase()) {
              return;
            }

            const title = isSelf ? 'Tu Detalle' : `Detalle: ${userData.email || userData.name || codeStr}`;
            this.openModal(userData, title, !isSelf);
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  /**
   * 🔥 Método fallback: abre el modal con los datos del árbol o la lista de puntos
   */
  private fallbackOpenModal(codeStr: string): void {
    const fallbackUser = this.findUserInTree(codeStr) || this.findUserInListPoints(codeStr);
    if (fallbackUser) {
      this.openModal(fallbackUser, `Detalle: ${fallbackUser.email || fallbackUser.name || codeStr}`, true);
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
    if (document.fullscreenElement === this.treeContainer?.nativeElement) {
      this.moveOverlayToFullScreen();
    }

    const userData = user.data || user;
    const userCode = userData.uuid || userData.id || '';
    const userCodeStr = String(userCode);


    // 🔥 OBTENER PUNTOS DESDE USER_DETAIL (ENVIADO POR EL BACKEND)
    const userDetail = userData.user_detail || {};
    const pts = userData.points || {};

    let personales = Number(userDetail.puntos_personales ?? pts.personal ?? 0);
    let redTotal = Number(userDetail.puntos_red ?? pts.pointGroup ?? 0);
    let granTotalPuntos = Number(userDetail.total_puntos ?? pts.total_general ?? 0);

    // La propiedad del pack es histórica y no depende de su actividad mensual.
    const categories = userData.packs_by_category || {};
    const packs = [categories.product, categories.service]
      .filter((category: any) => category?.owned === true && category?.pack)
      .map((category: any) => ({
        paquete: category.pack.title || 'Paquete',
        puntos: category.pack.points || 0,
        active: category.active === true
      }));

    // Fallbacks solo cuando packs_by_category no entregó ninguna propiedad válida.
    if (packs.length === 0) {
      const fallbackPack = userData.package_name
        ? { title: userData.package_name, points: personales }
        : userData.payment?.payment_order?.pack;

      if (fallbackPack) {
        packs.push({
          paquete: fallbackPack.title || 'Paquete',
          puntos: fallbackPack.points || 0,
          active: isUserMembershipActive(userData)
        });
      }
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
      is_admin: !!(userData.is_admin || userData.admin),
      active: isUserMembershipActive(userData),
      package_name: userData.package_name || '',
      user_detail: userDetail
    };

   

    // 🔥 DECISIÓN CLAVE: SI ES SOCIO, ENVÍO EL ÁRBOL. SI ES YO, NO LO ENVÍO.
    const treeToSend = sendTree ? this.listPoints : [];

    this.nzModalService.create({
      nzTitle: title,
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzWidth: '540px',
      nzClassName: 'user-detail-modal',
      nzData: {
        userModel: userForModal,
        listPoints: treeToSend, // ✅ Ahora el árbol se envía solo cuando es necesario
        paquetes: packs,
        paymentOrder: userForModal.payment || userForModal.payment_active
      }
    });
  }

  private moveOverlayToFullScreen(): void {
    const container = this.treeContainer?.nativeElement;
    if (!container) return;
    container.appendChild(this.overlayContainer.getContainerElement());
  }

  private restoreOverlayContainer(): void {
    const overlay = this.overlayContainer.getContainerElement();
    if (overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }
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
