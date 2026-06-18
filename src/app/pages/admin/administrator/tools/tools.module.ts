import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsPageComponent } from './tools-page/tools-page.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ToolsUsersPageComponent } from './tools-users-page/tools-users-page.component';
import { ToolsOrderPageComponent } from './tools-order-page/tools-order-page.component';
import { ToolsUsersUpdateModalComponent } from './tools-users-page/tools-users-update-modal/tools-users-update-modal.component';
import { ToolsUsersSponsorModalComponent } from './tools-users-page/tools-users-sponsor-modal/tools-users-sponsor-modal.component';
import { ToolsUsersResetModalComponent } from './tools-users-page/tools-users-reset-modal/tools-users-reset-modal.component';
import { ToolsCashPageComponent } from './tools-cash-page/tools-cash-page.component';
import { ToolsUsersReactiveModalComponent } from './tools-users-page/tools-users-reactive-modal/tools-users-reactive-modal.component';
import { ToolRequestPatrocinioComponent } from './tool-request-patrocinio/tool-request-patrocinio.component';
import { ToolRequestPatrocinioApprovedComponent } from './tool-request-patrocinio/tool-request-patrocinio-approved/tool-request-patrocinio-approved.component';
import { ToolsUserAddModalComponent } from './tools-user-add-modal/tools-user-add-modal.component';

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
    component: ToolsUsersPageComponent,
    data: {
        title: 'Usuarios Registrados ',
        headerDisplay: "none"
    }
  },
  {
    path: 'orders',
    component: ToolsOrderPageComponent,
    data: {
        title: 'Pedidos Registrados ',
        headerDisplay: "none"
    }
  },
  {
    path: 'cash',
    component: ToolsCashPageComponent,
    data: {
        title: 'Flujo de Caja ',
        headerDisplay: "none"
    }
  },
  {
    path: 'request-patrocinio',
    component: ToolRequestPatrocinioComponent,
    data: {
        title: 'Solicitudes de cobro de Bonos Patrocinio ',
        headerDisplay: "none"
    }
  }
];

@NgModule({
  declarations: [
    ToolsPageComponent,
    ToolsUsersPageComponent,
    ToolsOrderPageComponent,
    ToolsUsersUpdateModalComponent,
    ToolsUsersSponsorModalComponent,
    ToolsUsersResetModalComponent,
    ToolsCashPageComponent,
    ToolsUsersReactiveModalComponent,
    ToolRequestPatrocinioComponent,
    ToolRequestPatrocinioApprovedComponent,
    ToolsUserAddModalComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[RouterModule]
})
export class ToolsModule { }
