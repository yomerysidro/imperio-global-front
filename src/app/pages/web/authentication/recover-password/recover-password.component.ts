import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '@shared/services/api.service';
import { IResponse } from '@shared/services/interfaces/response.interface';
import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {

  isAuth: boolean = false;
  frmRecoverPassword!: FormGroup;

  loadingSubmit: boolean = false;

  continuePageSuccess: boolean = false;
  showError: boolean = false;
  textSuccess: string = '';
  textError: string = '';

  constructor(
    private fb: FormBuilder,
      private router: Router,
      private apiService: ApiService,
      private formValidator: FormValidator,
      private modalService: ModalService,
  ) {
    this.frmRecoverPassword = this.fb.group({
      email: [null, [Validators.required , Validators.email]]
    });
  }

  ngOnInit(): void {
  }


  goTo(section: string): void{
    let path = '/home';
    this.router.navigate([path] , { fragment: section } );
  }

  onLoginPath(): void{
    this.router.navigate(['/auth/login']);
  }


  onSubmit(): void {
    if( !this.formValidator.validForm( this.frmRecoverPassword ) ) return;
    this.loadingSubmit = true;

    this.showError = false;
    this.apiService.postRecoverPassword( {email: this.frmRecoverPassword.get('email').value } ).subscribe(
      ( response: IResponse<any> ) => {
        if( response.success ){
          this.router.navigate(['/auth/verification-code/' + response.data.validation])
        }else{
          this.textError = response.message
          this.onShowError();
        }
      },(error) => {

        this.loadingSubmit = false;
        this.modalService.error( error?.message ?? error );
      }
    )

  }

  onShowError(): void{
    this.showError = true;
    setTimeout(() => {
      this.showError = false;
    }, 2000);
  }
}
