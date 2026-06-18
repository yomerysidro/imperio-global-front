import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';

import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';
// ✅ ELIMINAR ESTA IMPORTACIÓN
// import { CountryISO, PhoneNumberFormat, SearchCountryField } from 'ngx-intl-tel-input';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

    frmRegister!: FormGroup;

    array = [1, 2, 3, 4];

    defaultNumber = CONSTANTS.COUNTRIES_DEFAULT_NUMBER;

    loadingSubmit: boolean = false;

    // ✅ ELIMINAR ESTAS VARIABLES
    // CountryISO = CountryISO;
    // SearchCountryField = SearchCountryField;
    // PhoneNumberFormat = PhoneNumberFormat;

    isAuth: boolean = false;
    avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private apiService: ApiService,
        private formValidator: FormValidator,
        private modalService: ModalService
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.frmRegister = this.fb.group({
            userName: [null, [Validators.required]],
            email: [null, [Validators.required, Validators.email]],
            password: [null, [Validators.required, Validators.minLength(8)]],
            repeatpassword: [null, [Validators.required]],
            terms: [null, [Validators.required]],
            dni: [null, [Validators.required]],
        }, {
            validator: this.formValidator.confirmationPassword('password', 'repeatpassword')
        });
    }

    private setCommad(): any {
        const { userName, email, password, repeatpassword, dni } = this.frmRegister.getRawValue();
        return {
            name: userName,
            email: email,
            dni: dni,
            password: password,
            password_confirmation: repeatpassword
        }
    }

    public onSubmit(): void {
        if (!this.formValidator.validForm(this.frmRegister)) return;

        this.loadingSubmit = true;

        this.apiService.postAuthenticationRegister(this.setCommad()).subscribe(
            (response) => {
                this.loadingSubmit = false;
                this.modalService.success("¡Genial! Se ha creado su usuario correctamente.");
                this.router.navigate(['/auth/login']);
            }, (error) => {
                this.modalService.error(error?.message ?? "")
                this.loadingSubmit = false;
            }
        )
    }

    public goTo(section: string): void {
        let path = '/home';
        this.router.navigate([path], { fragment: section });
    }
}