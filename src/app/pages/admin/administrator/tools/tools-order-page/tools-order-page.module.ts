import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ToolsOrderPageComponent } from './tools-order-page.component';

@NgModule({
  declarations: [ToolsOrderPageComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: ToolsOrderPageComponent }])]
})
export class ToolsOrderPageModule {}
