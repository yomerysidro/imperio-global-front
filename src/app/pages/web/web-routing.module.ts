import { NgModule } from '@angular/core';
import { Routes , RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WebLayoutComponent } from 'src/app/layouts/web-layout/web-layout.component';
import { WebLayout_ROUTES } from '@shared/routes/web-layout.routes';
import { FullLayoutComponent } from 'src/app/layouts/full-layout/full-layout.component';
import { GuestComponent } from './guest/guest.component';


const routes: Routes = [
    
    {
        path: '',
        component: WebLayoutComponent,
        children: WebLayout_ROUTES
    },
    {
        path: 'auth',
        loadChildren: () => import('../web/authentication/authentication.module').then( m => m.AuthenticationWebModule )
    },
    {
        path: "guest",
        component: FullLayoutComponent,
        children: [
            {
                path: ':code',
                component: GuestComponent
            }
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class WebRoutingModule { }