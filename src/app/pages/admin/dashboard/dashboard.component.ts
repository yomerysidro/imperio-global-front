import { Component, OnInit } from '@angular/core';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { getProfileName } from '@shared/utilities/functions';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
})

export class DashboardComponent implements OnInit {

    userModel!: UserModel;

    profileName: string = getProfileName();

    constructor(
        private apiService: ApiService
    ) { }

    ngOnInit(): void {
        this.getUserCurrent();
    }

    getUserCurrent(): void {
        this.apiService.getAuthenticationUser().subscribe(
            (response) => {
                this.userModel = response.data;
            }
        );
    }
}
