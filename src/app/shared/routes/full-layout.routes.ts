import { Routes, RouterModule } from '@angular/router';

export const FullLayout_ROUTES: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('../../pages/admin/authentication/authentication.module').then(m => m.AuthenticationModule)
    }
];