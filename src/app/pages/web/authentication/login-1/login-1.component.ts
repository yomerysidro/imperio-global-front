import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup,  Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { IResponse } from '@shared/services/interfaces/response.interface';
import { AuthModel } from '@shared/services/models/user.interface';
import { ThemeConstantService } from '@shared/services/theme-constant.service';

import { FormValidator } from '@shared/utilities/form-validator';
import { removeSessionLocalAll, saveSessionStorage } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';

@Component({
    templateUrl: './login-1.component.html',
    styleUrls: ['./login-1.component.scss']
})

export class Login1Component implements OnInit{

    frmLogin!: FormGroup;
    array = [1, 2, 3, 4];

    defaultNumber = CONSTANTS.COUNTRIES_DEFAULT_NUMBER;

    loadingSubmit: boolean = false;


    isAuth: boolean = false;
    isViewPassword: boolean = false;
    avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

    constructor(
      private fb: FormBuilder,
      private router: Router,
      private apiService: ApiService,
      private formValidator: FormValidator,
      private modalService: ModalService,
      private authenticationService: AuthenticationService,
      private themeConstantService: ThemeConstantService
    ){

    }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
      this.frmLogin = this.fb.group({
        email: [null, [Validators.required , Validators.email]],
        password: [null, [Validators.required  ]],
        remember: [null],
        terms: [null]
      });
    }

    onCreateAccount(): void {
      this.router.navigate(['/auth/register']);
    }

    private commnad(): any {
      return {
        email: this.frmLogin.get('email')!.value,
        password: this.frmLogin.get('password')!.value
      }
    }

    onSubmit(): void {
      if( !this.formValidator.validForm( this.frmLogin ) ) return;
      this.loadingSubmit = true;
      this.authenticationService.setCurrentCodeInivited( localStorage.getItem("guest") );
      removeSessionLocalAll();
      this.apiService.postAuthentication( this.commnad() ).subscribe(
        ( response: IResponse<AuthModel> ) => {
          saveSessionStorage( response.data );

          this.authenticationService.setCurrentUser( response.data );
          this.themeConstantService.changeAdminUser( response.data.admin )
          this.router.navigate(['/admin/profile']);
          this.loadingSubmit = false;
        },(error) => {
          console.log( error )
          this.loadingSubmit = false;
          this.modalService.error( error?.message ?? error );
        }
      )

    }


    goTo(section: string): void{
      let path = '/home';
      this.router.navigate([path] , { fragment: section } );
    }

    onViewPassword(is: boolean): void{
      this.isViewPassword = is;
    }
}
