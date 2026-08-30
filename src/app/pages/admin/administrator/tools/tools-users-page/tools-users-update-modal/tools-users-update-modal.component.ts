import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
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
  @Output() updated: EventEmitter<void> = new EventEmitter<void>();

  validateForm: FormGroup;
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  productPlans: Array<any> = [];
  servicePlans: Array<any> = [];
  
  planList: Array<PackModel> = [];
  loadingSave: boolean = false;
  isAdmin: boolean = Number(localStorage.getItem('admin')) === 1;
  isEmailEditable: boolean = false;

  isSponsorNew: boolean = false;
  loadingSearch: boolean = false;
  avatarUrlNewSponsor: string = CONSTANTS.IMAGE.FALLBACK;

  isSponsordata: boolean = false;

  currentPackId: string | null = null;
  currentServiceId: string | null = null;
  currentPackName: string = '';
  currentServiceName: string = '';
  productOwned: boolean = false;
  productActive: boolean = false;
  serviceOwned: boolean = false;
  serviceActive: boolean = false;

  showPackEdit: boolean = false;
  showServiceEdit: boolean = false;

  // Variable para guardar el estado anterior y saber qué se actualizó
  private previousPackId: string | null = null;
  private previousServiceId: string | null = null;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private fb: FormBuilder
  ) {
    this.validateForm = this.fb.group({
      fullname: [null, [Validators.required]],
      email: [null, [Validators.required, Validators.email]],
      packActive: [null],
      serviceActive: [null],
      sponsorNew: [""]
    });
  }

  ngOnInit(): void {
    // 🔥 Cargamos los datos COMPLETOS del usuario llamando al endpoint /users/{id} (SHOW)
    this.loadUserFullData();
  }

  // 🔥 NUEVO: Obtiene los datos completos del usuario desde el backend usando el endpoint SHOW
  public loadUserFullData(): void {
    // Usamos el ID del usuario, no el código, para obtener el objeto completo con servicios
    this.apiService.getUserById(this.userModel.id).subscribe(
      (response) => {
        if (response.success) {
          // Combinamos el detalle con la fila original. Algunos usuarios sin
          // compra reciben sponsor_code en el listado, pero el SHOW puede
          // omitirlo; reemplazar el objeto hacía que se perdiera ese dato.
          this.userModel = {
            ...this.userModel,
            ...response.data
          };
          // Ahora cargamos los planes y actualizamos el formulario con los datos reales
          this.loadPlansAndPatch();
        } else {
          console.error('No se encontró el usuario con el ID:', this.userModel.id);
        }
      },
      (error) => {
        console.error('Error al cargar datos completos del usuario:', error);
        // Fallback: Si falla el show, intentamos con el findAll como antes
        this.loadUserFullDataFallback();
      }
    );
  }

  // 🔥 FALLBACK: Si el endpoint SHOW falla, intentamos con el método anterior
  public loadUserFullDataFallback(): void {
    this.apiService.getUserByCode(this.userModel.uuid).subscribe(
      (response) => {
        if (response.success && response.data.items && response.data.items.length > 0) {
          this.userModel = {
            ...this.userModel,
            ...response.data.items[0]
          };
          this.loadPlansAndPatch();
        }
      },
      (error) => console.error('Error en fallback:', error)
    );
  }

  // Carga los planes y parcha el formulario
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

        const packsByCategory = (this.userModel as any).packs_by_category || {};
        const productData = packsByCategory.product;
        const serviceData = packsByCategory.service;

        this.productOwned = productData?.owned === true;
        this.productActive = productData?.active === true;
        this.serviceOwned = serviceData?.owned === true;
        this.serviceActive = serviceData?.active === true;

        this.currentPackId = this.productOwned ? productData?.pack?.id || null : null;
        this.currentPackName = this.productOwned ? productData?.pack?.title || 'Sin plan' : 'Sin plan';
        this.currentServiceId = this.serviceOwned ? serviceData?.pack?.id || null : null;
        this.currentServiceName = this.serviceOwned ? serviceData?.pack?.title || 'Ninguno' : 'Ninguno';
        this.isSponsordata = !this.productOwned && !this.serviceOwned;

        // En la primera activación mostramos inmediatamente el selector para
        // que el administrador pueda asignar el pack inicial.
        if (!this.productOwned) {
          this.showPackEdit = true;
        }

        this.previousPackId = this.currentPackId;
        this.previousServiceId = this.currentServiceId;

        const activePackId = this.currentPackId;
        const activeServiceId = this.currentServiceId;

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
        const user: any = this.userModel;
        const currentSponsor =
          user.sponsor_code ??
          user.sponsor_uuid ??
          user.sponsor?.uuid ??
          user.payment?.payment_order?.sponsor_code ??
          '';

        // --- PATCH ---
        this.validateForm.patchValue({
          fullname: this.userModel.name,
          email: this.userModel.email,
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

  public enableEmailEditing(): void {
    if (!this.isAdmin) return;

    this.isEmailEditable = true;
    setTimeout(() => {
      const emailInput = document.getElementById('user-email-input') as HTMLInputElement | null;
      emailInput?.focus();
      emailInput?.select();
    });
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
    const file = event?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set('file', file);
    this.apiService.postAuthenticationAvatar(formData).subscribe(
      (response) => {
        saveSessionStoraheUser({ name: response.data.name, photo: response.data?.file?.path ?? "" });
        this.avatarUrl = environment.hostUrl + '/storage/' + response.data.file.path;
      },
      (error) => this.modalService.error(error?.message ?? 'Error al subir imagen')
    );
  }

  public onPackChange(value: string | number): void {
    this.validateForm.get('packActive')?.setValue(value === 0 ? null : value);
  }

  public onServiceChange(value: string | number): void {
    this.validateForm.get('serviceActive')?.setValue(value === 0 ? null : value);
  }

  private resetLocalState(): void {
    this.showPackEdit = false;
    this.showServiceEdit = false;
    this.isEmailEditable = false;
  }

  private getBackendErrorMessage(error: any): string {
    if (typeof error === 'string') return error;

    const responseError = error?.error ?? error;
    const validationErrors = responseError?.errors;

    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors)
        .reduce<string[]>((result, value) => {
          if (Array.isArray(value)) return result.concat(value.map(String));
          if (value !== null && value !== undefined) result.push(String(value));
          return result;
        }, []);

      if (messages.length > 0) return messages.join('\n');
    }

    return responseError?.message
      || responseError?.error_description
      || error?.message
      || 'No se pudo actualizar al usuario.';
  }

  public onBack(): void {
    this.resetLocalState();
    this.back.emit((new Date()).getTime());
  }

  public onSave(): void {
    if (this.validateForm.invalid) {
      this.validateForm.markAllAsTouched();
      return;
    }

    let packValue = this.validateForm.get('packActive')?.value;
    let serviceValue = this.validateForm.get('serviceActive')?.value;
    const sponsorValue = this.validateForm.get('sponsorNew')?.value;

    if (packValue === 0 || packValue === '0' || packValue === null || packValue === undefined) packValue = null;
    if (serviceValue === 0 || serviceValue === '0' || serviceValue === null || serviceValue === undefined) serviceValue = null;

    if (!this.productOwned && !this.serviceOwned) {
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
      userEmail: this.validateForm.get('email')?.value,
      packId: packValue,
      serviceId: serviceValue,
      sponsorNew: sponsorValue || ""
    };

    this.apiService.postUserModify(payload).subscribe(
      (response) => {
        if (!response?.success) {
          this.loadingSave = false;
          this.modalService.error(this.getBackendErrorMessage(response));
          return;
        }

        this.resetLocalState();
        
        // 🔥 MENSAJES DE ÉXITO PERSONALIZADOS
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
        
        this.loadingSave = false;

        // Cerramos primero el editor para que el mensaje de éxito permanezca visible.
        this.updated.emit();
        this.nzModalService.closeAll();
        this.modalService.success(`✓ ${successMessage}`);
      },
      (error) => {
        console.error(error);
        const errorMessage = this.getBackendErrorMessage(error);
        this.modalService.error(`✕ ${errorMessage}`);
        this.loadingSave = false;
      }
    );
  }
}
