import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-table-payment-product-order',
  templateUrl: './table-payment-product-order.component.html',
  styleUrls: ['./table-payment-product-order.component.scss']
})
export class TablePaymentProductOrderComponent implements OnInit {

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

  initLoad: boolean = true;

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
    this.themeConstantService.isAdminUserChanges.subscribe( (r) => {
      this.isAdmin = r
    } );
  }

  ngOnInit(): void {
    this.onSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if( this.searchLoader > 0 ) this.onSearch();
  }

  public onSearch(): void{
    this.tablePaymentProductLoading = true;
    this.apiService.getUsersPaymnetFindAll({
      limit: this.pageSize , page: this.pageIndex,
      ...this.queryParams
    }).subscribe(
      (response) => {
        if( response.success ){
          this.tablePaymentProducts = response.data.items;
          this.totalRecord = response.data.pagination.total;
        }
        this.tablePaymentProductLoading = false;
        this.initLoad = false;
      },(error) => {
        this.tablePaymentProductLoading = false;
      }
    )
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    let sortOrder;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    if (sort[0]?.value !== null) {
      if (sort[0]?.value == 'ascend') sortOrder = 'ASC';
      if (sort[0]?.value == 'descend') sortOrder = 'DESC';

      if (sort[0]?.key === 'name') this.sortProperty = 'name ' + sortOrder;

    }

    if( !this.initLoad ) this.onSearch();
  }

  public onSeletedUSer(usercode: string, userModel: any): void{

    if( usercode == "-1" ) return;

    this.nzModalService.create({
      nzTitle: 'Detalle',
      nzContent: UserTreeDetailComponent,
      nzFooter: null,
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
      nzTitle: ""
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
