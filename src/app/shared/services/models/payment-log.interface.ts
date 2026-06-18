import { PaymentOrder } from "./payment-order.interface";

export interface PaymentLog{
  confirm: boolean;
  id: string;
  payment_order: PaymentOrder;
  payment_order_id: string;
  state: number;
}
