import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfilePageComponent } from './profile-page.component';

/** Import any ng-zorro components as the module required except icon module */
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { SharedModule } from '@shared/shared.module';
import { ProfilePageRoutingModule } from './profile-page-routing.module';
import { ProfileInvitedModalComponent } from './profile-invited-modal/profile-invited-modal.component';

const antdModule = [
  NzButtonModule,
  NzCardModule,
  NzAvatarModule
]

@NgModule({
  declarations: [

    ProfilePageComponent,
     ProfileInvitedModalComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    ProfilePageRoutingModule
  ]
})
export class ProfilePageModule { }
