import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeUsersPageComponent } from './tree-users-page.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';

const routes: Routes = [
  {
      path: '',
      component: TreeUsersPageComponent,
      data: {
          title: 'Arbol ',
          headerDisplay: "none"
      }
  }
];

@NgModule({
  declarations: [
    TreeUsersPageComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    SharedModule,
    CommonModule,

  ]
})
export class TreeUsersPageModule { }
