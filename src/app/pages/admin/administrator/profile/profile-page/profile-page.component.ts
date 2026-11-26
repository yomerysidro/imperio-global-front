import { Component, DestroyRef, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '@env/environment';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';
import { ToolsUserAddModalComponent } from '../../tools/tools-user-add-modal/tools-user-add-modal.component';
import { isUserMembershipActive } from '@shared/utilities/user-activity';
import { EMPTY, combineLatest, forkJoin, timer } from 'rxjs';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { HttpService } from '@shared/services/http.service';
import { IResponse } from '@shared/services/interfaces/response.interface';

interface RankCycle {
  server_time: string;
  service: { closes_at: string };
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  @ViewChild('templatePointPersonal', { read: TemplateRef }) templatePointPersonal!: TemplateRef<any>;
  @ViewChild('templatePointAfiliado', { read: TemplateRef }) templatePointAfiliado!: TemplateRef<any>;
  @ViewChild('renewModal', { read: TemplateRef }) renewModal!: TemplateRef<any>;
  @ViewChild('renewPatrocinioModal', { read: TemplateRef }) renewPatrocinioModal!: TemplateRef<any>;
  @ViewChild('templateHistoryPaymet', { read: TemplateRef }) templateHistoryPaymet!: TemplateRef<any>;

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

  env = environment;
  isPointPersonal: boolean = false;
  currentDate: Date = new Date();
  cycleRemaining?: { days: number; hours: number; minutes: number; seconds: number };
  private readonly http = inject(HttpService);
  private readonly destroyRef = inject(DestroyRef);
  oneMonthAgo: Date;
  payoutMode: 'all' | 'partial' = 'all';
  payoutAmount: number = 0;
  loadingPayoutRequest: boolean = false;
  loadingPayoutBalance: boolean = false;
  selectedCommissionCategory: 'product' | 'service' = 'product';
  paymentBalance: any = { generated: 0, pending: 0, paid: 0, available: 0, last_paid_at: null, period: '' };
  paymentHistory: any[] = [];
  paymentMonth: number = new Date().getMonth() + 1;
  paymentYear: number = new Date().getFullYear();
  paymentMonths = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date(2026, index, 1)) }));
  paymentYears = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);
  productsPayments: Array<any> = [];
  granTotalPuntos: number = 0;
  activePackages: any[] = [];
  totalPoints: number = 0;
  totalComisiones: number = 0;
  availableWithdrawalBalance: number = 0;

  public isUserActive(): boolean {
    return isUserMembershipActive(this.userModel);
  }

  public getOwnedPackNames(): string {
    const categories = (this.userModel as any)?.packs_by_category;
    const names = [categories?.product, categories?.service]
      .filter(category => category?.pack && (category?.owned === true || category?.active === true))
      .map(category => category.pack.title)
      .filter(Boolean);
    if (names.length > 0) return [...new Set(names)].join(' / ');

    // Compatibilidad con la estructura tradicional del perfil.
    const legacyPack = (this.userModel as any)?.payment?.payment_order?.pack
      ?? (this.userModel as any)?.payment?.pack
      ?? (this.userModel as any)?.pack;
    return legacyPack?.title || legacyPack?.name || this.userModel?.package_name || 'Sin plan';
  }

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private router: Router
  ) {
    this.oneMonthAgo = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      this.currentDate.getDate()
    );
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.startCycleCountdown();
  }

  private startCycleCountdown(): void {
    const cycle$ = timer(0, 60000).pipe(
      exhaustMap(() => this.http.get<IResponse<RankCycle>>('/rank-progress').pipe(
        map(({ data }) => ({
          closesAt: Date.parse(data.service.closes_at),
          clockOffset: Date.parse(data.server_time) - Date.now(),
        })),
        catchError(() => EMPTY),
      )),
    );

    combineLatest([cycle$, timer(0, 1000)]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([{ closesAt, clockOffset }]) => {
      const remaining = Math.max(0, Math.ceil((closesAt - Date.now() - clockOffset) / 1000));
      this.cycleRemaining = Number.isFinite(remaining) ? {
        days: Math.floor(remaining / 86400),
        hours: Math.floor(remaining / 3600) % 24,
        minutes: Math.floor(remaining / 60) % 60,
        seconds: remaining % 60,
      } : undefined;
    });
  }

  public loadOptions(): void {
    this.apiService.getOptionsSearch({ key: 'bono_global' }).subscribe(
      (res) => {
        if (res && res.success && res.data && res.data.length > 0) {
          // Acceso seguro con ?. en toda la cadena
          const packId = this.userModel?.payment?.payment_order?.pack?.id;
          this.isPointPersonal = packId == res.data[0].option_value;
        }
      }, (error) => { console.error(error); }
    );

    this.apiService.getProductPaymnetDetailFindAll({ page: 1, limit: 10 }).subscribe(
      (res) => {
        // Validar que res y res.data existan antes de asignar
        this.productsPayments = res?.data?.items || [];
      }
    );
  }

  public loadCurrentUser(): void {
    this.apiService.getAuthenticationUser().subscribe(
      (response) => {
        this.userModel = response.data;

        console.log(response.data.points);

        this.userCode = response.data.uuid;

        // ============================================
        // 🔥 LÓGICA DE PUNTOS - CORREGIDA
        // ============================================
        // Usamos 'as any' para evitar errores de TypeScript
        const pts: any = response.data.points || {};
        const userDetail: any = response.data.user_detail || {};

        // 1. PUNTOS PERSONALES (del paquete del usuario)
        this.pointPersonal = Number(userDetail.puntos_personales ?? pts.personal ?? 0);
        this.pointCompra = this.pointPersonal;

        // 2. PUNTOS DE RED (grupales)
        this.pointGroup = Number(userDetail.puntos_red ?? pts.pointGroup ?? 0);

        // 3. PUNTOS RESIDUALES
        this.pointResudial = Number(userDetail.ganancia_residual ?? pts.residual ?? 0);

        // 4. 🔥 GANANCIA POR PATROCINIO (BONO) - NO se suma a puntos para rango
        this.pointPatrocinio = Number(userDetail.ganancia_patrocinio ?? pts.patrocinio ?? 0);

        // Dividir patrocinio en Servicio (50%) y Producto (50%) para visualización
        this.pointServicio = this.pointPatrocinio * 0.5;
        this.pointProducto = this.pointPatrocinio * 0.5;

        // 5. 🔥 TOTAL DE PUNTOS PARA EL RANGO = PERSONALES + RED + RESIDUALES (SIN PATROCINIO)
        this.totalPoints = Number(pts.total_general ?? userDetail.total_puntos ?? this.pointGroup);

        // 6. 🔥 GRAN TOTAL DE GANANCIAS = BONO PATROCINIO + RESIDUAL + INFINITO (PARA EL RESUMEN GLOBAL)
        this.pointInfinity = Number(userDetail.bono_infinito ?? pts.infinito ?? 0);
        this.totalComisiones = Number(
          userDetail.total_comisiones ??
          pts.total_comisiones ??
          (this.pointPatrocinio + this.pointResudial + this.pointInfinity)
        );
        this.granTotalPuntos = this.totalComisiones;

        // 7. OTROS PUNTOS
        this.pointAfiliado = Number(pts.pointAfiliado ?? 0);
        this.totalPointsPersonalGlobal = Number(pts.personalGlobal ?? 0);

        // 8. Bonos corresponde únicamente a la ganancia por patrocinio.
        this.bonosTotalesHistorico = this.pointPatrocinio;

        // 9. Packs adquiridos, independientemente de la actividad del mes.
        const categories = (response.data as any).packs_by_category || {};
        this.activePackages = [categories.product, categories.service]
          .filter((category: any) => category?.owned === true && category?.pack)
          .map((category: any) => ({ ...category.pack, active: category.active === true }));
        this.userModel.package_name = this.getOwnedPackNames();

        console.log('Puntos calculados:', {
          pointPersonal: this.pointPersonal,
          pointGroup: this.pointGroup,
          pointResudial: this.pointResudial,
          pointPatrocinio: this.pointPatrocinio,
          totalPoints: this.totalPoints,        // 250 - Para el rango
          granTotalPuntos: this.granTotalPuntos, // 50 + 0 + 0 = 50 - Para ganancias
          pointServicio: this.pointServicio,
          pointProducto: this.pointProducto,
          bonosTotalesHistorico: this.bonosTotalesHistorico
        });

        this.loadOptions();
        this.loadCurrentPaymentBalance();
        this.loadCurrentCommissionSummary();
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
    return this.availableWithdrawalBalance;
  }

  openCategoryCommissions(category: 'product' | 'service', details: TemplateRef<unknown>): void {
    this.selectedCommissionCategory = category;
    const label = category === 'product' ? 'Productos' : 'Servicios';
    this.nzModalService.create({
      nzTitle: 'Comisiones por ' + label,
      nzContent: details,
      nzWidth: 420,
      nzFooter: null,
    });
  }

  private loadCurrentPaymentBalance(): void {
    this.apiService.getRequestPatrocinioBalance().subscribe({
      next: response => {
        this.paymentBalance = response?.data ?? this.paymentBalance;
        this.availableWithdrawalBalance = Number(this.paymentBalance.available ?? 0);
      },
      error: () => this.availableWithdrawalBalance = 0
    });
  }

  private loadCurrentCommissionSummary(): void {
    const now = new Date();
    this.apiService.getCommissionSummary(now.getMonth() + 1, now.getFullYear()).subscribe({
      next: response => {
        const data = response?.data ?? {};
        this.pointPatrocinio = Number(data.patrocinio ?? 0);
        this.pointResudial = Number(data.residual ?? 0);
        this.pointInfinity = Number(data.infinito ?? 0);
        this.bonosTotalesHistorico = this.pointPatrocinio;
        this.pointServicio = this.pointPatrocinio * 0.5;
        this.pointProducto = this.pointPatrocinio * 0.5;
      },
      error: error => console.error('No se pudo cargar el resumen mensual de comisiones.', error)
    });
  }

  // ============================================
  // RANGOS CON ACTIVACIÓN AUTOMÁTICA
  // ============================================
  getNextRank(): string {
    return this.userModel?.next_range?.title ?? (this.userModel ? 'M\u00e1ximo alcanzado' : 'Cargando');
  }

  getPointsToNextRank(): number {
    return this.userModel?.points_to_next_range ?? 0;
  }

  getRankProgress(): number {
    return this.userModel?.range_progress ?? 0;
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
    const now = new Date();
    this.paymentMonth = now.getMonth() + 1;
    this.paymentYear = now.getFullYear();
    this.payoutAmount = 0;
    this.loadingPayoutBalance = true;
    forkJoin({
      balance: this.apiService.getRequestPatrocinioBalance(),
      history: this.apiService.getRequestPatrocinioFindAll()
    }).subscribe({
      next: ({ balance, history }) => {
        this.setPaymentData(balance, history);
        this.loadingPayoutBalance = false;
        this.nzModalService.create({ nzTitle: null, nzFooter: null, nzContent: this.renewPatrocinioModal, nzWidth: '760px', nzMaskClosable: false, nzClassName: 'payout-request-modal' });
      },
      error: error => {
        this.loadingPayoutBalance = false;
        this.modalService.error(this.getPayoutError(error, 'No se pudo consultar el saldo mensual.'));
      }
    });
  }

  public onConfirmPatrocinio(): void {
    const availableAmount = Number(this.paymentBalance.available || 0);
    const requestedAmount = Number(this.payoutAmount || 0);

    if (requestedAmount <= 0) {
      this.modalService.warning('Ingrese un monto mayor a cero.');
      return;
    }

    if (requestedAmount > availableAmount) {
      this.modalService.warning('El monto solicitado no puede superar la ganancia disponible.');
      return;
    }

    this.loadingPayoutRequest = true;
    this.apiService.postRequestPatrocinioGenerate({ amount: requestedAmount }).subscribe(
      (response) => {
        this.loadingPayoutRequest = false;
        if (!response?.success) {
          this.modalService.error(response?.message || 'No se pudo registrar la solicitud de pago.');
          return;
        }

        this.reloadPaymentData(() => {
          this.nzModalService.closeAll();
          this.modalService.success(response.message || 'Solicitud registrada como pago pendiente.');
        });
      },
      (error) => {
        this.loadingPayoutRequest = false;
        this.modalService.error(this.getPayoutError(error, 'No se pudo registrar la solicitud de pago.'));
        if (error?.status === 422) this.reloadPaymentData();
      }
    );
  }

  public selectPayoutMode(mode: 'all' | 'partial'): void {
    this.payoutMode = mode;
    this.payoutAmount = mode === 'all' ? Number(this.totalComisiones || 0) : 0;
  }

  public consultPaymentPeriod(): void {
    this.loadingPayoutBalance = true;
    this.reloadPaymentData(() => this.loadingPayoutBalance = false);
  }

  public get isCurrentPaymentPeriod(): boolean {
    const now = new Date();
    return this.paymentMonth === now.getMonth() + 1 && this.paymentYear === now.getFullYear();
  }

  public paymentPeriodLabel(period?: string): string {
    if (!period) return '-';
    const [year, month] = period.split('-').map(Number);
    const label = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  public paymentStatusLabel(state: number): string { return ({ 1: 'Pago pendiente', 2: 'Pagado', 3: 'Rechazado' } as any)[Number(state)] ?? 'Desconocido'; }

  private reloadPaymentData(onComplete?: () => void): void {
    const params = { month: this.paymentMonth, year: this.paymentYear };
    forkJoin({ balance: this.apiService.getRequestPatrocinioBalance(params), history: this.apiService.getRequestPatrocinioFindAll(params) }).subscribe({
      next: ({ balance, history }) => { this.setPaymentData(balance, history); onComplete?.(); },
      error: error => { onComplete?.(); this.modalService.error(this.getPayoutError(error, 'No se pudo actualizar la información mensual.')); }
    });
  }

  private setPaymentData(balance: any, history: any): void {
    this.paymentBalance = balance?.data ?? this.paymentBalance;
    if (this.isCurrentPaymentPeriod) this.availableWithdrawalBalance = Number(this.paymentBalance.available ?? 0);
    const data = history?.data;
    this.paymentHistory = Array.isArray(data) ? data : (data?.items ?? []);
    this.payoutAmount = 0;
  }

  private getPayoutError(error: any, fallback: string): string {
    return error?.error?.message || error?.message || (typeof error === 'string' ? error : fallback);
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
    modal.afterClose.subscribe(() => { })
  }

  onTemplateHistory(): void {
    this.nzModalService.create({
      nzTitle: "Historial de compras recientes",
      nzFooter: null,
      nzContent: this.templateHistoryPaymet
    })
  }
}
