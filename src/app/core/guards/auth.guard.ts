import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthenticationService } from '@shared/services/authentication.service';
import { validateExpirateToken } from '@shared/utilities/functions';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ){}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot

  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    let validateAccess = validateExpirateToken();
    if(state.url === '/auth/login' && validateAccess){
      this.router.navigate(['/']);
      return true;
    }else if (state.url == '/auth/login' && !validateAccess) return true;
    else if (validateAccess) return true;
    else{
      this.router.navigate(['auth/login']);
      return false;
    }

  }
}
