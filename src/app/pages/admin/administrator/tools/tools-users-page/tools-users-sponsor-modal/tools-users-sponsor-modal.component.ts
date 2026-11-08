import { Component, EventEmitter, Input, OnInit, Optional, Output, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type PrimaryLineStatus = 'correct' | 'move-required' | 'identity-pending' | 'not-found' | 'blocked';
interface PrimaryLineMember {
  code: string | null;
  expectedSponsorCode: string | null;
  user: UserModel | null;
  status: PrimaryLineStatus;
  error?: string;
}

@Component({
  selector: 'app-tools-users-sponsor-modal',
  templateUrl: './tools-users-sponsor-modal.component.html',
  styleUrls: ['./tools-users-sponsor-modal.component.scss']
})
export class ToolsUsersSponsorModalComponent implements OnInit {
  @Input() userModel: UserModel;
  @Output() back = new EventEmitter<number>();
  @Output() confirmed = new EventEmitter<void>();

  moveConfirmationEnabled = false;
  moveStatusLoading = false;
  moveStatusError = '';
  moveStatusMode = '';
  primaryLine: PrimaryLineMember[] = [];
  genealogyAccounts: any[] = [];
  referenceUuid = '';
  lineError = ''; detailError = ''; loadingDetail = false;
  private selectionRevision = 0;
  private detailRevision = 0;
  private lineRevision = 0;
  backendLocked = false;
  loadingPrimaryLine = false;
  validateForm: FormGroup;
  avatarUrl = CONSTANTS.IMAGE.FALLBACK;
  avatarUrlSponsor = CONSTANTS.IMAGE.FALLBACK;
  avatarUrlNewSponsor = CONSTANTS.IMAGE.FALLBACK;
  newSponsor: UserModel | null = null;
  isSponsorNew = false;
  loadingSearch = false;
  loadingConfirm = false;
  step = 1;
  searchMode: 'code' | 'name' | 'email' = 'code';
  moveError = '';
  searchError = '';
  isAdmin = false;
  get selectedDescendantCount(): number | null {
    return this.userModel?.descendantsCount ?? null;
  }
  get confirmationBlockReason(): string {
    if (!this.isAdmin) return 'Se requieren permisos administrativos.';
    if (this.backendLocked) return 'El movimiento real todavía está deshabilitado en Laravel';
    if (this.moveStatusLoading) return 'Consultando disponibilidad real de Laravel.';
    if (!this.moveConfirmationEnabled) return this.moveStatusError || 'Laravel mantiene deshabilitada la confirmación de movimientos.';
    if (this.loadingDetail || this.loadingSearch) return 'Consultando genealogía en Laravel.';
    if (!this.userModel?.genealogyVerified) return 'Falta verificar el detalle genealógico del socio.';
    if (!this.newSponsor?.genealogyVerified) return 'Selecciona y verifica el nuevo patrocinador.';
    if (this.userModel.uuid === this.newSponsor.uuid) return 'El socio no puede ser su propio patrocinador.';
    return '';
  }

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalMessage: ModalService,
    private authService: AuthenticationService,
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: { userModel?: UserModel }
  ) {
    this.validateForm = this.fb.group({
      sponsor: [{ value: null, disabled: true }],
      sponsorNew: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.userModel = this.userModel || this.modalData?.userModel;
    const auth = this.authService.currentUserValue;
    this.isAdmin = auth?.admin === true || (auth as any)?.is_admin === true || Number((auth as any)?.is_admin) === 1;
    this.avatarUrl = this.userModel?.file?.path ? environment.hostUrl + '/storage/' + this.userModel.file.path : CONSTANTS.IMAGE.FALLBACK;
    this.validateForm.get('sponsor').setValue(
      this.userModel?.current_sponsor_code || this.userModel?.sponsor_code || this.userModel?.sponsor?.uuid || '--'
    );
    const sponsorPath = this.userModel?.sponsor?.file?.path
      || this.userModel?.payment?.payment_order?.sponsor?.file?.path;
    this.avatarUrlSponsor = sponsorPath ? environment.hostUrl + '/storage/' + sponsorPath : CONSTANTS.IMAGE.FALLBACK;
    if (this.isAdmin) { this.loadSelectedMember(); this.loadPrimaryLine(); this.loadMoveStatus(); }
  }

  loadMoveStatus(): void {
    this.moveStatusLoading = true; this.moveStatusError = '';
    this.apiService.getNetworkMoveStatus().subscribe({
      next: status => {
        this.moveConfirmationEnabled = status?.confirmation_enabled === true;
        this.moveStatusMode = status?.mode || 'disabled';
        this.moveStatusLoading = false;
        if (!this.moveConfirmationEnabled) this.moveStatusError = 'Laravel mantiene deshabilitada la confirmaci?n (' + this.moveStatusMode + ').';
      },
      error: error => {
        this.moveConfirmationEnabled = false; this.moveStatusLoading = false;
        this.moveStatusError = error?.error?.message || 'No se pudo consultar el estado de movimientos de Laravel.';
      }
    });
  }

  loadSelectedMember(): void {
    if (!this.userModel?.uuid) return;
    const uuid = this.userModel.uuid;
    const revision = ++this.detailRevision;
    this.loadingDetail = true; this.detailError = '';
    this.userModel = { ...this.userModel, genealogyVerified: false };
    this.apiService.getNetworkMember(uuid).subscribe({
      next: user => { if (revision !== this.detailRevision || this.userModel.uuid !== uuid) return; this.userModel = user; this.loadingDetail = false; this.validateForm.get('sponsor').setValue(this.actualSponsorCode(user) || 'Raíz'); },
      error: error => { if (revision !== this.detailRevision) return; this.loadingDetail = false; this.detailError = this.moveHttpErrorMessage(error); }
    });
  }
  loadPrimaryLine(): void {
    const revision = ++this.lineRevision;
    this.loadingPrimaryLine = true; this.lineError = ''; this.primaryLine = [];
    this.apiService.getNetworkRoot().subscribe({
      next: root => this.loadGenealogyPage(root.uuid, 1, [], revision),
      error: error => { if (revision !== this.lineRevision) return; this.loadingPrimaryLine = false; this.lineError = this.moveHttpErrorMessage(error); }
    });
  }

  private loadGenealogyPage(rootUuid: string, page: number, accumulated: any[], revision: number): void {
    this.apiService.getNetworkAccounts(page).subscribe({
      next: response => {
        if (revision !== this.lineRevision) return;
        if (!Array.isArray(response?.data) || response.current_page !== page || !Number.isInteger(response.last_page) || response.last_page < page) {
          this.loadingPrimaryLine = false; this.lineError = 'Laravel devolvió una página de genealogía inválida.'; return;
        }
        const members = [...accumulated, ...response.data.filter((row: any) => row.connected === true && row.uuid)];
        if (page < response.last_page) { this.loadGenealogyPage(rootUuid, page + 1, members, revision); return; }
        this.genealogyAccounts = members;
        const bySponsor = new Map<string, any[]>();
        members.forEach(member => {
          const sponsor = String(member.sponsor_code || '').toUpperCase();
          bySponsor.set(sponsor, [...(bySponsor.get(sponsor) || []), member]);
        });
        const root = members.find(member => String(member.uuid).toUpperCase() === rootUuid.toUpperCase());
        if (!root) { this.loadingPrimaryLine = false; this.lineError = 'La raíz configurada no aparece conectada en la genealogía de Laravel.'; return; }
        this.loadingPrimaryLine = false;
        const initialReference = this.userModel?.uuid || root.uuid;
        this.selectReference(initialReference);
      },
      error: error => { if (revision !== this.lineRevision) return; this.loadingPrimaryLine = false; this.lineError = this.moveHttpErrorMessage(error); }
    });
  }

  selectReference(uuid: string): void {
    if (!uuid) return;
    this.referenceUuid = uuid;
    this.apiService.getNetworkMember(uuid).subscribe({
      next: detail => {
        const route = [...(detail.routeAscending || [])].reverse();
        this.primaryLine = route.map((row, index) => {
          const account = this.genealogyAccounts.find(item => String(item.uuid).toUpperCase() === String(row.uuid).toUpperCase());
          const parent = index > 0 ? route[index - 1] : null;
          return { code: row.uuid, expectedSponsorCode: parent?.uuid || null,
            user: { ...(account || {}), ...row, current_sponsor_code: row.sponsor_code, genealogyVerified: true } as UserModel,
            status: 'correct' as PrimaryLineStatus };
        });
      }, error: error => { this.primaryLine = []; this.lineError = this.moveHttpErrorMessage(error); }
    });
  }

  actualSponsorCode(user: UserModel): string | null {
    return user?.current_sponsor_code || user?.sponsor_code || user?.sponsor?.uuid || null;
  }

  primaryLineStatusLabel(status: PrimaryLineStatus): string {
    const labels: Record<PrimaryLineStatus, string> = {
      correct: 'Correcta', 'move-required': 'Requiere movimiento',
      'identity-pending': 'Pendiente de identificar', 'not-found': 'No encontrada', blocked: 'Bloqueada'
    };
    return labels[status];
  }

  primaryLineSponsorName(code: string | null): string {
    if (!code) return 'Empresa / raíz';
    const sponsor = this.primaryLine.find(item => item.code?.toUpperCase() === code.toUpperCase());
    return sponsor?.user?.name || code;
  }

  primaryLineTargetLabel(member: PrimaryLineMember): string {
    if (member.expectedSponsorCode) return this.primaryLineSponsorName(member.expectedSponsorCode);
    return 'Empresa / raíz';
  }

  primaryLineFacts(user: UserModel | null): { level: unknown; direct: unknown; descendants: unknown; pack: string } {
    const data = user as any;
    return {
      level: data?.level ?? 'No informado por Laravel',
      direct: data?.directos ?? 'No informado por Laravel',
      descendants: data?.descendantsCount ?? 'No informado por Laravel',
      pack: data?.package_name || data?.payment?.payment_order?.pack?.title || 'No informado por Laravel'
    };
  }

  canMovePrimaryLineMember(member: PrimaryLineMember): boolean {
    return this.isAdmin && !!member.code && !!member.user && !!member.expectedSponsorCode
      && member.status === 'move-required';
  }

  selectPrimaryLineMove(member: PrimaryLineMember): void {
    if (!this.canMovePrimaryLineMember(member)) return;
    const target = this.primaryLine.find(item => item.code?.toUpperCase() === member.expectedSponsorCode.toUpperCase());
    if (!target?.user) return;
    ++this.detailRevision;
    this.onSponsorQueryChanged();
    this.loadingDetail = false;
    this.detailError = '';
    this.userModel = member.user;
    this.newSponsor = target.user;
    this.isSponsorNew = true;
    this.avatarUrl = member.user.file?.path ? environment.hostUrl + '/storage/' + member.user.file.path : CONSTANTS.IMAGE.FALLBACK;
    this.avatarUrlNewSponsor = target.user.file?.path ? environment.hostUrl + '/storage/' + target.user.file.path : CONSTANTS.IMAGE.FALLBACK;
    this.validateForm.get('sponsor').setValue(this.actualSponsorCode(member.user) || '--');
    this.validateForm.get('sponsorNew').setValue(target.user.uuid);
    this.moveError = '';
    this.searchError = '';
    this.step = 2;
  }

  onSearchSponsor(): void {
    const query = String(this.validateForm.get('sponsorNew').value || '').trim();
    if (!query || !this.isAdmin) return;
    const revision = ++this.selectionRevision;
    this.loadingSearch = true;
    this.searchError = '';
    this.isSponsorNew = false;
    this.newSponsor = null;
    this.moveError = '';
    const params: Record<string, string> = { [this.searchMode]: query };
    this.apiService.getUsersSearch(params).subscribe({
      next: response => {
        if (revision !== this.selectionRevision) return;
        const matches = response.success && Array.isArray(response.data) ? response.data : [];
        const selected = this.searchMode === 'code'
          ? matches.find(user => String(user.uuid || '').trim().toUpperCase() === query.toUpperCase())
          : matches.length === 1 ? matches[0] : null;
        if (!selected) {
          this.loadingSearch = false;
          this.searchError = matches.length > 1
            ? 'Hay varias coincidencias. Busca por UUID para seleccionar una cuenta exacta.'
            : 'No se encontró una cuenta con ese criterio.';
          return;
        }
        if (selected.uuid === this.userModel?.uuid) { this.loadingSearch = false; this.searchError = 'El socio no puede ser su propio patrocinador.'; return; }
        this.apiService.getNetworkMember(selected.uuid).subscribe({
          next: user => { if (revision !== this.selectionRevision) return; this.newSponsor = user; this.isSponsorNew = true; this.loadingSearch = false; },
          error: error => { if (revision !== this.selectionRevision) return; this.loadingSearch = false; this.searchError = 'Detalle del patrocinador: ' + this.moveHttpErrorMessage(error); }
        });
      },
      error: error => {
        if (revision !== this.selectionRevision) return;
        this.loadingSearch = false;
        this.newSponsor = null;
        this.searchError = error?.message || error?.error?.message || 'No se pudo buscar el patrocinador.';
      }
    });
  }

  onSponsorQueryChanged(): void {
    ++this.selectionRevision;
    this.loadingSearch = false;
    this.newSponsor = null;
    this.isSponsorNew = false;
    this.moveError = '';
  }

  canConfirm(): boolean {
    return !this.confirmationBlockReason && !this.loadingConfirm;
  }

  onSave(): void {
    if (!this.canConfirm()) return;
    const command = { userCode: this.userModel.uuid, newSponsorCode: this.newSponsor.uuid };
    this.moveStatusLoading = true;
    this.apiService.getNetworkMoveStatus().subscribe({
      next: status => {
        this.moveConfirmationEnabled = status?.confirmation_enabled === true;
        this.moveStatusMode = status?.mode || 'disabled';
        this.moveStatusLoading = false;
        if (!this.moveConfirmationEnabled) {
          this.moveStatusError = 'Laravel mantiene deshabilitada la confirmaci?n (' + this.moveStatusMode + ').';
          return;
        }
        this.moveStatusError = '';
        if (command.userCode !== this.userModel?.uuid || command.newSponsorCode !== this.newSponsor?.uuid || this.loadingConfirm) return;
        this.modalMessage.confirm('Laravel permite el movimiento en modo ' + this.moveStatusMode + '. ?Confirmas trasladar toda la rama seleccionada?', () => {
          if (this.loadingConfirm || command.userCode !== this.userModel?.uuid || command.newSponsorCode !== this.newSponsor?.uuid || !this.moveConfirmationEnabled) return;
          this.loadingConfirm = true;
          this.moveError = '';
          this.apiService.confirmNetworkMove(command).subscribe({
            next: result => {
              this.loadingConfirm = false;
              if (result?.status !== 'confirmed') { this.moveError = result?.message || 'Laravel no confirm? el movimiento.'; return; }
              this.confirmed.emit();
              this.loadSelectedMember();
              this.loadPrimaryLine();
              this.onSponsorQueryChanged();
              this.modalMessage.success(result.message || 'Laravel confirm? el movimiento.');
            },
            error: error => {
              this.loadingConfirm = false;
              if (error?.status === 423) { this.backendLocked = true; this.moveConfirmationEnabled = false; }
              this.moveError = this.moveHttpErrorMessage(error);
            }
          });
        });
      },
      error: error => {
        this.moveConfirmationEnabled = false;
        this.moveStatusLoading = false;
        this.moveStatusError = error?.error?.message || 'No se pudo consultar el estado de movimientos de Laravel.';
      }
    });
  }

  private moveHttpErrorMessage(error: any): string {
    const message = error?.error?.message || error?.error?.error || error?.message;
    switch (error?.status) {
      case 403: return message || 'Permisos insuficientes para mover esta rama (HTTP 403).';
      case 422: return message || 'Laravel rechazó los datos del movimiento (HTTP 422).';
      case 423: return 'El movimiento real todavía está deshabilitado en Laravel';
      case 404: return message || 'La ruta de confirmación no está disponible en Laravel (HTTP 404).';
      case 500: return message || 'Laravel encontró un error al procesar el movimiento (HTTP 500).';
      default: return message || 'Laravel rechazó la confirmación del movimiento.';
    }
  }

  setStep(step: number): void {
    if (step === 2 && !this.isAdmin) return;
    this.step = step;
  }

  onBack(): void { this.back.emit(Date.now()); }
}

