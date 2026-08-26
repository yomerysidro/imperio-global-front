import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { isUserMembershipActive } from '@shared/utilities/user-activity';

@Component({
  selector: 'app-user-tree-detail',
  templateUrl: './user-tree-detail.component.html',
  styleUrls: ['./user-tree-detail.component.scss']
})
export class UserTreeDetailComponent implements OnInit {
  @Input() userModel: any;
  @Input() listPoints: any;
  @Input() paymentOrder: any;
  @Input() pointTotal: number = 0;      // Puntos Personales
  @Input() pointRed: number = 0;        // Puntos de equipo (pointGroup)
  @Input() granTotalPuntos: number = 0; // Suma total
  @Input() paquetes: any[] = [];

  fallback: string = CONSTANTS.IMAGE.FALLBACK;
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  usuarioDirectos: number = 0;
  usuarioActivos: number = 0;
  usuarioTotal: number = 0;
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

  ngOnInit(): void {
    if (this.userModel) {
      // 1. Avatar
      this.avatarUrl = this.userModel.file?.path
        ? environment.hostUrl + '/storage/' + this.userModel.file.path
        : (this.userModel.photo ? environment.hostUrl + '/storage/' + this.userModel.photo : this.fallback);

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

      // 5. Contadores de Red (Confía en la data estructural si el árbol local es menor)
      const uuid = this.userModel.uuid || this.userModel.id?.toString();
      if (uuid) {
        this.usuarioTotal = 0;
        this.usuarioActivos = 0;
        this.usuarioDirectos = 0;
        this.nodeTreeParse(uuid, true);

        // 🔥 CORRECCIÓN: Si el parse local da 0 pero el backend sabe que hay red, conservamos el del backend
        if (this.usuarioTotal === 0) {
          this.usuarioTotal = this.userModel.red_total ?? 0;
          this.usuarioDirectos = this.userModel.directos ?? 0;
          this.usuarioActivos = this.userModel.activos ?? 0;
        }
      }

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

  public onImgError(): void {
    this.avatarUrl = this.fallback;
  }

  private nodeTreeParse(code: string, isFirstLevel: boolean = false) {
    if (!this.listPoints) return;

    const children = this.listPoints.filter((p: any) =>
      p.sponsor_code?.toLowerCase() === code.toLowerCase()
    );

    const processedCodes = new Set();

    children.forEach((point: any) => {
      if (processedCodes.has(point.user_code)) return;
      processedCodes.add(point.user_code);

      this.usuarioTotal++;
      const pointUser = point.user || point.user_point || point;
      const isActive = isUserMembershipActive(pointUser, point);

      if (isActive) this.usuarioActivos++;
      if (isFirstLevel) this.usuarioDirectos++;

      this.nodeTreeParse(point.user_code, false);
    });
  }

  private safeParse(pts: any): any {
    if (!pts) return null;
    if (typeof pts === 'string') {
      try { return JSON.parse(pts); } catch (e) { return null; }
    }
    return pts;
  }
}
