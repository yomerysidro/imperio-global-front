import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { AuthenticationService } from '../services/authentication.service';
import { catchError } from 'rxjs/operators';
import { removeSessionLocalAll } from '@shared/utilities/functions';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authenticationService: AuthenticationService,private router: Router,) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let currentUser = this.authenticationService.currentUserValue;
        if ( currentUser ) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${this.authenticationService.currentTokenValue}`
                }
            });
        }

        return next.handle(request).pipe( catchError(
          error => {
            if(error instanceof HttpErrorResponse && error.status === 401){
              removeSessionLocalAll();
              this.router.navigate(['/home']);
            }
            return throwError(error);
          }
        ) );
    }
}
