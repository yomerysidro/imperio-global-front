import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { removeSessionLocalAll, stringFormat } from '@shared/utilities/functions';
import { IResponse, IResponsePaginationModel } from './interfaces/response.interface';
import { AuthModel, UserModel } from './models/user.interface';
import { HttpParams } from '@angular/common/http';
import { PackModel } from './models/packs.interface';
import { IProductModel } from './models/product.interface';
import { IProductPaymentOrder } from './models/product-payment-order.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private API:string = "/api/v1";

  constructor(
    private httpService: HttpService
  ) {

  }

  public postAuthentication( command: any ): Observable<IResponse<AuthModel>>{
    removeSessionLocalAll();
    return this.httpService.post<IResponse<AuthModel>>( '/login' , command).pipe(tap( res => res ));
  }

  public postAuthenticationRegister( command: any ): Observable<IResponse<AuthModel>>{
    removeSessionLocalAll();
    return this.httpService.post<IResponse<AuthModel>>( '/auth/register' , command).pipe(tap( res => res ));
  }

  public putAuthenticationUpdate( command: any ): Observable<IResponse<any>>{
    return this.httpService.put<IResponse<any>>( '/auth/update' , command).pipe(tap( res => res ));
  }

  public postAuthenticationAvatar( command: any ): Observable<IResponse<any>>{
    let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/auth/update/avatar' , command , options).pipe(tap( res => res ));
  }

  public getAuthenticationUser(): Observable<IResponse< UserModel >>{
    return this.httpService.get<IResponse<UserModel>>( '/auth' ).pipe(tap( res => res ));
  }

  public getPlansSearch(parameters: any = {}): Observable<IResponse< Array<PackModel> >>{
    let url = stringFormat(  '/pack/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<PackModel> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postPaymentCreate( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/payment/flow' , command ).pipe(tap( res => res ));
  }

  public getPointList(parameters: any = {}): Observable<IResponse< Array<any> >>{
    let url = stringFormat(  '/points/list' );
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<any> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getPointListUser(parameters: any = {}): Observable<IResponse< any >>{
    let url = stringFormat(  '/points/users' );
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< any >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getOptionsSearch(parameters: any = {}): Observable<IResponse< Array<any> >>{
    let url = stringFormat(  '/option/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<any> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }


  public postPaymentCreateIzipay( command: any ): Observable<IResponse<any>>{

    return this.httpService.post<IResponse<any>>( '/payment/izipay/create' , command ).pipe(tap( res => res ));
  }

  public postPaymentConfirmIzipay( command: any ): Observable<IResponse<any>>{

    return this.httpService.post<IResponse<any>>( '/payment/izipay/confirm' , command ).pipe(tap( res => res ));
  }

  public postPaymentCreateOffline( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/payment/cash-pre' , command ).pipe(tap( res => res ));
  }
  

  public postPaymentConfirmOffline( command: any): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/payment/cash-confirm' , command ).pipe(tap( res => res ));
  }

  public postValidateCode( command: any , uuid: string): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/auth/validate-code/' + uuid , command ).pipe(tap( res => res ));
  }

  public postRecoverPassword( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/auth/recover-password'  , command ).pipe(tap( res => res ));
  }

  public getUsersFindAll(parameters: any = {}): Observable< IResponse< IResponsePaginationModel< Array<UserModel> >> >{
    let url = stringFormat(  '/users/find-all');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get< IResponse<IResponsePaginationModel< Array<UserModel> >>>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getUsersSearch(parameters: any = {}): Observable< IResponse< Array<UserModel >> >{
    let url = stringFormat(  '/auth/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get< IResponse<Array<UserModel >>>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postProduct( command: any ): Observable<IResponse<any>>{
    let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/auth/update/avatar' , command , options).pipe(tap( res => res ));
  }

  public getProductSearch(parameters: any = {}): Observable< IResponse< Array<IProductModel>> >{
    let url = stringFormat(  '/product/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get< IResponse<Array<IProductModel>>>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postProductPaymentOffline( command: any ): Observable<IResponse<any>>{

    return this.httpService.post<IResponse<any>>( '/product/payment/offline' , command ).pipe(tap( res => res ));
  }

  public getProductPaymnetFindAll(parameters: any = {}): Observable<IResponse< IResponsePaginationModel<Array<IProductPaymentOrder>> >>{
    let url = stringFormat( '/product/payment/find-all');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< IResponsePaginationModel<Array<IProductPaymentOrder>> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getProductPaymnetDetailFindAll(parameters: any = {}): Observable<IResponse< IResponsePaginationModel<Array<any>> >>{
    let url = stringFormat( '/product/payment-detail/find-all');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< IResponsePaginationModel<Array<any>> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getProductPaymnetSearch(parameters: any = {}): Observable<IResponse< Array<IProductPaymentOrder> >>{
    let url = stringFormat( '/product/payment/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<IProductPaymentOrder> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postUserModify( command: any ): Observable<IResponse<any>>{

    return this.httpService.post<IResponse<any>>( '/users/modify' , command ).pipe(tap( res => res ));
  }

  public postProductPaymentCreateFlow( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/product/payment/flow' , command ).pipe(tap( res => res ));
  }

  public postProductPaymentCreateIzipay( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/product/payment/izipay-create' , command ).pipe(tap( res => res ));
  }

  public postProductPaymentConfirmIzizpay( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/product/payment/izipay-confirm' , command ).pipe(tap( res => res ));
  }

  public postProductPaymentChangeState( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/product/payment/change-state' , command ).pipe(tap( res => res ));
  }

  public getProductPaymnetPoints(parameters: any = {}): Observable<IResponse< Array<any> >>{
    let url = stringFormat( '/product/payment/points');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<any> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postUsercodeResetPoint( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/reset' , command ).pipe(tap( res => res ));
  }

  public postUsercodeDesactive( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/desactive' , command ).pipe(tap( res => res ));
  }

  public postUsercodeActiveResidual( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/active-residual' , command ).pipe(tap( res => res ));
  }

  public postUsercodeChangeSponsor( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/change-sponsor' , command ).pipe(tap( res => res ));
  }

  public getProductPointSearch(parameters: any = {}): Observable<IResponse< Array<any> >>{
    let url = stringFormat( '/product/points/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<any> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postUserPdfFinance( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/pdf-finance' , command ).pipe(tap( res => res ));
  }

   public postUserExcelFinance( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/excel-finance' , command ).pipe(tap( res => res ));
  }

  public postUserPdfProfile( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/pdf-profile' , command ).pipe(tap( res => res ));
  }


  public getUserCashFlow(parameters: any = {}): Observable<IResponse< any >>{
    let url = stringFormat(  '/users/cash-flow' );
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< any >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getUsersPaymnetFindAll(parameters: any = {}): Observable<IResponse< IResponsePaginationModel<Array<any>> >>{
    let url = stringFormat( '/users/payments/find-all');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< IResponsePaginationModel<Array<any>> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postGenerateLinkInvited( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/generate-invited' , command ).pipe(tap( res => res ));
  }

  public postInvitedEmail( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/invited-email' , command ).pipe(tap( res => res ));
  }

  public postInvitedEmailVerify( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/invited-verify' , command ).pipe(tap( res => res ));
  }

  public postInvitedEmailConfirm( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/invited-confirm' , command ).pipe(tap( res => res ));
  }

  public getInvitedUsers(parameters: any = {}): Observable<IResponse< any >>{
    let url = stringFormat(  '/users/invited-user' );
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< any >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postInvitedRemoved( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/invited-removed' , command ).pipe(tap( res => res ));
  }

  public postRequestPatrocinioGenerate( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/request-patrocinio/generate' , command ).pipe(tap( res => res ));
  }
  
  public getRequestPatrocinioFindAll(parameters: any = {}): Observable<IResponse< any >>{
    let url = stringFormat(  '/users/request-patrocinio/find-all' );
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< any >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public getUsersPaymnetSearch(parameters: any = {}): Observable<IResponse< Array<any> >>{
    let url = stringFormat( '/users/payments/search');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< Array<any> >>(url, { params: httpParams}).pipe(tap( res => res ));
  }

  public postRequestPatrocinioApproved( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/request-patrocinio/approve' , command , options).pipe(tap( res => res ));
  }

  public getRequestPatrocinioDownload(parameters: any = {}): Observable<IResponse< any >>{
    let url = stringFormat( '/users/request-patrocinio/download');
    let httpParams = new HttpParams({
      fromObject: parameters
    });
    return this.httpService.get<IResponse< any >>(url, { params: httpParams}).pipe(tap( res => res ));
  }


  public postUserCreate( command: any ): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/users/create-user' , command ).pipe(tap( res => res ));
  }

  public postPaymentProductCreateOffline( command: any ): Observable<IResponse<any>>{
    let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/payment-product/cash-pre' , command , options).pipe(tap( res => res ));
  }

  public postPaymentProductConfirmOffline( command: any): Observable<IResponse<any>>{
    // let options = { contentType: false, mimeType: 'multiplart/form-data' };
    return this.httpService.post<IResponse<any>>( '/payment-product/cash-confirm' , command ).pipe(tap( res => res ));
  }

  // 🔥 NUEVO MÉTODO: Obtiene un usuario específico por su código (uuid) usando el endpoint find-all
  public getUserByCode(code: string): Observable<IResponse< IResponsePaginationModel< Array<UserModel> >>> {
    let url = stringFormat('/users/find-all');
    let httpParams = new HttpParams({
      fromObject: { code: code, limit: 1, page: 1 }
    });
    return this.httpService.get<IResponse< IResponsePaginationModel< Array<UserModel> >>>(url, { params: httpParams }).pipe(tap(res => res));
  }
}