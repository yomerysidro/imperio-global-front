import { Component, OnInit } from '@angular/core';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/utilities/modal-services';

@Component({
  selector: 'app-tools-cash-page',
  templateUrl: './tools-cash-page.component.html',
  styleUrls: ['./tools-cash-page.component.scss']
})
export class ToolsCashPageComponent implements OnInit {

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

  public onChangeDate(ev: any): void{
    this.loadData();
  }

  public loadData(): void{
    this.apiService.getUserCashFlow({
      year: this.currentDate.getFullYear(),
      month: (this.currentDate.getMonth() + 1)
    }).subscribe(
      (res) => {
        console.log(res)
        this.amountStore = res.data.orders.length == 0? 0 : res.data.orders?.map( o => o.payment_order.amount )?.reduce(( a, b) => parseFloat(a) + parseFloat(b)) ?? 0;
        this.amountProduct = res.data.products.length == 0? 0 : res.data.products?.map( o => o.amount )?.reduce(( a, b) => parseFloat(a) + parseFloat(b)) ?? 0;
      }
    )
  }
}
