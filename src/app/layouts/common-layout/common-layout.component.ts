import { Component, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable } from "rxjs";

@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss']
})

export class CommonLayoutComponent implements OnInit {
  @ViewChild('confirmInitedModal', { static: true, read: TemplateRef }) confirmInitedModal:TemplateRef<any>;
  
    breadcrumbs$: Observable<any> | undefined;
    contentHeaderDisplay: string | undefined;
    isFolded : boolean | undefined ;
    isSideNavDark : boolean | undefined;
    isExpand: boolean | undefined;
    selectedHeaderColor: string | undefined;

    loading: boolean = false;

    constructor(
      private router: Router,  
      private activatedRoute: ActivatedRoute, 
      private themeService: ThemeConstantService,
      private authenticationService: AuthenticationService,
      private nzModal: NzModalService,
      private apiService: ApiService,) {
        
    }

    ngOnInit() {
      this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
      this.themeService.isSideNavDarkChanges.subscribe(isDark => this.isSideNavDark = isDark);
      this.themeService.selectedHeaderColor.subscribe(color => this.selectedHeaderColor = color);
      this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);

      this.authenticationService.currentCodeInivited.subscribe( token => {

          if(token){
            localStorage.setItem("guest", token);
            this.nzModal.create({
              nzTitle: "Aceptar invitación",
              nzFooter: null,
              nzContent: this.confirmInitedModal,
              nzClosable: false,
              nzMaskClosable: false
            })
          }
        } )
    }

    onConfirm(confirm: boolean): void{
      this.loading = true;
      this.apiService.postInvitedEmailConfirm({token: localStorage.getItem("guest") , accept: confirm}).subscribe(
        (res) => {
          this.loading = false;
          localStorage.removeItem("guest");
          this.nzModal.closeAll();
        }
      )
    }
}
