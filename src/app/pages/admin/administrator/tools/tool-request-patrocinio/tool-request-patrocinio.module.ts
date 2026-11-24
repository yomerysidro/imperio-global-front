import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ToolRequestPatrocinioComponent } from './tool-request-patrocinio.component';
import { ToolRequestPatrocinioApprovedComponent } from './tool-request-patrocinio-approved/tool-request-patrocinio-approved.component';

@NgModule({
  declarations: [ToolRequestPatrocinioComponent, ToolRequestPatrocinioApprovedComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: ToolRequestPatrocinioComponent }])]
})
export class ToolRequestPatrocinioModule {}
