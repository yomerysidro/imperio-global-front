import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';

import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';

@Component({
  selector: 'app-validate-confirmation',
  templateUrl: './validate-confirmation.component.html',
  styleUrls: ['./validate-confirmation.component.scss']
})
export class ValidateConfirmationComponent implements OnInit {

  frmValidateCode!: FormGroup;
  array = [1, 2, 3, 4];

  disabledButton: boolean = true;
  loadingSubmit: boolean = false;
  verification: boolean = false;
  loadingConfirm: boolean = false;
  loadingVerification: boolean = false;
  phoneNumber: string = "";

  isAuth: boolean = false;
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  code: string;

  continuePageSuccess: boolean = false;
  showError: boolean = false;
  textSuccess: string = '';
  textError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private formValidator: FormValidator,
    private modalService: ModalService,
    ) {

      this.route.params.subscribe(
        params => {
          this.code = params.code;
        }
      )
    }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.frmValidateCode = this.fb.group({
      code1: [null, [Validators.required ]],
      code2: [null, [Validators.required ]],
      code3: [null, [Validators.required ]],
      code4: [null, [Validators.required ]],
    });
  }

  onBlurconfirmationCode(data: any): void {
    this.disabledButton = true;
    if(data.length > 5) this.disabledButton = false;
  }

  private setCommand(): string {
    const {code1 , code2, code3 , code4} = this.frmValidateCode.value
    return code1 + code2 + code3 + code4;
  }

  public onConfirmCode(): void{
    if( !this.formValidator.validForm( this.frmValidateCode ) ) return;

    this.loadingConfirm = true;
    // this.beautifulFastService.postAuthenticationVerification( this.setCommand() ).subscribe(
    //   (res) => {
    //     this.loadingConfirm = false;
    //     this.verification = true;
    //   },(error) => {
    //     this.modalService.error( error.message )
    //     this.loadingConfirm = false;
    //     this.verification = false;
    //   }
    // )
  }

  public onSendCode(): void{
    this.frmValidateCode.get('confirmationcode').setValue('');
    this.loadingVerification = true;

  }

  onSubmit(): void {
    // this.loadingSubmit = true;

    if( !this.formValidator.validForm( this.frmValidateCode ) ) return;
    this.loadingSubmit = true;
    this.apiService.postValidateCode({ code : this.setCommand() } , this.code).subscribe(
      (res) => {
        if( res.success ){
          this.continuePageSuccess = true;
          this.textSuccess = res.message
        }else{
          this.textError = res.message
          this.onShowError();
        }
        this.loadingSubmit = false;
      },(error) => {
        this.modalService.error( error?.message ?? "Error!! Comunicarse con el provedor!!" );
        this.loadingSubmit = false;
      }
    )

  }

  public goTo(section: string): void{
    let path = '/home';
    this.router.navigate([path] , { fragment: section } );
  }

  onShowError(): void{
    this.showError = true;
    setTimeout(() => {
      this.showError = false;
    }, 2000);
  }

  nextStep(event, step: number): void {
    if (this.frmValidateCode.valid) {
      this.onSubmit()
    }
    const prevElement = document.getElementById('code' + (step - 1));
    const nextElement = document.getElementById('code' + (step + 1));
    if (event.code == 'Backspace' && event.target.value === '') {
      event.target.parentElement.parentElement.children[step - 2 > 0 ? step - 2 : 0].children[0].value = ''
      if (prevElement) {
        prevElement.focus()
        return
      }
    } else {
      if (nextElement) {
        nextElement.focus()
        return
      } else {

      }
    }
  }


  focused(step) {
    if (step === 2) {
      if (this.frmValidateCode.controls.code1.value === '') {
        document.getElementById('code1').focus();
      }
    }
    if (step === 3) {
      if (this.frmValidateCode.controls.code1.value === '' || this.frmValidateCode.controls.code2.value === '') {
        document.getElementById('code2').focus();
      }
    }

    if (step === 4) {
      if (this.frmValidateCode.controls.code1.value === '' || this.frmValidateCode.controls.code2.value === '' || this.frmValidateCode.controls.code3.value === '') {
        document.getElementById('code3').focus();
      }
    }
  }
}
