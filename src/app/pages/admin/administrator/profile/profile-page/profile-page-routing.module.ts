import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfilePageComponent } from './profile-page.component';
import { MyProfileComponent } from './my-profile/my-profile.component';


const routes: Routes = [
    {
        path: 'mi-perfil',
        component: MyProfileComponent,
        data: { title: 'Mi perfil', headerDisplay: 'none' }
    },
    {
        path: '',
        pathMatch: 'full',
        component: ProfilePageComponent,
        data: {
            title: 'Dashboard',
            headerDisplay: "none"
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ProfilePageRoutingModule { }