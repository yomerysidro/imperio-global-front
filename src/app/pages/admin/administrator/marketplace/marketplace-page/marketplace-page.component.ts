import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { PaymentProductsModalComponent } from '@shared/components/payment/payment-products-modal/payment-products-modal.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { ServiceModel } from '@shared/services/models/service.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-marketplace-page',
  templateUrl: './marketplace-page.component.html',
  styleUrls: ['./marketplace-page.component.scss']
})
export class MarketplacePageComponent implements OnInit {

  tabIndex: number = 0;
  productList : Array<IProductModel> = [];

  env = environment;
  quickViewVisible : boolean = false;

  userModel: UserModel;
  totalPointsPersonal: number = 0;
  queryParams: any = {};
  eventSearch: number = 0;

  _cartList: Array<IProductModel> = [];

  CONSTANTS = CONSTANTS;

  isGlobalPersonal: boolean = false;
  totalPointsPersonalGlobal: number = 0;
  
  // Descuento del usuario
  userDiscount: number = 0;

  constructor(
    private apiService: ApiService,
    private nZmodal: NzModalService,
    private modalService: ModalService,
    private themeConstantService: ThemeConstantService,
    private messageService: NzMessageService
  ) {
    this.themeConstantService.selectedCurrentCartList.subscribe( ( c) => this._cartList = c );
  }

  ngOnInit(): void {
    this.loadData();
  }

  // Obtener el descuento del usuario según su paquete
  private getUserDiscount(): number {
    if (this.userModel?.payment?.payment_order?.pack?.discount) {
      return parseFloat(this.userModel.payment.payment_order.pack.discount) || 0;
    }
    return 0;
  }

  // Obtener el nombre del paquete del usuario
  getUserPackageName(): string {
    if (this.userModel?.payment?.payment_order?.pack?.title) {
      return this.userModel.payment.payment_order.pack.title;
    }
    return 'SIN PLAN';
  }

  // Verificar si el usuario está activo
  isUserActive(): boolean {
    return this.userModel?.payment?.state === 2 || this.userModel?.active === true;
  }

  // Calcular precio con descuento
  getPriceWithDiscount(price: number): number {
    const discount = this.getUserDiscount();
    if (discount > 0) {
      return price * (100 - discount) / 100;
    }
    return price;
  }

  // Calcular subtotal con descuento
  getSubtotalWithDiscount(price: number, quantity: number): number {
    const discount = this.getUserDiscount();
    const subtotal = price * quantity;
    if (discount > 0) {
      return subtotal * (100 - discount) / 100;
    }
    return subtotal;
  }

  // Calcular subtotal sin descuento
  getSubtotalWithoutDiscount(): number {
    if (this._cartList.filter( p => p.quantity > 0 ).length === 0) return 0;
    return this._cartList.filter( p => p.quantity > 0 )
      .map( p => p.price * p.quantity )
      .reduce( (a,b) => a+b, 0 );
  }

  // Calcular monto del descuento
  getDiscountAmount(): number {
    const subtotal = this.getSubtotalWithoutDiscount();
    const discount = this.getUserDiscount();
    if (discount > 0) {
      return subtotal * discount / 100;
    }
    return 0;
  }

  public onAddQuantity( index: number , suma: number ): void{

    if( (this.productList[index].quantity??0) >= 0 ) this.productList[index].quantity = (this.productList[index].quantity??0) + suma;
    this.productList[index].quantity = this.productList[index].quantity == -1 ? 0 : this.productList[index].quantity;

    this._cartList =  this.productList.filter( p => p.quantity > 0 )
    this.themeConstantService.changeCurrentCartList(this._cartList );
  }

  public getProductSearch(): void{
    this.apiService.getProductSearch({}).subscribe(
      (response) => {
        if( response.success ){
          this.productList = response.data.map( p => {
            if( this._cartList.find( c => p.id == c.id ) ) p.quantity = this._cartList.find( c => c.id )?.quantity;
            return p;
          });

        }
      },(error) => {

      }
    )
  }

  public loadData(): void{
    forkJoin(
      this.apiService.getAuthenticationUser(),
      this.apiService.getProductSearch({}),
      this.apiService.getProductPaymnetPoints(),
      this.apiService.getProductPointSearch({}),
      this.apiService.getOptionsSearch({key: 'bono_global'})
    ).subscribe(
      ([userModel, products, points, pointsSearch, options])=> {
        this.userModel = userModel.data;
        this.totalPointsPersonalGlobal = userModel.data.points.personalGlobal;
        
        // Guardar el descuento del usuario
        this.userDiscount = this.getUserDiscount();
        
        if( products.success ){
          this.productList = products.data.map( p => {
            if( this._cartList.find( c => p.id == c.id ) ) p.quantity = this._cartList.find( c => c.id )?.quantity;
            if( this.userModel?.payment?.payment_order == null ){
              p.points = 0;
            }else{
              p.points = pointsSearch.data.find( x => x.pack_id == this.userModel?.payment?.payment_order.pack.id && x.product_id == p.id)?.point ?? 0;
            }
            return p;
          });
        }
        if( points.success ) this.totalPointsPersonal = points.data.length == 0 ? 0 : (points.data?.map( p => p.points )?.reduce( (a,b) => a+b ) ?? 0);
        if( options.success ){
          this.isGlobalPersonal = this.userModel?.payment?.payment_order.pack.id == options.data[0].option_value;
        }
      }
    )
  }

  get countProduct(): number{
    return this._cartList.length;
  }

  quickViewToggle(): void {

    this.quickViewVisible = !this.quickViewVisible;
  }

  get cartList(): Array<IProductModel>{

    return this._cartList;
  }

  // Total con descuento aplicado
  get totalBuy(): number{
    const discount = this.getUserDiscount();
    if (this._cartList.filter( p => p.quantity > 0 ).length === 0) return 0;
    
    const total = this._cartList.filter( p => p.quantity > 0 )
      .map( p => p.price * p.quantity )
      .reduce( (a,b) => a+b, 0 );
    
    if (discount > 0) {
      return total * (100 - discount) / 100;
    }
    return total;
  }

  // Obtener la URL de la imagen
  getImageUrl(filePath: string): string {
    if (!filePath) return 'assets/images/placeholder.png';
    if (filePath.startsWith('storage/')) {
      return this.env.hostUrl + '/' + filePath;
    }
    return this.env.hostUrl + '/storage/' + filePath;
  }

  public onPayment(): void{

    if( this.cartList.length == 0 ){
      this.modalService.info("Debe Seleccionar los productos")
      return;
    }
    const modal = this.nZmodal.create({
      nzContent: PaymentProductsModalComponent,
      nzFooter: null,
      nzTitle: "",
      nzData: {
        userModel : this.userModel,
        cartList : this.cartList
      }
    })

    modal.afterClose.subscribe( () => {
      this.onSearch();
      this.apiService.getProductPaymnetPoints().subscribe(
        (response) => {
          if( response.success ) this.totalPointsPersonal = response.data.map( p => p.points ).reduce( (a,b) => a+b );
        }
      )
    } )
  }

  public onSearch(): void{
    this.eventSearch = (new Date()).getTime();
  }

  public onRemove(index: number): void{
    let cartId = this._cartList.find((_c , i) => i == index )?.id;
    this._cartList = this._cartList.filter( (c, i) => i != index );
    this.themeConstantService.changeCurrentCartList(this._cartList );

    this.productList = this.productList.map( c => {
      if( c.id == cartId ) c.quantity = 0;
      return c;
    })
  }
}