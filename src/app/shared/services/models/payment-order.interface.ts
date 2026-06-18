import { Pack } from "./pack.interface";
import { UserModel } from "./user.interface";

export interface PaymentOrder{
  amount: string;
  currency: string;
  id: string;
  pack_id: string;
  pack: Pack;
  sponsor_code: string;
  token: string;
  sponsor?: UserModel;
}
