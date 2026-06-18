import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { ModalService } from '@shared/utilities/modal-services';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  urlBase: string = environment.hostUrl + '/api/v1';

  constructor(
    private httpClient: HttpClient
  ) {}

  public get<T>(url: string, options: any = {}): Observable<T> {
    return this.httpClient.get<T>( this.urlBase + url, options).pipe(
      map((res: any) => {
        return res;
      }),
      catchError(this.handleError)
    );
  }

  public post<T>(url: string, data: any, options?: any): Observable<T> {
    return this.httpClient.post( this.urlBase + url, data, options).pipe(
      map((res: any) => {
          return res;
      }),
      catchError(this.handleError)
    );
  }

  public put<T>(url: string, data: any, options?: any): Observable<T> {
    return this.httpClient.put( this.urlBase + url, data, options).pipe(
      map((res: any) => {
        return res;
      }),
      catchError(this.handleError)
    );
  }

  public delete<T>(url: string, options?: any): Observable<T> {
    return this.httpClient.delete( this.urlBase + url, options).pipe(
      map((res: any) => {
        return res;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(httpError: HttpErrorResponse) {
    console.log( httpError )
    if (httpError.error instanceof ErrorEvent) {
      return throwError(httpError.error.message);
    } else {
      if (httpError.status == 401) return throwError('No Autorizado');
      else return throwError(httpError.error);
    }
  }

  private mapSuccess() {

  }
}
