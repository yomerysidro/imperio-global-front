import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { SharedModule } from '@shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthenticationWebRoutingModule } from './authentication-routing.module';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { Login1Component } from './login-1/login-1.component';
import { Error1Component } from './error-1/error-1.component';

import { RegisterComponent } from './register/register.component';
import { ValidateConfirmationComponent } from './validate-confirmation/validate-confirmation.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { BrowserModule } from '@angular/platform-browser';
import { TemplateWebModule } from '@shared/template-web/template-web.module';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';

const antdModule= [
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCardModule,
    NzCheckboxModule
]

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        AuthenticationWebRoutingModule
    ],
    declarations: [
        Login1Component,
        Error1Component,
        RegisterComponent,
        ValidateConfirmationComponent,
        ConfirmationComponent,
        RecoverPasswordComponent
    ]
})

export class AuthenticationWebModule {}
