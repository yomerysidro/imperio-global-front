import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { ImageCropperUploadComponent } from '@shared/components/image-cropper-upload/image-cropper-upload.component';
import { UserTreeDetailComponent } from '@shared/components/user-tree-detail/user-tree-detail.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { saveSessionStoraheUser } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { forkJoin } from 'rxjs';
import { ToolsUserAddModalComponent } from '../tools-user-add-modal/tools-user-add-modal.component';

const titleModalGeneral = "Selecciona qué deseas modificar";

@Component({
  selector: 'app-tools-users-page',
  templateUrl: './tools-users-page.component.html',
  styleUrls: ['./tools-users-page.component.scss']
})
export class ToolsUsersPageComponent implements OnInit {

  pageIndex: number = CONSTANTS.PAGINATION.PAGE_INDEX;
  pageSize: number = CONSTANTS.PAGINATION.PAGE_SIZE;
  sortProperty: string = '';
  sortPropertyName: string = '';
  totalRecord: number = 0;

  tableProductLoading: boolean = false;
  tableProducts: Array<UserModel> = [];

  CONSTANTS = CONSTANTS;
  environment = environment;
  codeUser: string = "";
  nameUser: string = "";
  initLoad: boolean = true;

  _listPoints: Array<any> = [];
  userModel: UserModel;

  tabModal: number = 0;
  tabTitle: string = titleModalGeneral;

  planSelected: any = null;

