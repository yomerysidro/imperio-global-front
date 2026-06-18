import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { ImageCropperUploadComponent } from '@shared/components/image-cropper-upload/image-cropper-upload.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { saveSessionStorage, saveSessionStoraheUser } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ProfileInvitedModalComponent } from './profile-invited-modal/profile-invited-modal.component';
import { Router } from '@angular/router';
import { ToolsUserAddModalComponent } from '../../tools/tools-user-add-modal/tools-user-add-modal.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
  @ViewChild('templatePointPersonal', { read: TemplateRef }) templatePointPersonal!: TemplateRef<any>;
  @ViewChild('templatePointAfiliado', { read: TemplateRef }) templatePointAfiliado!: TemplateRef<any>;
  @ViewChild('renewModal', { read: TemplateRef }) renewModal!: TemplateRef<any>;
  @ViewChild('renewPatrocinioModal', { read: TemplateRef }) renewPatrocinioModal!: TemplateRef<any>;
  @ViewChild('templateHistoryPaymet', { read: TemplateRef }) templateHistoryPaymet!: TemplateRef<any>;

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;
  validateForm: FormGroup;
  userModel!: UserModel;
  isLoading: boolean = false;

  // === BONOS SEPARADOS (calculados desde patrocinio) ===
  pointServicio: number = 0;
  pointProducto: number = 0;
  
  // === BONOS EXISTENTES ===
  pointPatrocinio: number = 0;
  pointResudial: number = 0;
  pointCompra: number = 0;
  userCode: string = "";
  pointGroup: number = 0;
  pointInfinity: number = 0;
  pointPersonal: number = 0;
  pointAfiliado: number = 0;
  totalPointsPersonalGlobal: number = 0;
  bonosTotalesHistorico: number = 0;

  CONSTANTS = CONSTANTS;
  env = environment;
  isPointPersonal: boolean = false;
  currentDate: Date = new Date();
  oneMonthAgo: Date;
  isConfirmPatrocinio: boolean = false;
  productsPayments: Array<any> = [];
  granTotalPuntos: number = 0;
  activePackages: any[] = [];
  totalPoints: number = 0;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
    this.validateForm = this.fb.group({
      address: [null],
      email: [{ value: null, disabled: true }, [Validators.required, Validators.required]],
      phoneNumber: [null],
      city: [null],
      country: [null],
      gender: [null],
    });

    this.oneMonthAgo = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      this.currentDate.getDate()
    );
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  public loadOptions(): void {
    this.apiService.getOptionsSearch({ key: 'bono_global' }).subscribe(
      (res) => {
        if (res.success) {
          this.isPointPersonal = this.userModel?.payment?.payment_order.pack.id == res.data[0].option_value;
        }
      }, (error) => {}
    )
    this.apiService.getProductPaymnetDetailFindAll({ page: 1, limit: 10 }).subscribe(
      (res) => {
        this.productsPayments = res.data.items;
      }
    )
  }

  public loadCurrentUser(): void {
    this.apiService.getAuthenticationUser().subscribe(
      (response) => {
        this.userModel = response.data;
        this.avatarUrl = response.data.file?.path
          ? environment.hostUrl + '/storage/' + response.data.file?.path
          : CONSTANTS.IMAGE.FALLBACK;

        this.validateForm.patchValue({
          address: response.data.address,
          email: response.data.email,
          phoneNumber: response.data.phone,
          city: response.data.city,
          gender: response.data.gender,
          country: response.data.country,
        });

        this.userCode = response.data.uuid;

        // ============================================
        // LÓGICA DE PUNTOS - CORREGIDA
        // ============================================
        const pts = response.data.points;

        this.granTotalPuntos = response.data.totalPoints || 0;
        this.activePackages = pts.compra?.detalles || [];
        
        // Patrocinio viene de la API
        this.pointPatrocinio = Number(pts.patrocinio || 0);
        
        // Dividir patrocinio en Servicio (50%) y Producto (50%)
        this.pointServicio = this.pointPatrocinio * 0.5;
        this.pointProducto = this.pointPatrocinio * 0.5;
        
        this.pointResudial = Number(pts.residual || 0);
        this.pointPersonal = Number(pts.personal || 0);
        this.pointCompra = Number(pts.personal || 0);
        this.pointGroup = Number(pts.pointGroup || 0);
        this.pointInfinity = Number(pts.infinito || 0);
        this.pointAfiliado = Number(pts.pointAfiliado || 0);
        this.totalPointsPersonalGlobal = Number(pts.personalGlobal || 0);
        this.totalPoints = Number(response.data.totalPoints || 0);

        // Bonos totales históricos (Servicio + Producto + Residual)
        this.bonosTotalesHistorico = this.pointServicio + this.pointProducto + this.pointResudial;

        if (!this.userModel.package_name) {
          this.userModel.package_name = response.data.package_name;
        }

        this.loadOptions();
      },
      (error) => {
        this.modalService.error(error?.message ?? "Hubo un error al cargar el perfil");
      }
    );
  }

  // ============================================
  // GRAN TOTAL DE GANANCIAS (sin barrera)
  // ============================================
  getTotalEarnings(): number {
    return this.pointServicio + this.pointProducto + this.pointResudial + this.pointInfinity;
  }

  // ============================================
  // RANGOS CON ACTIVACIÓN AUTOMÁTICA
  // ============================================
  getNextRank(): string {
    const currentTitle = this.userModel?.range?.range?.title || 'Sin rango';
    const ranks = ['Sin rango', 'Bronce', 'Plata', 'Oro', 'Jade', 'Rubí', 'Diamante', 'Doble Diamante', 'Triple Diamante', 'Imperio Global'];
    const index = ranks.indexOf(currentTitle);
    if (index !== -1 && index < ranks.length - 1) {
      return ranks[index + 1];
    }
    return 'Máximo alcanzado';
  }

  getPointsToNextRank(): number {
    const ranks = [
      { title: 'Sin rango', points: 0 },
      { title: 'Bronce', points: 1000 },
      { title: 'Plata', points: 3600 },
      { title: 'Oro', points: 9600 },
      { title: 'Jade', points: 28600 },
      { title: 'Rubí', points: 78000 },
      { title: 'Diamante', points: 120000 },
      { title: 'Doble Diamante', points: 320000 },
      { title: 'Triple Diamante', points: 600000 },
      { title: 'Imperio Global', points: 1600000 }
    ];
    const currentTitle = this.userModel?.range?.range?.title || 'Sin rango';
    const currentIndex = ranks.findIndex(r => r.title === currentTitle);
    const currentPoints = this.totalPoints || 0;
    
    // Si ya alcanzó el rango actual, apuntar al siguiente automáticamente
    let targetIndex = currentIndex;
    if (currentIndex !== -1 && currentIndex < ranks.length - 1 && currentPoints >= ranks[currentIndex].points) {
      targetIndex = currentIndex + 1;
    }
    
    const nextPoints = targetIndex < ranks.length ? ranks[targetIndex].points : 0;
    if (nextPoints === 0) return 0;
    return Math.max(nextPoints - currentPoints, 0);
  }

  getRankProgress(): number {
    const ranks = [
      { title: 'Sin rango', points: 0 },
      { title: 'Bronce', points: 1000 },
      { title: 'Plata', points: 3600 },
      { title: 'Oro', points: 9600 },
      { title: 'Jade', points: 28600 },
      { title: 'Rubí', points: 78000 },
      { title: 'Diamante', points: 120000 },
      { title: 'Doble Diamante', points: 320000 },
      { title: 'Triple Diamante', points: 600000 },
      { title: 'Imperio Global', points: 1600000 }
    ];
    const currentTitle = this.userModel?.range?.range?.title || 'Sin rango';
    const currentIndex = ranks.findIndex(r => r.title === currentTitle);
    const currentPoints = this.totalPoints || 0;
    
    let targetPoints: number;
    if (currentIndex !== -1 && currentIndex < ranks.length - 1 && currentPoints >= ranks[currentIndex].points) {
      targetPoints = ranks[currentIndex + 1].points;
    } else {
      targetPoints = currentIndex !== -1 ? ranks[currentIndex].points : 1000;
    }
    
    if (targetPoints === 0) return 100;
    const progress = (currentPoints / targetPoints) * 100;
    return Math.min(Math.round(progress), 100);
  }

  getPersonalGoal(): number {
    const ranks = [
      { title: 'Sin rango', goal: 100 },
      { title: 'Bronce', goal: 500 },
      { title: 'Plata', goal: 1000 },
      { title: 'Oro', goal: 2500 },
      { title: 'Jade', goal: 5000 },
      { title: 'Rubí', goal: 10000 },
      { title: 'Diamante', goal: 25000 }
    ];
    const currentTitle = this.userModel?.range?.range?.title || 'Sin rango';
    const found = ranks.find(r => r.title === currentTitle);
    return found?.goal || 100;
  }

  getPersonalProgress(): number {
    const goal = this.getPersonalGoal();
    if (goal === 0) return 0;
    const progress = (this.pointPersonal / goal) * 100;
    return Math.min(Math.round(progress), 100);
  }

  getGroupalGoal(): number {
    const ranks = [
      { title: 'Sin rango', goal: 500 },
      { title: 'Bronce', goal: 1000 },
      { title: 'Plata', goal: 2500 },
      { title: 'Oro', goal: 5000 },
      { title: 'Jade', goal: 10000 },
      { title: 'Rubí', goal: 25000 },
      { title: 'Diamante', goal: 50000 }
    ];
    const currentTitle = this.userModel?.range?.range?.title || 'Sin rango';
    const found = ranks.find(r => r.title === currentTitle);
    return found?.goal || 500;
  }

  getGroupalProgress(): number {
    const goal = this.getGroupalGoal();
    if (goal === 0) return 0;
    const progress = (this.pointGroup / goal) * 100;
    return Math.min(Math.round(progress), 100);
  }

  private command(): any {
    const formValues = this.validateForm.value;
    return {
      address: formValues.address,
      phone: formValues.phoneNumber,
      city: formValues.city,
      country: formValues.country,
      gender: formValues.gender
    }
  }

  public onSubmit(): void {
    this.isLoading = true;
    this.apiService.putAuthenticationUpdate(this.command()).subscribe(
      (response) => {
        this.isLoading = false;
        this.modalService.success("Se guardo correctamente");
      }
    )
  }

  fileChangeEvent(event: any): void {
    let modal = this.nzModalService.create({
      nzContent: ImageCropperUploadComponent,
      nzTitle: 'Imagen para cortar',
      nzMaskClosable: false,
      nzData: { file: event },
      nzFooter: null
    });

    modal.afterClose.subscribe((result) => {
      if (result.file != null) {
        let formData = new FormData();
        formData.set('file', result.file as any);
        this.apiService.postAuthenticationAvatar(formData).subscribe(
          (response) => {
            saveSessionStoraheUser({ name: response.data.name, photo: response.data?.file?.path ?? "" });
            if (response.data.photo != null) {
              this.avatarUrl = environment.hostUrl + '/storage/' + response.data.file.path;
            } else {
              this.avatarUrl = CONSTANTS.IMAGE.FALLBACK;
            }
          }, (error) => {
            this.modalService.error(error?.message ?? 'Error al subir imagen')
          }
        )
      }
    });
  }

  copyMessage(val: string) {
    this.apiService.postGenerateLinkInvited({}).subscribe(
      (res) => {
        this.nzModalService.create({
          nzContent: ProfileInvitedModalComponent,
          nzTitle: "Inivitación",
          nzFooter: null,
          nzData: {
            userModel: this.userModel,
            codeInvited: res.data.code
          }
        })
      }
    )
  }

  public onInfoPointPresonal(): void {
    this.nzModalService.create({ nzTitle: "", nzFooter: null, nzContent: this.templatePointPersonal })
  }

  public onInfoPointAfiliado(): void {
    this.nzModalService.create({ nzTitle: "", nzFooter: null, nzContent: this.templatePointAfiliado })
  }

  public onRenewModal(): void {
    this.nzModalService.create({ nzTitle: "", nzFooter: null, nzContent: this.renewModal })
  }

  public onPaymentPlan(): void {
    this.nzModalService.closeAll();
    this.router.navigate(['/admin/marketplace']);
  }

  public onInfo(): void {
    this.modalService.info("Para evitar saturación del sistema, el monto del bono infinito se actualiza a mediodía y medianoche de cada día");
  }

  public onDownloadPdfProfile(): void {
    this.isLoading = true;
    this.apiService.postUserPdfProfile({}).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.data && response.data.base64) {
          const base64 = response.data.base64;
          const byteCharacters = atob(base64);
          const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, '_blank');
        }
      },
      (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || "No se encontraron registros del mes pasado para generar este PDF.";
        this.modalService.error(errorMessage);
      }
    )
  }

  public onPaymentMakerplace(): void {
    this.modalService.confirm(
      "Usted ya tiene un paquete activo. Para cambiar de paquete de afiliación, por favor, póngase en contacto con soporte de Imperio Global.",
      () => {
        this.nzModalService.closeAll();
        this.router.navigate(['/admin/marketplace']);
      }
    )
  }

  public onPointPatrocinio(): void {
    this.nzModalService.create({ nzTitle: "", nzFooter: null, nzContent: this.renewPatrocinioModal })
  }

  public onConfirmPatrocinio(): void {
    if (this.isConfirmPatrocinio) {
      this.apiService.postRequestPatrocinioGenerate({ points: this.pointPatrocinio }).subscribe(
        (response) => {
          if (response.success) {
            this.nzModalService.closeAll();
            this.loadCurrentUser();
          } else {
            this.modalService.info(response.message);
          }
        }, (error) => {}
      )
    } else {
      this.isConfirmPatrocinio = true;
    }
  }

  public onCancelPatrocinio(): void {
    this.nzModalService.closeAll();
  }

  onAddUser(): void {
    const modal = this.nzModalService.create({
      nzTitle: "Agregar Usuario",
      nzContent: ToolsUserAddModalComponent,
      nzFooter: null,
      nzWidth: "550px",
      nzData: {},
    });
    modal.afterClose.subscribe(() => {})
  }

  onTemplateHistory(): void {
    this.nzModalService.create({
      nzTitle: "Historial de compras recientes",
      nzFooter: null,
      nzContent: this.templateHistoryPaymet
    })
  }
}