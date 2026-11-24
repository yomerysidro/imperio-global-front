import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ToolsCashPageComponent } from './tools-cash-page.component';

@NgModule({
  declarations: [ToolsCashPageComponent],
  imports: [SharedModule, RouterModule.forChild([{ path: '', component: ToolsCashPageComponent }])]
})
export class ToolsCashPageModule {}
