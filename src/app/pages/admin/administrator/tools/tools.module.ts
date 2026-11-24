import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsPageComponent } from './tools-page/tools-page.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [
  {
      path: '',
      component: ToolsPageComponent,
      data: {
          title: 'Herramientas ',
          headerDisplay: "none"
      }
  },
  {
    path: 'users',
    loadChildren: () => import('./tools-users-page/tools-users-page.module').then(m => m.ToolsUsersPageModule),
    data: {
        title: 'Usuarios Registrados ',
        headerDisplay: "none"
    }
  },
  {
    path: 'orders',
    loadChildren: () => import('./tools-order-page/tools-order-page.module').then(m => m.ToolsOrderPageModule),
    data: {
        title: 'Pedidos Registrados ',
        headerDisplay: "none"
    }
  },
  {
    path: 'cash',
    loadChildren: () => import('./tools-cash-page/tools-cash-page.module').then(m => m.ToolsCashPageModule),
    data: {
        title: 'Flujo de Caja ',
        headerDisplay: "none"
    }
  },
  {
    path: 'request-patrocinio',
    loadChildren: () => import('./tool-request-patrocinio/tool-request-patrocinio.module').then(m => m.ToolRequestPatrocinioModule),
    data: {
        title: 'Solicitudes de cobro de Bonos Patrocinio ',
        headerDisplay: "none"
    }
  }
];

@NgModule({
  declarations: [
    ToolsPageComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[RouterModule]
})
export class ToolsModule { }