  planList: Array<any> = [];
  loadingDesactive: boolean = false;
  canReactivatePoints: boolean = false;
  canDeactivatePoints: boolean = false;
  authUser: any = null;
  deletingUser: boolean = false;
  deletionMode: 'user' | 'network' | null = null;
  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private fb: FormBuilder
  ) {

  }

  ngOnInit(): void {

    this.loadData();
  }

  public onSearch(): void {
    this.tableProductLoading = true;
    this.apiService.getUsersFindAll({ code: this.codeUser.trim(), name: this.nameUser.trim(), plan: this.planSelected ?? "", limit: this.pageSize, page: this.pageIndex }).subscribe(
      (response) => {
        if (response.success) {
          this.totalRecord = response.data.pagination.total;
          this.tableProducts = response.data.items;
        }
        this.tableProductLoading = false;

      }, (error) => {
        this.modalService.error(error.message ?? "")
        this.tableProductLoading = false;
      }
    )
  }

  public loadData(): void {
    this.tableProductLoading = true;
    forkJoin(
      this.apiService.getPointList({}),
      this.apiService.getUsersFindAll({ code: this.codeUser.trim(), name: this.nameUser.trim(), plan: this.planSelected ?? "", limit: this.pageSize, page: this.pageIndex }),
      this.apiService.getPlansSearch({}),
      this.apiService.getAuthenticationUser()
    ).subscribe(
      ([listPoints, usersList, planList, authResponse]) => {
        this._listPoints = listPoints.data;
        const authenticatedUser: any = authResponse?.data;
        this.authUser = authenticatedUser
          ? {
              ...authenticatedUser,
              is_admin: authenticatedUser?.is_admin === true || Number(authenticatedUser?.is_admin) === 1,
              admin: authenticatedUser?.admin === true || Number(authenticatedUser?.admin) === 1
            }
          : null;

        if (usersList.success) {
          this.totalRecord = usersList.data.pagination.total;
          // FILTRO DE INTEGRIDAD: Limpiamos los puntos fantasma de la tabla
          this.tableProducts = usersList.data.items;
        }
        this.tableProductLoading = false;

        this.planList = planList.data

        this.initLoad = false;
      }
    )
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    let sortOrder;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    if (sort[0]?.value !== null) {
      if (sort[0]?.value == 'ascend') sortOrder = 'ASC';
      if (sort[0]?.value == 'descend') sortOrder = 'DESC';

      if (sort[0]?.key === 'name') this.sortProperty = 'name ' + sortOrder;

    }

    console.log(pageSize, pageIndex, sort, filter)

    if (!this.initLoad) this.onSearch();
  }

  public onSeletedUSer(usercode: string, userModel: any): void {
    if (usercode == "-1") return;

    // Calculamos todos los puntos incluyendo servicios para el Modal
    const pts = userModel?.points;
    
    // Suma de patrocinio (Híbrido)
    const patrocinioTotal = Number(pts?.patrocinio || 0) + Number(pts?.patrocinioServicio || 0);
    
    // Suma de residual (Híbrido)
    const residualTotal = Number(pts?.residual || 0) + Number(pts?.residualServicio || 0);
    
    // Puntos Personales
    const personales = Number(pts?.compra?.total_puntos || 0) + Number(pts?.personal || 0);
    
    // Puntos de Red (Volumen grupal)
    const red = Number(pts?.pointGroup || 0);
    
    // Gran Total (Lo que ves en la tabla principal)
    const granTotal = Number(pts?.total_general ?? userModel?.totalPoints ?? red);

    this.nzModalService.create({
      nzTitle: 'Detalle del Usuario',
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzData: {
        userModel: userModel,
        listPoints: this._listPoints,
        paymentOrder: userModel?.payment,
        pointTotal: personales,       
        pointRed: red,
        granTotalPuntos: granTotal,  
        paquetes: pts?.compra?.detalles || []
      }
    });
  }

  public listPoints(): void {
    this.tableProductLoading = true;
    this.apiService.getPointList({}).subscribe(
      (response) => {
        this._listPoints = response.data;
        this.onSearch();
      }, (error) => {
      }
    )
  }

  public calculatePoints(userCode: string): number {
    let total: number = 0;
    let pointPatrocinio = 0, pointResudial = 0, pointCompra = 0, pointGroup = 0;
    // ====== PATROCINIO
    let patrocinio = this._listPoints.filter(p => p.sponsor_code?.toLowerCase() == userCode.toLowerCase() && p.type == 'P')
    if (patrocinio.length > 0) {
      pointPatrocinio = patrocinio.map(m => m.point).reduce((a, c) => a + c);
    } else {
      pointPatrocinio = 0;
    }

    // ====== RESIDUAL
    let residual = this._listPoints.filter(p => p.sponsor_code?.toLowerCase() == userCode.toLowerCase() && p.type == 'R')
    if (residual.length > 0) {
      pointResudial = residual.map(m => m.point).reduce((a, c) => a + c);
    } else {
      pointResudial = 0;
    }

    // ====== PERSONALES

    let buy = this._listPoints.filter(p => p.user_code?.toLowerCase() == userCode.toLowerCase() && p.type == 'B')
    if (buy.length > 0) {
      pointCompra = buy.map(m => m.point).reduce((a, c) => a + c);
    } else {
      pointCompra = 0;
    }

    // ====== GRUPALES
    let grupales = this._listPoints.filter(p => p.sponsor_code?.toLowerCase() == userCode.toLowerCase() && p.type == 'G');
    if (grupales.length > 0) {
      pointGroup = grupales.map(m => m.point).reduce((a, c) => a + c);
    } else {
      pointGroup = 0;
    }

    return pointPatrocinio + pointResudial + pointCompra + pointGroup;
  }

  public onDetailUser(userModel: UserModel, tplContent: TemplateRef<{}>): void {
    this.modalUserOptions(0);
    this.userModel = userModel;
    this.canReactivatePoints = false;
    this.canDeactivatePoints = userModel.manual_reactivation_active === true;
    this.loadReactivationActions(userModel.uuid);

    const modal = this.nzModalService.create({
      nzTitle: null,
      nzContent: tplContent,
      nzFooter: null,
      nzMaskClosable: false,
      nzClosable: false,
      nzWidth: "450px",
      nzData: {

      },
    });

    // modal.afterOpen.subscribe( () => {
    //   this.avatarUrl = userModel.file?.path ? environment.hostUrl + '/storage/' + userModel.file?.path : CONSTANTS.IMAGE.FALLBACK;
    //   this.validateForm.patchValue({
    //     fullname: userModel.name,
    //     packActive: userModel?.payment?.payment_order?.pack?.id ?? "0"
    //   });
    //   this.userModel = userModel;
    // })

    modal.afterClose.subscribe(() => {
      this.canReactivatePoints = false;
      this.canDeactivatePoints = false;
      this.onSearch();
    })
  }

  private loadReactivationActions(userCode: string): void {
    this.apiService.getUserReactivationStatus(userCode).subscribe(
      (response) => {
        const isUserActive = !!response?.data?.is_active;
        this.canReactivatePoints = !isUserActive && !!response?.data?.actions?.can_reactivate;
        this.canDeactivatePoints = response?.data?.manual_reactivation_active === true;
      },
      () => {
        this.canReactivatePoints = false;
        this.canDeactivatePoints = this.userModel?.manual_reactivation_active === true;
      }
    );
  }

  public modalDesactive(): void {
    this.modalService.confirm(
      "¿Desea activar este usuario?",
      () => {
        this.loadingDesactive = true;
        this.apiService.postUsercodeActiveResidual({ userCode: this.userModel?.uuid }).subscribe(
          (res) => {
            this.onSearch();
            this.nzModalService.closeAll();
            this.loadingDesactive = false;
          },
          (error) => {
            this.loadingDesactive = false;
          }
        )
      }
    )
  }

  public deactivateUser(): void {
    this.modalService.confirm(
      "¿Desea desactivar los puntos de esta activación mensual? No se modificará el usuario, su red, su paquete, su historial ni su rango.",
      () => {
        this.loadingDesactive = true;
        this.apiService.postUsercodeDesactive({ userCode: this.userModel?.uuid }).subscribe(
          () => {
            this.loadingDesactive = false;
            this.nzModalService.closeAll();
            this.modalService.success("Puntos de la activación mensual desactivados correctamente");
            this.onSearch();
          },
          (error) => {
            this.loadingDesactive = false;
            this.modalService.error(error?.message ?? "No se pudieron desactivar los puntos");
          }
        );
      }
    );
  }

  public modalUserOptions(tab: number): void {
    if (tab == 4 && !this.canReactivatePoints) {
      this.modalService.warning("Este socio todavía está activo. Podrá reactivar sus puntos cuando termine su periodo mensual y quede inactivo.");
      return;
    }

    if (tab == 2) {
      if (this.userModel?.payment == null) {
        this.modalService.warning("Este usuario debe de tener un plan comprado, para continuar.")
        return;
      }
    }

    switch (tab) {
      case 1: this.tabTitle = "Modificar Datos de Usuario";
        break;
      case 2: this.tabTitle = "Modificar Patrocinador de Usuario";
        break;
      case 4: this.tabTitle = "Reactivar, Simulando compra en tienda";
        break;
      default: this.tabTitle = titleModalGeneral;
        break;
    }
    this.tabModal = tab;
  }

  public onClose(): void {
    this.modalUserOptions(0);
    this.nzModalService.closeAll();
  }

  public get canDeleteSelectedUser(): boolean {
    const esAdministrador =
      this.authUser?.is_admin === true || this.authUser?.admin === true;

    if (!esAdministrador || !this.userModel) return false;

    const selectedUser: any = this.userModel;
    const isProtectedAdmin =
      selectedUser?.is_admin === true || Number(selectedUser?.is_admin) === 1 ||
      selectedUser?.admin === true || Number(selectedUser?.admin) === 1;
    const protectedIdentifiers = [selectedUser?.uuid, selectedUser?.name]
      .map(value => String(value || '').trim().toLowerCase());
    const isProtectedAccount = protectedIdentifiers.some(
      value => value === 'dosb' || value === 'wadz'
    );

    return !isProtectedAdmin && !isProtectedAccount;
  }

  public confirmDeleteUser(deleteNetwork: boolean): void {
    if (this.deletingUser || !this.canDeleteSelectedUser) return;

    const message = deleteNetwork
      ? '¿Desea eliminar a este usuario y TODA su red?\n\nSe eliminarán permanentemente todos sus descendientes y sus operaciones.\n\nEsta acción no se puede deshacer.'
      : '¿Desea eliminar únicamente a este usuario?\n\nSe eliminarán su cuenta, órdenes, paquetes asignados y puntos. Sus hijos serán reasignados automáticamente a su patrocinador.\n\nEsta acción no se puede deshacer.';

    this.modalService.confirm(message, () => this.executeUserDeletion(deleteNetwork));
  }

  private executeUserDeletion(deleteNetwork: boolean): void {
    if (this.deletingUser || !this.canDeleteSelectedUser) return;

    const userCode = this.userModel?.uuid;
    if (!userCode) {
      this.modalService.error('El usuario seleccionado no tiene un código válido.');
      return;
    }

    this.deletingUser = true;
    this.deletionMode = deleteNetwork ? 'network' : 'user';

    const request$ = deleteNetwork
      ? this.apiService.deleteUserNetwork(userCode)
      : this.apiService.deleteUser(userCode);

    request$.subscribe({
      next: response => {
        if (!response?.success) {
          this.deletingUser = false;
          this.deletionMode = null;
          this.modalService.error(response?.message || 'No se pudo eliminar al usuario.');
          return;
        }

        this.refreshUsersAndTreeData(() => {
          this.deletingUser = false;
          this.deletionMode = null;
          this.nzModalService.closeAll();
          this.modalService.success(response?.message || 'Usuario eliminado correctamente.');
        });
      },
      error: error => {
        this.deletingUser = false;
        this.deletionMode = null;
        this.modalService.error(this.getDeletionErrorMessage(error));
      }
    });
  }

  private refreshUsersAndTreeData(onSuccess: () => void): void {
    this.tableProductLoading = true;
    forkJoin({
      users: this.apiService.getUsersFindAll({
        code: this.codeUser.trim(),
        name: this.nameUser.trim(),
        plan: this.planSelected ?? '',
        limit: this.pageSize,
        page: this.pageIndex
      }),
      tree: this.apiService.getPointList({})
    }).subscribe({
      next: ({ users, tree }) => {
        if (users?.success) {
          this.totalRecord = users.data.pagination.total;
          this.tableProducts = users.data.items;
        }
        this._listPoints = tree?.data || [];
        this.tableProductLoading = false;
        onSuccess();
      },
      error: error => {
        this.tableProductLoading = false;
        this.deletingUser = false;
        this.deletionMode = null;
        this.modalService.error(error?.message || 'El usuario fue eliminado, pero no se pudieron actualizar los datos.');
      }
    });
  }

  private getDeletionErrorMessage(error: any): string {
    if (typeof error === 'string') return error;

    const backendMessage = error?.message || error?.error?.message;
    if (backendMessage) return backendMessage;

    switch (error?.status) {
      case 403: return 'No tiene permisos de administrador para realizar esta acción.';
      case 404: return 'El usuario no fue encontrado.';
      case 422: return 'La cuenta está protegida o no existe un patrocinador válido para reasignar a sus hijos.';
      default: return 'Error interno. No se realizó una eliminación parcial.';
    }
  }

  public onBack(time: number): void {
    this.modalUserOptions(0)
  }

  public onChangePlan(plan: any): void {
    this.onSearch();
  }

  public onPaymentOfflineConfirm(uuid: string): void {
    this.modalService.confirm("¿Desea activar la invitacion del usuario?",
      () => {
        this.apiService.postPaymentConfirmOffline({ sponsorId: uuid }).subscribe(
          (response) => {
            this.nzModalService.closeAll();
            this.modalService.success("Usuario aceptado");
          },
          (error) => {
            this.modalService.error(error?.message ?? "Error");
            this.nzModalService.closeAll();
          }
        )
      }
    )
  }

  onAddUser(): void {
    const modal = this.nzModalService.create({
      nzTitle: "Agregar Usuario",
      nzContent: ToolsUserAddModalComponent,
      nzFooter: null,
      nzWidth: "550px",
      nzData: {

      },
    });

    modal.afterClose.subscribe(() => {
      this.onSearch();
    })
  }
}
