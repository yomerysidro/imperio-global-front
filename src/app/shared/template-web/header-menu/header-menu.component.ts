import { ViewportScroller, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { AuthenticationService } from '@shared/services/authentication.service';

import { IdentityService } from '@shared/services/identity.service';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { isAuth, removeSessionLocalAll } from '@shared/utilities/functions';
import AOS from 'aos';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss']
})
export class HeaderMenuComponent implements OnInit {

  isAuth = isAuth();

  fallback = CONSTANTS.IMAGE.FALLBACK;

  menuSection: string = 'inicio-section';

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  constructor(

    private router: Router,
    private scroller: ViewportScroller,
    private location: Location,
    private route: ActivatedRoute,
    private identityService: IdentityService,
    private themeConstantService: ThemeConstantService,
    private authenticationService: AuthenticationService
  ) {
    this.route.fragment
      .subscribe(fragment => {

        if( fragment != null ) this.menuSection = fragment;
        else this.menuSection = '';

        if( this.location.path() == '/' || this.location.path() == '/home' ){
          if( this.menuSection == '') this.menuSection = 'inicio-section';
        }
      }
    );

    this.avatarUrl = this.authenticationService.currentUserValue ? environment.hostUrl + '/storage/' + this.authenticationService.currentUserValue.photo : CONSTANTS.IMAGE.FALLBACK;

  }

  ngOnInit(): void {
    console.log( isAuth() )
    if( isAuth() ){

    }

  }

  isAuthLoad(): void{
    // this.beautifulFastService.getAuthMe().subscribe(
    //   (res)=> {
    //     this.identityService.setCurrentUser( res.data );
    //     this.avatarUrl = environment.hostStorage + '/' + res.data?.file?.path ?? '';
    //   }
    // )
  }

  public onLogout(): void{
    console.log("fff");

    removeSessionLocalAll();
    this.authenticationService.setCurrentUser(null);
    this.isAuth = false;
    this.router.navigate(['/home']);

  }

  public goTo(element: any): void{
    if( this.location.path() == '/' || this.location.path() == '/home' ){
      this.menuSection = element;
      this.scroller.scrollToAnchor( element );
    }else{
      let path = '/home';
      this.router.navigate([path] , { fragment: element } );
    }

  }

  ngOnDestroy(): void {

  }

}
