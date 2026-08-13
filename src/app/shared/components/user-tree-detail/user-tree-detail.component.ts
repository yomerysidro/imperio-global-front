import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

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

      this.pointTotal = Number(userDetail.puntos_personales ?? pts.personal ?? 0);
      this.pointRed = Number(userDetail.puntos_red ?? pts.pointGroup ?? 0);
      this.granTotalPuntos = Number(userDetail.total_puntos ?? pts.total_general ?? this.pointRed);

      // 4. Estado activo
      this.isNodeActive = (this.userModel?.payment?.state == 2) || 
                          (this.userModel?.payment_active?.state == 2) || 
                          (this.paymentOrder?.state == 2) || 
                          !!this.userModel?.active || 
                          (this.userModel?.estado_visual?.toUpperCase() === 'ACTIVO');

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

      // 6. Nombre del Paquete
      this.paquetes = [];
      const nombrePack = this.userModel.package_name || this.userModel.payment?.payment_order?.pack?.title;

      if (nombrePack) {
        this.paquetes = [{
          paquete: nombrePack,
          puntos: this.pointTotal
        }];
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
      const isActive = point.state == 1 || !!point.active;

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
