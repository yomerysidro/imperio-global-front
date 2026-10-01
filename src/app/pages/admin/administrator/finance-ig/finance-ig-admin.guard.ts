import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthenticationService } from '@shared/services/authentication.service';

@Injectable()
export class FinanceIgAdminGuard implements CanActivate {
  constructor(private authenticationService: AuthenticationService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    return this.authenticationService.currentUserValue?.admin === true
      ? true
      : this.router.parseUrl('/admin/profile');
  }
}
