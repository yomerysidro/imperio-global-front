import { Component, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '@shared/services/api.service';
import { Subscription } from 'rxjs';
import { ModalService } from '@shared/utilities/modal-services';

@Component({
  selector: 'app-tools-cash-page',
  templateUrl: './tools-cash-page.component.html',
  styleUrls: ['./tools-cash-page.component.scss']
})
export class ToolsCashPageComponent implements OnInit, OnDestroy {

  private cashFlowRequest?: Subscription;
  currentDate: Date = new Date();
  amountStore: number = 0;
  amountProduct: number = 0;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.cashFlowRequest?.unsubscribe();
  }

  public onChangeDate(ev: any): void{
    this.loadData();
  }

  public loadData(): void{
    this.cashFlowRequest?.unsubscribe();
    this.cashFlowRequest = this.apiService.getUserCashFlow({
      year: this.currentDate.getFullYear(),
      month: (this.currentDate.getMonth() + 1)
    }).subscribe(
      (res) => {
        this.amountStore = res.data.orders.length == 0? 0 : res.data.orders?.map( o => o.payment_order.amount )?.reduce(( a, b) => parseFloat(a) + parseFloat(b)) ?? 0;
        this.amountProduct = res.data.products.length == 0? 0 : res.data.products?.map( o => o.amount )?.reduce(( a, b) => parseFloat(a) + parseFloat(b)) ?? 0;
      }
    )
  }
}
