import { NgModule } from '@angular/core';
import { Routes , RouterModule } from '@angular/router';
import { CommonLayout_ROUTES } from '@shared/routes/common-layout.routes';
import { FullLayout_ROUTES } from '@shared/routes/full-layout.routes';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { CommonLayoutComponent } from 'src/app/layouts/common-layout/common-layout.component';
import { FullLayoutComponent } from 'src/app/layouts/full-layout/full-layout.component';


const routes: Routes = [
    {
        path: '',
        canActivate:[AuthGuard],
        component: CommonLayoutComponent,
        children: CommonLayout_ROUTES
    }
    // {
    //     path: '',
    //     component: FullLayoutComponent,
    //     children: FullLayout_ROUTES
    // }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})

export class AdminRoutingModule { }
