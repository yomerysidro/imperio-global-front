import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ToolsUsersPageComponent } from './tools-users-page.component';
import { ToolsUsersUpdateModalComponent } from './tools-users-update-modal/tools-users-update-modal.component';
import { ToolsUsersResetModalComponent } from './tools-users-reset-modal/tools-users-reset-modal.component';
import { ToolsUsersReactiveModalComponent } from './tools-users-reactive-modal/tools-users-reactive-modal.component';
import { ToolsUserAddModalComponent } from '../tools-user-add-modal/tools-user-add-modal.component';

@NgModule({
  declarations: [ToolsUsersPageComponent, ToolsUsersUpdateModalComponent, ToolsUsersResetModalComponent, ToolsUsersReactiveModalComponent, ToolsUserAddModalComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: ToolsUsersPageComponent }])]
})
export class ToolsUsersPageModule {}
