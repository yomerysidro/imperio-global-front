import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebRoutingModule } from './web-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';

/** ================= MODULES ======================== **/
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { ServicesComponent } from './services/services.component';
import { StylistsComponent } from './stylists/stylists.component';
import { CardServiceComponent } from '@shared/components/card-service/card-service.component';
import { GuestComponent } from './guest/guest.component';



const antdModule = [
  NzIconModule,
  NzInputModule,
  NzButtonModule,
  NzModalModule,
  NzFormModule,
  NzGridModule,
  NzPaginationModule,
  NzRadioModule,
  NzSelectModule,
  NzSpinModule
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
    FormsModule,
    ReactiveFormsModule,
    CardServiceComponent,
    ...antdModule,
    WebRoutingModule,
  ]
})

export class WebModule { }
