import { Component, Inject, Input, OnInit, Optional, Renderer2 } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { IProductModel } from '@shared/services/models/product.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ScriptService } from '@shared/services/script.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';
import KRGlue from "@lyracom/embedded-form-glue";
import { FormValidator } from '@shared/utilities/form-validator';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PaymentOfflineEfectivoComponent } from '../payment-offline-efectivo/payment-offline-efectivo.component';

@Component({
  selector: 'app-payment-products-modal',
  templateUrl: './payment-products-modal.component.html',
  styleUrls: ['./payment-products-modal.component.scss']
})
export class PaymentProductsModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Input() cartList: Array<IProductModel>

  paymentSection: number = 0;

  message: string = "";

  isPaymentError: boolean = true;
  messageError: string = "";
  linkPayment: string = "#";

  isLoadingFlow: boolean = false;
  isLoadingIzipay: boolean = false;

  validateForm: FormGroup;
  isSpinning: boolean = false;
  isSpinningPayment: boolean = false;
  paymentOrderProductId : string;

  amountDiscount: number = 0;

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
    private apiService: ApiService,
    private fb: FormBuilder,
    private scriptService: ScriptService,
    private rendered: Renderer2,
    private router: Router,
    private modalRef: NzModalRef,
    private modalService: ModalService,
    private formValidator: FormValidator,
    private nzModalService: NzModalService,
    private nzMessage: NzMessageService
  ) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }

    this.validateForm = this.fb.group({
      phoneContact: [  , [Validators.required]],
      addressContact: [ null , [Validators.required]],
    })
  }

  ngOnInit(): void {
    this.loadData();


    this.validateForm.patchValue({
      phoneContact: this.userModel?.phone??"",
      addressContact: this.userModel?.address??"",
    })



  }

  public loadData(): void{
    forkJoin(
      this.apiService.getOptionsSearch(),
      this.apiService.getProductPaymnetSearch({state: 2})
    ).subscribe(
      ([option, productss])=> {
        // this.userModel = userModel.data
        let second_buy_plan = option.data.find( o => o.option_key == "second_buy_plan" )?.option_value;

        this.amountDiscount = Number.parseFloat( this.userModel?.payment?.payment_order?.pack?.discount ?? "0" );

        if( this.userModel?.payment?.state == CONSTANTS.PAYMENT_ORDER.PAGADO ){
          if(  this.userModel?.payment?.payment_order?.pack?.id == second_buy_plan ){
            if( productss.data.length <= 1 ){
              this.amountDiscount == 0;
            }

          }
        }

      }
    )
  }

  get totalBuy(): number{
    return this.cartList.length>0 ? this.cartList?.map( p => this.amountDiscount == 0 ? (p.price * p.quantity) : ( (p.quantity * p.price) * (100 - this.amountDiscount) / 100) )?.reduce( (a,b) => a+b ) : 0;
  }

  get totalPoints(): number{
    return  this.cartList.length > 0 ? this.cartList.map(p=> p.points * p.quantity ).reduce( (a,b) => a+b ) : 0;
  }

  public onPaymentFlow(): void{

    if( !this.formValidator.validForm( this.validateForm ) ) return;
    this.isLoadingFlow = true;
    this.apiService.postProductPaymentCreateFlow(
      {
        phone: this.validateForm.get('phoneContact').value,
        address: this.validateForm.get('addressContact').value,
        details: this.cartList.map( p => {
          return {
            product: p.id,
            quantity: p.quantity ?? 0
          }
        })
      }).subscribe(
      (response) => {

        this.isLoadingFlow = false;
        this.paymentSection = 1;
        this.linkPayment = response.data;
        // this.modalRef.close();
      },
      (error) => {

        this.isLoadingFlow = false;
        this.modalService.error( error?.message ?? "Error");
        this.modalRef.close();
      }
    )
  }

  public onPaymentIzipay(): void{
    
    
    if( !this.formValidator.validForm( this.validateForm ) ) return;
    this.isLoadingIzipay = true;
    this.apiService.postProductPaymentCreateIzipay({
        phone: this.validateForm.get('phoneContact').value,
        address: this.validateForm.get('addressContact').value,
        details: this.cartList.map( p => {
          return {
            product: p.id,
            quantity: p.quantity ?? 0
          }
        })
    }).subscribe(
      (response) => {
        const modalElement = this.scriptService.loadJsScript(
          this.rendered, CONSTANTS.IZIPAY.JS_URL

        )
        this.paymentOrderProductId = response.data.id;

        modalElement.onload = () => {
          this.paymentSection = 2;
          this.isLoadingIzipay = false;
          KRGlue.loadLibrary(response.data.endpoint, response.data.publicKey) /* Load the remote library */
            .then(({ KR }) =>
              KR.setFormConfig({
                /* set the minimal configuration */
                formToken: response.data.formToken,
                "kr-language": "es-ES" /* to update initialization parameter */
              })
            )
            .then(({ KR }) => KR.addForm("#myPaymentForm")) /* add a payment form  to myPaymentForm div*/
            .then(({ KR, result }) => KR.showForm(result.formId))
            .then(({ KR }) => {
              this.isSpinning = true;
              return KR.onSubmit(this.onSubmit);
            } )
            .then(({ KR }) => {
              this.isSpinning = true;
              return KR.onError(this.onError);
            } )
            .catch(error => {
              this.modalRef.close();
              this.modalService.error( error?.message ?? "Error");
            }); /* show the payment form */

        }
      }, (error) => {
        console.log( error )
        this.isLoadingIzipay = false;
        this.modalService.error( error?.message ?? "Error");
        this.modalRef.close();
      }
    )
  }

  private onError = (error: KRError) =>{
    this.isSpinning = true;
    this.paymentSection = 3;
    this.isPaymentError = true;
    this.messageError = error.detailedErrorMessage ?? "Pago rechazado";
    this.isSpinning = false;
  }

  private onSubmit = (paymentData: KRPaymentResponse) => {
    this.isSpinningPayment = true;
    
    this.apiService.postProductPaymentConfirmIzizpay( {orderId: this.paymentOrderProductId , ...paymentData} ).subscribe(
      (response) => {
        
        this.paymentSection = 3;
        this.isPaymentError = false;
        this.isSpinningPayment = false;
      },
      (error) => {
        this.isSpinningPayment = false;
        this.modalService.error( error?.message ?? "Error");
        this.modalRef.close();
      }
    )
  }

  public onCloseModal():void{
    this.modalRef.close();
  }

  public onPaymentOffline(): void{


    this.modalRef.close();
    this.nzModalService.create({
      nzTitle: null,
      nzContent: PaymentOfflineEfectivoComponent,
      nzFooter: null,
      nzData: {
        isProduct: true,
        phoneContact: this.validateForm.get('phoneContact').value,
        addressContact: this.validateForm.get('addressContact').value,
        details: this.cartList.map( p => {
          return {
            product: p.id,
            quantity: p.quantity ?? 0
          }
        })
      }
    })


  }
}
