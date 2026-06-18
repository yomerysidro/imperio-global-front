import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';

import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';
//  ELIMINAR ESTAS IMPORTACIONES
// import {
//   CountryISO,
//   PhoneNumberFormat,
//   SearchCountryField,
// } from "ngx-intl-tel-input";

@Component({
    templateUrl: './login-1.component.html'
})

export class Login1Component implements OnInit {

    frmLogin!: FormGroup;
    array = [1, 2, 3, 4];

    defaultNumber = CONSTANTS.COUNTRIES_DEFAULT_NUMBER;

    loadingSubmit: boolean = false;

    // ✅ ELIMINAR ESTAS VARIABLES
    // CountryISO = CountryISO;
    // SearchCountryField = SearchCountryField;
    // PhoneNumberFormat = PhoneNumberFormat;

    isLoading: boolean = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private formValidator: FormValidator,
        private modalService: ModalService
    ) {

    }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.frmLogin = this.fb.group({
            email: [null, [Validators.required]],
            password: [null, [Validators.required]]
        });
    }

    onCreateAccount(): void {
        this.router.navigate(['/admin/auth/register']);
    }

    private commnad(): any {
        return {
            email: this.frmLogin.get('email')!.value,
            password: this.frmLogin.get('password')!.value
        }
    }

    submitForm(): void {
        if (!this.formValidator.validForm(this.frmLogin)) return;
        this.isLoading = true;
    }
}