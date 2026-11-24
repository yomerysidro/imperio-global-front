import { Component , DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ROUTES } from './side-nav-routes.config';
import { ThemeConstantService } from '../../services/theme-constant.service';
import { Router } from '@angular/router';
import { ModalService } from '@shared/utilities/modal-services';
import { removeSessionLocalAll } from '@shared/utilities/functions';
import { MESSAGES } from '@shared/constants/messages';

@Component({
    selector: 'app-sidenav',
    templateUrl: './side-nav.component.html'
})

export class SideNavComponent{
    private readonly destroyRef = inject(DestroyRef);

    public menuItems: any[]
    isFolded : boolean;
    isSideNavDark : boolean;
    isExpand : boolean;
    MESSAGES = MESSAGES;
    isAdmin : boolean;
    constructor(
      private themeService: ThemeConstantService,
      private router: Router,
      private modalService: ModalService
    ) {}

    ngOnInit(): void {

        this.themeService.isMenuFoldedChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFolded => {
          this.isFolded = isFolded
        });
        this.themeService.isExpandChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isExpand => this.isExpand = isExpand);
        this.themeService.isSideNavDarkChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isDark => this.isSideNavDark = isDark);
        this.themeService.isAdminUserChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isAdmin => {
          this.isAdmin = isAdmin;
          this.menuItems = ROUTES.filter(menuItem => menuItem).map(  m => { if( m.path == "/admin/tools" || m.path == "/admin/comision" || m.path == "/admin/finance" ) m.show = this.isAdmin; return m } );
        } );


    }

    closeMobileMenu(): void {
        if (window.innerWidth < 992) {
            this.isFolded = false;
            this.isExpand = !this.isExpand;
            this.themeService.toggleExpand(this.isExpand);
            this.themeService.toggleFold(this.isFolded);
        }
    }

    onLogout(): void{
      removeSessionLocalAll();
      this.router.navigate(['/home']);
      // this.modalService.confirm( this.MESSAGES.LOG_OUT , () => {
      //   removeSessionLocalAll();
      //   this.router.navigate(['/admin/auth/login'])
      // } )


    }
}
