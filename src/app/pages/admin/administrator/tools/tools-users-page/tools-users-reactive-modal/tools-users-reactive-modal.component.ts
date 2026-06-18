import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tools-users-reactive-modal',
  templateUrl: './tools-users-reactive-modal.component.html',
  styleUrls: ['./tools-users-reactive-modal.component.scss']
})
export class ToolsUsersReactiveModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Output() back: EventEmitter<number> = new EventEmitter<number>();

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  loadingSave: boolean = false;
  productsList: Array<IProductModel> = [];
  _cartList: Array<IProductModel> = [];
  loadingDesactive: boolean = false;

  maxPointsProduct: number = 0;

  amountDiscount: number = 0;
  constructor(
    private apiService: ApiService,
    private modalRef: NzModalService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.amountDiscount = Number.parseFloat( this.userModel?.payment?.payment_order?.pack?.discount ?? "0" );
  }

  public loadData(): void{
    forkJoin(
      this.apiService.getProductSearch({}),
      this.apiService.getProductPaymnetPoints(),
      this.apiService.getProductPointSearch({}),
      this.apiService.getOptionsSearch({key: 'max_points_product'})
    ).subscribe(([products, points, pointsSearch, options]) => {
      if( products.success ){
        this.productsList = products.data.map( p => {

          if( this.userModel?.payment?.payment_order == null ){
            p.points = 0;
          }else{
            p.points = pointsSearch.data.find( x => x.pack_id == this.userModel?.payment?.payment_order.pack.id && x.product_id == p.id)?.point ?? 0;
          }
          return p;
        });
      }
      if( options.success ){
        this.maxPointsProduct = options.data[0].option_value;
      }
    })
  }

  public onAddQuantity( index: number , suma: number ): void{
    
    if( (this.productsList[index].quantity??0) >= 0 ) this.productsList[index].quantity = (this.productsList[index].quantity??0) + suma;
    this.productsList[index].quantity = this.productsList[index].quantity == -1 ? 0 : this.productsList[index].quantity;
    this._cartList =  this.productsList.filter( p => p.quantity > 0 );

  }

  get totalPoints(): number{
    return this._cartList.length == 0 ? 0 : this._cartList.map( c => c.points * c.quantity ).reduce( (a, b) => a + b );
  }

  public modalDesactive(): void{
    this.modalService.confirm(
      "¿Desea activar este usuario?",
      () => {
        this.loadingDesactive = true;
        this.apiService.postUsercodeActiveResidual({userCode : this.userModel?.uuid , products: this._cartList.map( p => {
          return {
            product: p.id,
            quantity: p.quantity ?? 0
          }
          })}
        ).subscribe(
          (res) => {
            this.modalRef.closeAll();
            this.loadingDesactive = false;
          },
          (error) => {
            this.loadingDesactive = false;
          }
        )
      }
    )
  }

  get totalBuy(): number{
    return this._cartList.length>0 ? this._cartList?.map( p => this.amountDiscount == 0 ? (p.price * p.quantity) : ( (p.quantity * p.price) * (100 - this.amountDiscount) / 100) )?.reduce( (a,b) => a+b ) : 0;
  }

}
