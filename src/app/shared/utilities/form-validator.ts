import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CONSTANTS } from "@shared/constants/constants";
import { MESSAGES } from '@shared/constants/messages';

@Injectable({
    providedIn: 'root'
})
export class FormValidator {
    constructor(
        private readonly messageService: NzMessageService
    ) { }

    validateRUC = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.RUC_LENGTH)
            return { error: true, validateRUC: true };

        if (control.value.toString().slice(0, 2) != "10" && control.value.toString().slice(0, 2) != "20")
            return { error: true, validateRUC: true };

        return {};
    }

    validateDNI = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.DNI_LENGTH)
            return { error: true, validateDNI: true };

        return {};
    }

    optionalValidateDNI = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        if (control.value.toString().length !== 8)
            return { error: true, optionalValidateDNI: true };

        return {};
    }

    optionalValidateEmail = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        var regexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

        if (!regexp.test(control.value))
            return { error: true, optionalValidateEmail: true };

        return {};
    }

    espacionBlanco(control: FormControl) {
        const isWhitespace = (String(control.value) || '').trim().length === 0;
        const isValid = !isWhitespace;
        return isValid ? null : { 'whitespace': true };
    }

    validateUsername = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        if (control.value.toString().length < 6 || control.value.toString().length > 25)
            return { error: true, validateUsername: true };

        return {};
    }

    validatePassport = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.PASSPORT_LENGTH)
            return { error: true, validatePassport: true };

        return {};
    }

    validateBirthCertificate = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.BIRTH_CERTIFICATE_LENGTH)
            return { error: true, validateBirthCertificate: true };

        return {};
    }

    validateForeingCard = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.FOREIGN_CARD_LENGTH)
            return { error: true, validateForeingCard: true };

        return {};
    }

    validateOther = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        if (control.value.toString().length !== CONSTANTS.VALIDATION_OPTIONS.OTHER_LENGTH)
            return { error: true, validateOther: true };

        return {};
    }

    validateNames = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        if (control.value.toString().length > CONSTANTS.VALIDATION_OPTIONS.NAMES_LENGTH)
            return { error: true, validateNames: true };

        return {};
    }

    validateExchangeRateAmount = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        var regexp = new RegExp(/^\d*\.?\d*$/);

        if (!regexp.test(control.value))
            return { error: true, validateExchangeRateAmount: true };

        return {};
    }

    validateAmount = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return { error: true, required: true };

        var regexp = new RegExp(/^\d+(\.\d*)?|\.\d+/);

        if (!regexp.test(control.value))
            return { error: true, validateAmount: true };

        if (Number(control.value) === 0)
            return { error: true, validateAmount: true };

        return {};
    }

    optionalValidateAmount = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        var regexp = new RegExp(/^\d+(\.\d*)?|\.\d+/);

        if (!regexp.test(control.value))
            return { error: true, optionalValidateAmount: true };

        return {};
    }

    validateNumber = (control: FormControl): { [s: string]: boolean } => {
        if (control.value === null || control.value === "")
            return {};

        if (isNaN(control.value))
            return { error: true, validateNumber: true };

        return {};
    }

    validForm = (form: FormGroup): boolean => {
        var errors = [];
          for (const i in form.controls) {
            form.controls[i].markAsDirty();
            form.controls[i].updateValueAndValidity();
            var status = form.controls[i].status;
            if (status === 'INVALID') {
              errors.push(status);
            }
          }

          if(errors.length > 0){
            this.messageService.warning(MESSAGES.COMPLETE_FORM);
            return false;
          }
          return true;
    }

    confirmationPassword = (controlName: string, matchingControlName: string): any => {
        return (formGroup: FormGroup) => {
            let control = formGroup.controls[controlName];
            let matchingControl = formGroup.controls[matchingControlName]
            if (
              matchingControl.errors &&
              !matchingControl.errors.confirmPasswordValidator
            ) {
              return;
            }
            if (control.value !== matchingControl.value) {
              matchingControl.setErrors({ confirmPasswordValidator: true });
            } else {
              matchingControl.setErrors(null);
            }
        };
    };
}
