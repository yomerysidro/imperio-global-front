import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { ImageCropperUploadComponent } from '@shared/components/image-cropper-upload/image-cropper-upload.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { saveSessionStoraheUser } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tools-users-update-modal',
  templateUrl: './tools-users-update-modal.component.html',
  styleUrls: ['./tools-users-update-modal.component.scss']
})
export class ToolsUsersUpdateModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Output() back: EventEmitter<number> = new EventEmitter<number>();

  validateForm: FormGroup;
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  productPlans: Array<any> = [];
  servicePlans: Array<any> = [];
  
  planList: Array<PackModel> = [];
  loadingSave: boolean = false;

  isSponsorNew: boolean = false;
  loadingSearch: boolean = false;
  avatarUrlNewSponsor: string = CONSTANTS.IMAGE.FALLBACK;

  isSponsordata: boolean = false;

  currentPackId: number | null = null;
  currentServiceId: number | null = null;
  currentPackName: string = '';
  currentServiceName: string = '';

  showPackEdit: boolean = false;
  showServiceEdit: boolean = false;

  // 🔥 Variable para guardar el estado anterior y saber qué se actualizó
  private previousPackId: number | null = null;
  private previousServiceId: number | null = null;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private fb: FormBuilder
  ) {
    this.validateForm = this.fb.group({
      fullname: [null, [Validators.required]],
      packActive: [null],
      serviceActive: [null],
      sponsorNew: [""]
    });
  }

  ngOnInit(): void {
    if (this.userModel.payment == null) this.isSponsordata = true;
    // 🔥 Cargamos los datos COMPLETOS del usuario llamando al backend directamente usando su código
    this.loadUserFullData();
  }

  // 🔥 NUEVO: Obtiene los datos completos del usuario desde el backend
  public loadUserFullData(): void {
    // Usamos el método getUserByCode que acabamos de agregar al servicio
    this.apiService.getUserByCode(this.userModel.uuid).subscribe(
      (response) => {
        if (response.success && response.data.items && response.data.items.length > 0) {
          // Reemplazamos el modelo incompleto con el modelo completo del backend (primer elemento del array)
          this.userModel = response.data.items[0];
          // Ahora cargamos los planes y actualizamos el formulario con los datos reales
          this.loadPlansAndPatch();
        } else {
          console.error('No se encontró el usuario con el código:', this.userModel.uuid);
        }
      },
      (error) => {
        console.error('Error al cargar datos completos del usuario:', error);
      }
    );
  }

  // 🔥 Mover la lógica de carga de planes a una función separada
  public loadPlansAndPatch(): void {
    this.apiService.getPlansSearch({}).subscribe(
      (planList) => {
        this.planList = planList.data;

        this.productPlans = this.planList.filter((p: any) => {
          const category = (p.category || '').toLowerCase();
          return category !== 'servicio';
        });
        
        this.servicePlans = this.planList.filter((p: any) => {
          const category = (p.category || '').toLowerCase();
          return category === 'servicio';
        });

        this.avatarUrl = this.userModel.file?.path
          ? environment.hostUrl + '/storage/' + this.userModel.file?.path
          : CONSTANTS.IMAGE.FALLBACK;

        // --- BÚSQUEDA DEL PRODUCTO ACTIVO ---
        let activePackId = null;
        let activePackName = '';
        
        if (this.userModel.payment?.payment_order?.pack?.id) {
          const pack = this.userModel.payment.payment_order.pack;
          if ((pack as any).category?.toLowerCase() !== 'servicio') {
            activePackId = pack.id;
            activePackName = pack.title || '';
          }
        }

        if (!activePackId && (this.userModel as any).payment_product_orders) {
          const productOrders = (this.userModel as any).payment_product_orders || [];
          const packFound = productOrders.find((o: any) => {
            return o.pack && (o.pack as any).category?.toLowerCase() !== 'servicio';
          });
          if (packFound) {
            activePackId = packFound.pack_id || packFound.pack?.id;
            activePackName = packFound.pack?.title || '';
          }
        }

        if (!activePackId) {
          const pts = (this.userModel as any).points;
          if (pts?.compra?.detalles) {
            const packActivo = pts.compra.detalles.find((d: any) => {
              const category = (d.category || '').toLowerCase();
              return category !== 'servicio';
            });
            if (packActivo) {
              activePackId = packActivo.pack_id || packActivo.id;
              activePackName = packActivo.title || packActivo.pack?.title || '';
            }
          }
        }

        // --- BÚSQUEDA DEL SERVICIO ACTIVO ---
        let activeServiceId = null;
        let activeServiceName = '';

        const paymentServices = (this.userModel as any).payment_services || [];
        if (paymentServices.length > 0) {
          const servicioActivo = paymentServices.find((s: any) => {
            return s.state === 2 && (s.pack as any).category?.toLowerCase() === 'servicio';
          });
          if (servicioActivo) {
            activeServiceId = servicioActivo.pack_id || servicioActivo.pack?.id;
            activeServiceName = servicioActivo.pack?.title || '';
          }
        }

        if (!activeServiceId) {
          const productOrders = (this.userModel as any).payment_product_orders || [];
          const servicio = productOrders.find((s: any) => {
            return s.pack && (s.pack as any).category?.toLowerCase() === 'servicio';
          });
          if (servicio) {
            activeServiceId = servicio.pack_id || servicio.pack?.id;
            activeServiceName = servicio.pack?.title || '';
          }
        }

        if (!activeServiceId) {
          const pts = (this.userModel as any).points;
          if (pts?.compra?.detalles) {
            const servicioActivo = pts.compra.detalles.find((d: any) => {
              const category = (d.category || d.tipo || '').toLowerCase();
              return category === 'servicio';
            });
            if (servicioActivo) {
              activeServiceId = servicioActivo.pack_id || servicioActivo.id;
              activeServiceName = servicioActivo.title || servicioActivo.pack?.title || '';
            }
          }
        }

        // 🔥 GUARDAMOS LOS IDS ACTUALES PARA COMPARAR DESPUÉS
        this.previousPackId = this.currentPackId;
        this.previousServiceId = this.currentServiceId;

        this.currentPackId = activePackId;
        this.currentPackName = activePackName || 'Sin plan';
        
        this.currentServiceId = activeServiceId;
        this.currentServiceName = activeServiceName || 'Ninguno';

        // --- AGREGAR A LAS LISTAS ---
        if (activePackId) {
          const exists = this.productPlans.some(p => p.id === activePackId);
          if (!exists) {
            const pack = this.planList.find(p => p.id === activePackId);
            if (pack) {
              this.productPlans.push(pack);
              if (!this.currentPackName) {
                this.currentPackName = pack.title || '';
              }
            }
          }
        }

        if (activeServiceId) {
          const exists = this.servicePlans.some(s => s.id === activeServiceId);
          if (!exists) {
            const service = this.planList.find(s => s.id === activeServiceId);
            if (service) {
              this.servicePlans.push(service);
              if (!this.currentServiceName) {
                this.currentServiceName = service.title || '';
              }
            }
          }
        }

        // --- PATROCINADOR ---
        let currentSponsor = '';
        if (this.userModel.payment?.payment_order?.sponsor_code) {
          currentSponsor = this.userModel.payment.payment_order.sponsor_code;
        } else if ((this.userModel as any).sponsor_code) {
          currentSponsor = (this.userModel as any).sponsor_code;
        }

        // --- PATCH ---
        this.validateForm.patchValue({
          fullname: this.userModel.name,
          packActive: activePackId,
          serviceActive: activeServiceId,
          sponsorNew: currentSponsor
        });
      },
      (error) => {
        console.error('Error al cargar planes:', error);
      }
    );
  }

  public getPackName(): string {
    if (!this.currentPackId) return 'Sin plan';
    if (this.currentPackName) return this.currentPackName;
    const pack = this.productPlans.find(p => p.id === this.currentPackId);
    return pack?.title || 'Sin plan';
  }

  public getServiceName(): string {
    if (!this.currentServiceId) return 'Ninguno';
    if (this.currentServiceName) return this.currentServiceName;
    const service = this.servicePlans.find(s => s.id === this.currentServiceId);
    return service?.title || 'Ninguno';
  }

  public togglePackEdit(): void {
    this.showPackEdit = !this.showPackEdit;
    this.validateForm.get('packActive')?.setValue(this.currentPackId);
  }

  public toggleServiceEdit(): void {
    this.showServiceEdit = !this.showServiceEdit;
    this.validateForm.get('serviceActive')?.setValue(this.currentServiceId);
  }

  public onSearchSponsor(): void {
    this.loadingSearch = true;
    this.isSponsorNew = false;
    this.apiService.getUsersSearch({ code: this.validateForm.get('sponsorNew').value ?? "" }).subscribe(
      (response) => {
        this.loadingSearch = false;
        if (response.success && response.data.length > 0) {
          this.isSponsorNew = true;
          this.avatarUrlNewSponsor = response.data[0]?.file?.path ? environment.hostUrl + '/storage/' + response.data[0]?.file?.path : CONSTANTS.IMAGE.FALLBACK;
        }
      },
      () => this.loadingSearch = false
    );
  }

  public fileChangeEvent(event: any): void {
    let modal = this.nzModalService.create({
      nzContent: ImageCropperUploadComponent,
      nzTitle: 'Imagen para cortar',
      nzMaskClosable: false,
      nzWidth: '520px', 
      nzClassName: 'user-edit-modal-custom', 
      nzData: { file: event },
      nzFooter: null
    });

    modal.afterClose.subscribe((result) => {
      if (result?.file != null) {
        let formData = new FormData();
        formData.set('file', result.file as any);
        this.apiService.postAuthenticationAvatar(formData).subscribe(
          (response) => {
            saveSessionStoraheUser({ name: response.data.name, photo: response.data?.file?.path ?? "" });
            this.avatarUrl = environment.hostUrl + '/storage/' + response.data.file.path;
          }, (error) => this.modalService.error(error?.message ?? 'Error al subir imagen')
        );
      }
    });
  }

  public onPackChange(value: number): void {
    this.validateForm.get('packActive')?.setValue(value === 0 ? null : value);
  }

  public onServiceChange(value: number): void {
    this.validateForm.get('serviceActive')?.setValue(value === 0 ? null : value);
  }

  private resetLocalState(): void {
    this.showPackEdit = false;
    this.showServiceEdit = false;
  }

  public onBack(): void {
    this.resetLocalState();
    this.back.emit((new Date()).getTime());
  }

  public onSave(): void {
    let packValue = this.validateForm.get('packActive')?.value;
    let serviceValue = this.validateForm.get('serviceActive')?.value;
    const sponsorValue = this.validateForm.get('sponsorNew')?.value;

    if (packValue === 0 || packValue === '0' || packValue === null || packValue === undefined) packValue = null;
    if (serviceValue === 0 || serviceValue === '0' || serviceValue === null || serviceValue === undefined) serviceValue = null;

    if (this.userModel.payment == null) {
      if (!packValue && !serviceValue) {
        this.modalService.warning("Seleccione al menos un Producto o una Membresía de Servicio.");
        return;
      }
      if (!sponsorValue) {
        this.modalService.warning("El código del patrocinador es requerido para la primera activación.");
        return;
      }
    }

    this.loadingSave = true;

    const payload = {
      userCode: this.userModel.uuid,
      userFullName: this.validateForm.get('fullname')?.value,
      packId: packValue,
      serviceId: serviceValue,
      sponsorNew: sponsorValue || ""
    };

    this.apiService.postUserModify(payload).subscribe(
      () => {
        this.resetLocalState();
        
        // 🔥 MENSAJES DE ÉXITO PERSONALIZADOS SEGÚN LO QUE SE HAYA ACTUALIZADO
        let successMessage = "¡Usuario actualizado con éxito!";
        const packChanged = packValue !== null && packValue !== this.previousPackId;
        const serviceChanged = serviceValue !== null && serviceValue !== this.previousServiceId;

        if (packChanged && serviceChanged) {
          successMessage = "Producto y Servicio actualizados y activados correctamente.";
        } else if (packChanged) {
          successMessage = "Producto activado correctamente.";
        } else if (serviceChanged) {
          successMessage = "Servicio activado correctamente.";
        }
        
        this.modalService.success(successMessage);
        this.loadingSave = false;

        // 🔥 CERRAMOS EL MODAL Y LE DECIMOS AL PADRE QUE RECARGUE LA TABLA
        this.nzModalService.closeAll();
        this.back.emit((new Date()).getTime());
      },
      (error) => {
        console.error(error);
        this.modalService.error("No se pudo procesar la solicitud (Error 404/500)");
        this.loadingSave = false;
      }
    );
  }
}