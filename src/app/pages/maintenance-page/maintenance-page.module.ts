import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenancePageComponent } from './maintenance-page.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: '',
        component: MaintenancePageComponent,
    },
]

@NgModule({
  declarations: [
    MaintenancePageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class MaintenancePageModule { }
