import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRoutingModule } from './web-routing.module';
import { BrowserModule } from '@angular/platform-browser'
import { HomeComponent } from './home/home.component';

/** ================= MODULES ======================== **/
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';

import { ServicesComponent } from './services/services.component';
import { StylistsComponent } from './stylists/stylists.component';
import { SharedModule } from '@shared/shared.module';
import { GuestComponent } from './guest/guest.component';



const antdModule = [
  NzIconModule,
  NzInputModule,
  NzButtonModule,
  NzModalModule,
  NzDatePickerModule,
  NzTimePickerModule
]

@NgModule({
  declarations: [
    HomeComponent,
    ServicesComponent,
    StylistsComponent,
    GuestComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    WebRoutingModule,
  ]
})

export class WebModule { }
