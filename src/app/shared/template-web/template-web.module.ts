import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderMenuComponent } from './header-menu/header-menu.component';
import { FooterMenuComponent } from './footer-menu/footer-menu.component';
import { RouterModule } from '@angular/router';

import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';

const antdModule = [
  NzIconModule,
  NzInputModule,
  NzImageModule
]

@NgModule({
  exports:[
    HeaderMenuComponent,
    FooterMenuComponent
  ],
  declarations: [
    HeaderMenuComponent,
    FooterMenuComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ...antdModule
  ]
})

export class TemplateWebModule { }
