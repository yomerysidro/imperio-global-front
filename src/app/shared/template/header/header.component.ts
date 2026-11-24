import { Component } from '@angular/core';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ApiService } from '@shared/services/api.service';
import { Router } from '@angular/router';
import { removeSessionLocalAll } from '@shared/utilities/functions';


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html'
})

export class HeaderComponent{

    searchVisible : boolean = false;
    quickViewVisible : boolean = false;
    isFolded : boolean = false;
    isExpand : boolean = false;
    userName: string = 'Usuario';
    userEmail: string = 'Correo no disponible';

    constructor(
        private themeService: ThemeConstantService,
        private authenticationService: AuthenticationService,
        private apiService: ApiService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.themeService.isMenuFoldedChanges.subscribe(isFolded => this.isFolded = isFolded);
        this.themeService.isExpandChanges.subscribe(isExpand => this.isExpand = isExpand);
        this.authenticationService.currentUser.subscribe(user => {
            this.userName = user?.name || 'Usuario';
        });
        this.apiService.getAuthenticationUser().subscribe({
            next: response => {
                this.userName = response?.data?.name || this.userName;
                this.userEmail = response?.data?.email || this.userEmail;
            }
        });
    }

    toggleFold() {
        this.isFolded = !this.isFolded;
        this.themeService.toggleFold(this.isFolded);
    }

    toggleExpand() {
        this.isFolded = false;
        this.isExpand = !this.isExpand;
        this.themeService.toggleExpand(this.isExpand);
        this.themeService.toggleFold(this.isFolded);
    }

    onLogout(): void {
        removeSessionLocalAll();
        this.authenticationService.setCurrentUser(null);
        this.router.navigate(['/home']);
    }

    searchToggle(): void {
        this.searchVisible = !this.searchVisible;
    }

    quickViewToggle(): void {
        this.quickViewVisible = !this.quickViewVisible;
    }

    notificationList = [
        {
            title: 'You received a new message',
            time: '8 min',
            icon: 'mail',
            color: 'ant-avatar-' + 'blue'
        },
        {
            title: 'New user registered',
            time: '7 hours',
            icon: 'user-add',
            color: 'ant-avatar-' + 'cyan'
        },
        {
            title: 'System Alert',
            time: '8 hours',
            icon: 'warning',
            color: 'ant-avatar-' + 'red'
        },
        {
            title: 'You have a new update',
            time: '2 days',
            icon: 'sync',
            color: 'ant-avatar-' + 'gold'
        }
    ];
}
