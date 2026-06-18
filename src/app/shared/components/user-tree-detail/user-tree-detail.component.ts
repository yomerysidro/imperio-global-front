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

      // 2. Lógica de Puntos (Sobrescribimos los @Inputs para evitar duplicidad del padre)
      const pts = this.safeParse(this.userModel.points);

      // Tomamos los valores exactos del objeto points del modelo
      this.pointTotal = Number(pts?.personal || 0);
      const grupales = Number(pts?.pointGroup || 0);
      const infinito = Number(pts?.infinito || 0);

      this.pointRed = grupales + infinito;

      // El Gran Total es estrictamente la suma de puntos (no dinero)
      this.granTotalPuntos = this.pointTotal + this.pointRed;

      // CORRECCIÓN CLAVE: Eliminamos "|| !!this.userModel?.active" para que no haya falsos verdes.
      // Solo será verde si el backend evaluó que en este mes (o días de gracia) está en estado 2 (PAGADO).
      this.isNodeActive = (this.userModel?.payment?.state == 2) || 
                          (this.userModel?.payment_active?.state == 2) || 
                          (this.paymentOrder?.state == 2) || 
                          !!this.userModel?.active || 
                          (this.userModel?.estado_visual?.toUpperCase() === 'ACTIVO');

      // 3. Reset y Cálculo de Red (Contadores de personas)
      const uuid = this.userModel.uuid || this.userModel.id?.toString();
      if (uuid) {
        this.usuarioTotal = 0;
        this.usuarioActivos = 0;
        this.usuarioDirectos = 0;
        this.nodeTreeParse(uuid, true);

        // Si el árbol no encuentra hijos reales, aseguramos consistencia visual
        if (this.usuarioTotal === 0) {
          this.pointRed = 0;
          this.granTotalPuntos = this.pointTotal;
        }
      }

      // 4. Nombre del Paquete
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

  /**
   * @param code ID del usuario a buscar sus hijos
   * @param isFirstLevel Si es true, incrementa el contador de Directos
   */
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

      // CORRECCIÓN ESTRICTA: Solo confiar en la variable filtrada por el ciclo actual del backend
      const isActive = !!point.active;

      if (isActive) this.usuarioActivos++;
      if (isFirstLevel) this.usuarioDirectos++;

      this.nodeTreeParse(point.user_code, false);
    });
  }

  // Helper para parsear JSON si viene como string
  private safeParse(pts: any): any {
    if (!pts) return null;
    if (typeof pts === 'string') {
      try { return JSON.parse(pts); } catch (e) { return null; }
    }
    return pts;
  }
}