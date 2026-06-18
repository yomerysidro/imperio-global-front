import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { IProductPaymentOrder } from '@shared/services/models/product-payment-order.interface';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-payment-view-voucher-modal',
  templateUrl: './payment-view-voucher-modal.component.html',
  styleUrls: ['./payment-view-voucher-modal.component.scss']
})
export class PaymentViewVoucherModalComponent implements OnInit {

  @Input() iProductPaymentOrder?: IProductPaymentOrder;


  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
  ) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }
  }

  ngOnInit(): void {


  }

}
