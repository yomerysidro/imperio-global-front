import { Dialog } from '@angular/cdk/dialog';
import { Component, DestroyRef, inject, OnInit, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { LOGIN_WELCOME_NAVIGATION } from '@shared/constants/login-welcome';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { getAccesToken } from '@shared/utilities/functions';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalService } from 'ng-zorro-antd/modal';
import { animationFrameScheduler, Observable } from "rxjs";
import { filter, observeOn, switchMap, take } from 'rxjs/operators';
import { LoginWelcomeComponent } from './login-welcome/login-welcome.component';

@Component({
    selector: 'app-common-layout',
    templateUrl: './common-layout.component.html',
    styleUrls: ['./common-layout.component.scss']
})

export class CommonLayoutComponent implements OnInit {
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);
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
      this.queueLoginWelcome();
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

    private queueLoginWelcome(): void {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd &&
          this.router.getCurrentNavigation()?.extras.info === LOGIN_WELCOME_NAVIGATION),
        take(1),
        observeOn(animationFrameScheduler),
        switchMap(() => this.nzModal.afterAllClose.pipe(take(1))),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        if (!getAccesToken()) return;

        const welcome = this.dialog.open(LoginWelcomeComponent, {
          width: 'min(500px, calc(100vw - 32px))',
          hasBackdrop: true,
          disableClose: true,
          autoFocus: '.welcome-action',
          ariaLabelledBy: 'login-welcome-title',
          ariaDescribedBy: 'login-welcome-description',
          ariaModal: true
        });
        this.destroyRef.onDestroy(() => welcome.close());
      });
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
