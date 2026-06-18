import { PackModel } from "./packs.interface";
import { UserModel } from "./user.interface";

export interface IProductPaymentOrder {
  id: number;
  currency: string;
  amount: string;
  discount: number;
  pack_id: number;
  points: number;
  phone: string;
  address: string;
  state: number;
  type: number;
  token: number;
  created_at: string;
  user: UserModel;
  pack: PackModel;
  details: Array<IProductPaymentOrderDetail>;
  plan?: number;
}

export interface IProductPaymentOrderDetail{
  id: number;
  payment_product_order_id: string;
  points: number;
  price: string;
  product_id: string;
  product_title: string;
  quantity: string;
  subtotal: string;
}
