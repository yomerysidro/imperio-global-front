import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { environment } from '@env/environment';
import { PaymentViewVoucherModalComponent } from '@shared/components/payment/payment-view-voucher-modal/payment-view-voucher-modal.component';
import { UserTreeDetailComponent } from '@shared/components/user-tree-detail/user-tree-detail.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { IProductPaymentOrder } from '@shared/services/models/product-payment-order.interface';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-table-payment-product-order',
  templateUrl: './table-payment-product-order.component.html',
  styleUrls: ['./table-payment-product-order.component.scss']
})
export class TablePaymentProductOrderComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('templateChangeState', { read: TemplateRef }) templateChangeState:TemplateRef<any>;

  @Input() searchLoader: number = 0;
  @Input() queryParams: any = {};


  tablePaymentProductLoading: boolean = false;
  tablePaymentProducts: Array<IProductPaymentOrder> = [];

  pageIndex: number = CONSTANTS.PAGINATION.PAGE_INDEX;
  pageSize: number = CONSTANTS.PAGINATION.PAGE_SIZE;
  sortProperty: string = '';
  sortPropertyName: string = '';
  totalRecord: number = 0;

  private readonly subscriptions = new Subscription();
  private ordersRequest?: Subscription;

  environment = environment;
  CONSTANTS = CONSTANTS;

  _listPoints: Array<any> = [];
  loadingState: boolean = false;
  orderIdSelected: string;

  isAdmin: boolean = false;

  pathServe: string = environment.hostUrl + "/storage/";
  
  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private themeConstantService: ThemeConstantService
  ) {
    this.subscriptions.add(this.themeConstantService.isAdminUserChanges.subscribe(isAdmin => this.isAdmin = isAdmin));
  }

  ngOnInit(): void {
    this.onSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.searchLoader && !changes.searchLoader.firstChange && this.searchLoader > 0) {
      this.pageIndex = 1;
      this.onSearch();
    }
  }

  ngOnDestroy(): void {
    this.ordersRequest?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  public onSearch(): void{
    this.ordersRequest?.unsubscribe();
    this.tablePaymentProductLoading = true;
    this.ordersRequest = this.apiService.getUsersPaymnetFindAll({
      limit: this.pageSize , page: this.pageIndex,
      ...this.queryParams
    }).subscribe(
      (response) => {
        if( response.success ){
          this.tablePaymentProducts = response.data.items;
          this.totalRecord = response.data.pagination.total;
        }
        this.tablePaymentProductLoading = false;
      },(error) => {
        this.tablePaymentProductLoading = false;
      }
    )
  }

  onQueryParamsChange({ pageSize, pageIndex }: NzTableQueryParams): void {
    if (this.pageIndex === pageIndex && this.pageSize === pageSize) return;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.onSearch();
  }

  trackOrder(_index: number, order: IProductPaymentOrder): number {
    return order.id;
  }

  public onSeletedUSer(usercode: string, userModel: any): void{

    if( usercode == "-1" ) return;

    this.nzModalService.create({
      nzTitle: 'Detalle',
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
      nzWidth: '540px',
      nzClassName: 'user-detail-modal',
      nzData: {
        userModel: userModel,
        listPoints: this._listPoints,
        paymentOrder: userModel?.payment?.payment_order
      }
    })
  }

  public onSeletedVaucher(payment: IProductPaymentOrder): void{
    this.nzModalService.create({
      nzTitle: '',
      nzContent: PaymentViewVoucherModalComponent,
      nzFooter: null,
      nzWidth: '620px',
      nzClassName: 'order-voucher-modal',
      nzData: {
        iProductPaymentOrder: payment
      }
    })
  }

  public onCancel( ): void{
    this.nzModalService.closeAll();
  }

  public onChange( orderId: string ): void{
    if( this.isAdmin == false ){
      this.modalService.info("Este usuario no tiene permisos para esta acción");
      return;
    }
    this.orderIdSelected = orderId;
    this.nzModalService.create({
      nzContent: this.templateChangeState,
      nzFooter: null,
      nzTitle: "",
      nzWidth: '520px',
      nzClassName: 'order-state-modal'
    })
  }

  public onChangeState(): void{
    this.loadingState = true;
    this.modalService.confirm( "¿Estás seguro de modificar Estado de Envío ¿Estás realmente seguro?" , () => {
      this.apiService.postProductPaymentChangeState({
        orderId: this.orderIdSelected,
        state: 3
      }).subscribe(
        (response) => {
          this.onCancel();
          this.onSearch();
          this.loadingState = false;
        }, (error) => {
          this.loadingState = false;
        }
      )
    } ,  () => {
      this.loadingState = false;
    })

  }

  public onConfirmCash(paymentId: string): void{
    this.modalService.confirm("¿Desea confirmar el pago de los productos?" ,
      () => {
        this.apiService.postPaymentProductConfirmOffline({paymentId: paymentId}).subscribe(
          (response) => {
            this.nzModalService.closeAll();
            this.modalService.success("Compra confirmada");
            this.onSearch();
          },
          (error) => {
            this.modalService.error( error?.message ?? "Error");
            this.nzModalService.closeAll();
            this.onSearch();
          }
        )
      }
    )
  }

}
