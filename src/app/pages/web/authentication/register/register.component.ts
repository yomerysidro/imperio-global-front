import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';

import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';
import { NzMessageService } from 'ng-zorro-antd/message';
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
    loadingSponsor: boolean = false;
    invitationLoading: boolean = false;
    invitationInvalid: boolean = false;
    sponsorName: string = '';
    sponsorFromInvitation: boolean = false;
    sponsorValidated: boolean = false;
    validatedSponsorCode: string = '';

    // ✅ ELIMINAR ESTAS VARIABLES
    // CountryISO = CountryISO;
    // SearchCountryField = SearchCountryField;
    // PhoneNumberFormat = PhoneNumberFormat;

    isAuth: boolean = false;
    avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private apiService: ApiService,
        private formValidator: FormValidator,
        private modalService: ModalService,
        private messageService: NzMessageService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.frmRegister.get('sponsor_code')?.valueChanges.subscribe(value => {
            if (this.sponsorFromInvitation) return;

            const currentCode = String(value || '').trim();
            // validForm() ejecuta updateValueAndValidity(), que puede volver a
            // emitir el mismo valor. Solo invalidamos si el código realmente
            // cambió respecto al que confirmó sponsor-verify.
            if (
                this.sponsorValidated &&
                this.validatedSponsorCode &&
                currentCode === this.validatedSponsorCode
            ) {
                return;
            }

            this.sponsorName = '';
            this.sponsorValidated = false;
            this.validatedSponsorCode = '';
        });
        const invitationToken = this.route.snapshot.queryParamMap.get('invitation');
        if (invitationToken) this.verifyInvitation(invitationToken);
    }

    initForm(): void {
        this.frmRegister = this.fb.group({
            userName: [null, [Validators.required]],
            email: [null, [Validators.required, Validators.email]],
            password: [null, [Validators.required, Validators.minLength(8)]],
            repeatpassword: [null, [Validators.required]],
            terms: [null, [Validators.required]],
            dni: [null, [Validators.required]],
            sponsor_code: [null, [Validators.required]],
        }, {
            validator: this.formValidator.confirmationPassword('password', 'repeatpassword')
        });
    }

    private setCommad(): any {
        const { userName, email, password, dni } = this.frmRegister.getRawValue();
        return {
            name: userName,
            email: email,
            dni: dni,
            password: password,
            sponsor_code: this.validatedSponsorCode
        }
    }

    public onSubmit(): void {
        if (this.invitationLoading || this.invitationInvalid || !this.formValidator.validForm(this.frmRegister)) return;

        if (this.isSponsorSubmissionBlocked) {
            this.modalService.warning('Primero ingresa y valida un código de patrocinador válido.');
            return;
        }

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

    public onSearchSponsor(): void {
        if (this.sponsorFromInvitation) return;

        const sponsorCode = String(this.frmRegister.get('sponsor_code')?.value || '').trim();

        // appDelayedInput también puede emitirse al perder el foco cuando el
        // usuario pulsa "Crear cuenta". Si este mismo código ya fue validado,
        // no debemos borrar su estado ni iniciar otra petición.
        if (
            this.sponsorValidated &&
            this.validatedSponsorCode &&
            this.validatedSponsorCode === sponsorCode
        ) {
            return;
        }

        this.sponsorName = '';
        this.sponsorValidated = false;
        this.validatedSponsorCode = '';
        if (!sponsorCode) return;

        this.loadingSponsor = true;
        this.apiService.getPublicSponsorVerify(sponsorCode).subscribe({
            next: response => {
                this.loadingSponsor = false;
                const payload: any = response?.data || response;
                const verifiedCode = String(payload?.sponsor_code || payload?.uuid || '').trim();
                const isSameCode = verifiedCode.toLowerCase() === sponsorCode.toLowerCase();

                if (response?.success && isSameCode) {
                    this.sponsorValidated = true;
                    this.validatedSponsorCode = verifiedCode;
                    this.sponsorName = payload?.sponsor_name || payload?.name || '';
                    this.frmRegister.patchValue(
                        { sponsor_code: verifiedCode },
                        { emitEvent: false }
                    );
                } else {
                    this.sponsorValidated = false;
                    this.validatedSponsorCode = '';
                    this.sponsorName = '';
                    this.showSponsorNotFound(sponsorCode);
                }
            },
            error: () => {
                this.loadingSponsor = false;
                this.sponsorName = '';
                this.sponsorValidated = false;
                this.validatedSponsorCode = '';
                this.showSponsorNotFound(sponsorCode);
            }
        });
    }

    private showSponsorNotFound(code: string): void {
        this.messageService.error('No se encontró el patrocinador', { nzDuration: 2500 });
    }

    private verifyInvitation(token: string): void {
        this.invitationLoading = true;
        this.invitationInvalid = false;
        this.apiService.postInvitedEmailVerify({ token }).subscribe({
            next: response => {
                this.invitationLoading = false;
                const invitation: any = response?.data || response || {};
                if (!response?.success || !invitation?.sponsor_code) {
                    this.invitationInvalid = true;
                    return;
                }

                this.sponsorFromInvitation = true;
                this.sponsorName = invitation.sponsor_name || '';
                this.sponsorValidated = true;
                this.validatedSponsorCode = invitation.sponsor_code;
                this.frmRegister.patchValue(
                    { sponsor_code: invitation.sponsor_code },
                    { emitEvent: false }
                );
            },
            error: () => {
                this.invitationLoading = false;
                this.invitationInvalid = true;
            }
        });
    }

    public get isSponsorSubmissionBlocked(): boolean {
        const formSponsorCode = String(this.frmRegister?.get('sponsor_code')?.value || '').trim();
        return !this.sponsorValidated ||
            !this.validatedSponsorCode ||
            this.validatedSponsorCode !== formSponsorCode;
    }

    public goTo(section: string): void {
        let path = '/home';
        this.router.navigate([path], { fragment: section });
    }
}
