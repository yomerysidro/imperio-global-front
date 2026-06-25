import { FileModel } from "./file-model.interface";
import { PaymentLog } from "./payment-log.interface";

export interface UserDetail {
  puntos_personales: number;
  puntos_red: number;
  ganancia_patrocinio: number;
  puntos_residuales: number;
  total_puntos: number;
  paquete_actual: string;
  rango_actual: string;
}

export interface UserModel {
  id: number;
  name: string;
  email: string;
  uuid: string;
  address: string;
  phone: string;
  file: FileModel;
  created_at: string;
  payment: PaymentLog;
  city: string;
  gender: string;
  country: string;
  points: UserPoint;
  range?: RangeModel;
  creatxlssed: string;
  is_admin?: boolean | number;
  totalPoints?: number;
  active?: boolean;

  // Nuevas propiedades inyectadas por el Backend
  bonos_totales_historico?: number; 
  directos?: number;
  activos?: number;
  package_name?: string;
  red_total?: number;
  user_detail?: UserDetail; // 🔥 NUEVO: datos detallados del usuario
}

export interface AuthModel {
  name: string;
  token: string;
  photo: string;
  uuid?: string;
  validation?: string;
  admin: boolean;
}

export interface UserPoint {
  compra: {
    total_puntos: number;
    total_gastado: number;
    detalles: Array<{
      tipo: string;
      paquete: string;
      puntos: number;
      monto: number;
      fecha: string;
    }>;
  };
  patrocinio: number;
  personal: number;
  pointGroup: number;
  residual: number;
  infinito: number;
  pointAfiliado: number;
  personalGlobal: number;
  patrocinioRequest: number;
  patrocinioServicio: number;
  residualServicio: number;
}

export interface RangeModel {
  range: {
    title: string;
    file: FileModel;
  };
}