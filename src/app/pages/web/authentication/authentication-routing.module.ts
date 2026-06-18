import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Login1Component } from './login-1/login-1.component';
import { Error1Component } from './error-1/error-1.component';

import { RegisterComponent } from './register/register.component';
import { ValidateConfirmationComponent } from './validate-confirmation/validate-confirmation.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';

const routes: Routes = [
    {
        path: 'login',
        component: Login1Component,
        data: {
            title: 'Login 1'
        }
    },
    {
        path: 'register',
        component: RegisterComponent,
        data: {
            title: 'register'
        }
    },
    {
      path: 'recover-password',
      component: RecoverPasswordComponent,
      data: {
          title: 'Recuperar Contraseña'
      }
    },
    {
      path: 'verification-code/:code',
      component: ValidateConfirmationComponent,
      data: {
          title: 'Verificación'
      }
    },
    {
        path: 'confirmation',
        component: ConfirmationComponent,
        data: {
            title: 'confirmation'
        }
    },
    {
        path: '**',
        component: Error1Component,
        data: {
            title: 'Error'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AuthenticationWebRoutingModule { }
