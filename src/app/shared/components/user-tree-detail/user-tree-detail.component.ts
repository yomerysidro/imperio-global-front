import { Component, Inject, Input, OnDestroy, OnInit, Optional } from '@angular/core';
import { environment } from '@env/environment';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { isUserMembershipActive } from '@shared/utilities/user-activity';
import { Observable, Subscription } from 'rxjs';
import { defaultIfEmpty, finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-user-tree-detail',
  templateUrl: './user-tree-detail.component.html',
  styleUrls: ['./user-tree-detail.component.scss']
})
export class UserTreeDetailComponent implements OnInit, OnDestroy {
  @Input() userModel: any;
  @Input() listPoints: any;
  @Input() paymentOrder: any;
  @Input() pointTotal: number = 0;      // Puntos Personales
  @Input() pointRed: number = 0;        // Puntos de equipo (pointGroup)
  @Input() granTotalPuntos: number = 0; // Suma total
  @Input() paquetes: any[] = [];
  detailRequest?: Observable<Pick<UserTreeDetailComponent, 'userModel' | 'listPoints' | 'paymentOrder' | 'paquetes'> | null>;
  isDetailLoading = false;
  detailLoadFailed = false;
  private detailSubscription?: Subscription;

  readonly fallback = 'assets/images/logo/5cd86c5269c85bcc6dfd9d97f1e772ee.png';
  avatarUrl = this.fallback;

  usuarioDirectos: number | null = null;
  usuarioActivos: number | null = null;
  usuarioTotal: number | null = null;
  gananciaPatrocinio: number = 0;
  gananciaResidual: number = 0;
  bonoInfinito: number = 0;
  gananciaTotal: number = 0;
  env = environment;
  isNodeActive: boolean = false;
  
  sponsorName: string = 'Sin patrocinador';
  sponsorCode: string = '';

  constructor(@Optional() @Inject(NZ_MODAL_DATA) private modalData: any) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }
  }

  get currentRange() {
    return this.userModel?.current_range === undefined
      ? this.userModel?.range?.range
      : this.userModel.current_range;
  }

  ngOnInit(): void {
    if (!this.detailRequest) {
      this.initializeDetails();
      return;
    }

    this.initializeDetails();
    this.isDetailLoading = true;
    this.detailSubscription = this.detailRequest.pipe(
      take(1),
      defaultIfEmpty(null),
      finalize(() => { this.isDetailLoading = false; })
    ).subscribe({
      next: detail => {
        if (detail) {
          Object.assign(this, detail);
          this.initializeDetails();
        } else {
          this.detailLoadFailed = true;
        }
      },
      error: () => { this.detailLoadFailed = true; }
    });
  }

  ngOnDestroy(): void {
    this.detailSubscription?.unsubscribe();
  }

  private initializeDetails(): void {
    if (this.userModel) {
      // 1. Avatar
      const photo = this.userModel.file?.path || this.userModel.photo;
      this.avatarUrl = !photo
        ? this.fallback
        : /^(https?:|data:image\/|\/|assets\/)/i.test(photo)
          ? photo
          : environment.hostUrl + '/storage/' + photo;

      // 2. Obtener el Patrocinador desde el árbol seguro
      if (this.listPoints && Array.isArray(this.listPoints)) {
        const sponsorPoint = this.listPoints.find((p: any) => 
          p.user_code?.toLowerCase() === this.userModel.uuid?.toLowerCase()
        );
        if (sponsorPoint && sponsorPoint.sponsor_code) {
          this.sponsorCode = sponsorPoint.sponsor_code;
          this.sponsorName = this.sponsorCode;
        }
      }

      // 3. Carga de Puntos exacta del Backend
      const userDetail = this.userModel.user_detail || {};
      const pts = this.userModel.points || {};

      // Algunos listados entregan estos valores al modal por separado y no
      // incluyen `user_detail`/`points`. En ese caso conservamos los @Input
      // recibidos en vez de reemplazarlos por cero.
      this.pointTotal = Number(userDetail.puntos_personales ?? pts.personal ?? this.pointTotal ?? 0);
      this.pointRed = Number(userDetail.puntos_red ?? pts.pointGroup ?? this.pointRed ?? 0);
      this.granTotalPuntos = Number(
        userDetail.total_puntos ?? pts.total_general ?? this.granTotalPuntos ?? (this.pointTotal + this.pointRed)
      );
      this.gananciaPatrocinio = Number(userDetail.ganancia_patrocinio ?? pts.patrocinio ?? 0);
      this.gananciaResidual = Number(userDetail.ganancia_residual ?? pts.residual ?? 0);
      this.bonoInfinito = Number(userDetail.bono_infinito ?? pts.infinito ?? 0);
      this.gananciaTotal = Number(userDetail.total_comisiones ?? pts.total_comisiones ?? 0);

      // 4. Estado activo
      this.isNodeActive = isUserMembershipActive(this.userModel, undefined, this.paymentOrder);

      // Estos indicadores oficiales los devuelve Laravel en network_summary.
      const network = this.userModel.network_summary;
      this.usuarioTotal = this.readNetworkCount(network?.total_network);
      this.usuarioDirectos = this.readNetworkCount(network?.total_directs);
      this.usuarioActivos = this.readNetworkCount(network?.total_active);

      // 6. Packs adquiridos: permanecen visibles aunque estén inactivos este mes.
      const categories = this.userModel.packs_by_category || {};
      const ownedPacks = [categories.product, categories.service]
        .filter((category: any) => category?.owned === true && category?.pack)
        .map((category: any) => ({
          paquete: category.pack.title || 'Paquete',
          puntos: category.pack.points || 0,
          active: category.active === true
        }));

      if (ownedPacks.length > 0) {
        this.paquetes = ownedPacks;
      }
    }
  }

  private readNetworkCount(value: unknown): number | null {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  public onImgError(): void {
    this.avatarUrl = this.fallback;
  }

  private safeParse(pts: any): any {
    if (!pts) return null;
    if (typeof pts === 'string') {
      try { return JSON.parse(pts); } catch (e) { return null; }
    }
    return pts;
  }
}
