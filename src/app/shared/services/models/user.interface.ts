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

export interface NetworkMetrics {
  total_network?: number | null;
  total_directs?: number | null;
  total_active?: number | null;
  total_directs_active?: number | null;
  returned_nodes?: number | null;
  complete?: boolean;
}

export interface PointsUsersResponse {
  network_meta?: NetworkMetrics | null;
  network_summary?: NetworkMetrics | null;
  user?: UserModel;
  points?: UserPoint;
  point_records?: Array<any>;
  volume_records?: Array<any>;
  [key: string]: any;
}

export interface UserModel {
  descendantsCount?: number | null;
  genealogyVerified?: boolean;
  level?: number | null;
  routeAscending?: Array<{ uuid: string; name: string; level: number; sponsor_code: string | null }>;
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
  current_sponsor_code?: string | null;
  sponsor_code?: string | null;
  sponsor?: { uuid: string; name: string; file?: FileModel | null } | null;
  totalPoints?: number;
  active?: boolean;
  manual_reactivation_active?: boolean;

  // Nuevas propiedades inyectadas por el Backend
  bonos_totales_historico?: number; 
  directos?: number;
  activos?: number;
  package_name?: string;
  red_total?: number;
  volume_records?: Array<any>;
  commission_records?: Array<any>;
  point_records?: Array<any>;
  network_summary?: NetworkMetrics | null;
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
  total_general?: number;
  total_comisiones?: number;
  patrocinioTotal?: number;
}

export interface RangeModel {
  range: {
    title: string;
    file: FileModel;
  };
}
