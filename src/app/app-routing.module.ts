import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

const appRoutes: Routes = [
  // {
  //   path: '',
  //   loadChildren: () => import('./pages/maintenance-page/maintenance-page.module').then( m => m.MaintenancePageModule )
  // },
  {
      path: '',
      loadChildren: () => import('./pages/web/web.module').then( m => m.WebModule )
  },
  {
      path: 'admin',
      loadChildren: () => import('./pages/admin/admin.module').then( m => m.AdminModule )
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
        preloadingStrategy: PreloadAllModules,
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
    })
  ],
  exports: [
      RouterModule
  ]
})
export class AppRoutingModule { }
