import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembershipPlanPageComponent } from './membership-plan-page.component';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [
  {
      path: '',
      component: MembershipPlanPageComponent,
      data: {
          title: 'Plan Afiliación ',
          headerDisplay: "none"
      }
  }
];


@NgModule({
  declarations: [
    MembershipPlanPageComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[RouterModule]
})
export class MembershipPlanPageModule { }
