import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { recoveryError } from '@shared/services/password-recovery-error';

@Component({
  selector: 'app-validate-confirmation',
  templateUrl: './validate-confirmation.component.html',
  styleUrls: ['./validate-confirmation.component.scss']
})
export class ValidateConfirmationComponent implements OnInit, OnDestroy {
  frmValidateCode: FormGroup;
  passwordForm: FormGroup;
  digits = [1, 2, 3, 4];
  step: 'code' | 'password' | 'success' | 'expired' = 'code';
  loadingSubmit = false;
  textError = '';
  showPassword = false;
  showConfirmation = false;
  private validation = '';
  private recoveryToken = '';
  private expiresAt = 0;
  private expiryTimer: ReturnType<typeof setTimeout>;
  private redirectTimer: ReturnType<typeof setTimeout>;
  private destroyed = new Subject<void>();

  constructor(private fb: FormBuilder, private api: ApiService,
    private route: ActivatedRoute, private router: Router) {
    this.frmValidateCode = this.fb.group({
      code1: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      code2: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      code3: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]],
      code4: ['', [Validators.required, Validators.pattern(/^[0-9]$/)]]
    });
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: group => group.get('password').value === group.get('password_confirmation').value
      ? null : { mismatch: true } });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroyed)).subscribe(params => {
      this.clearSensitive();
      this.validation = params.get('code') || '';
      this.step = 'code';
      this.textError = '';
    });
  }

  onSubmit(): void {
    if (this.loadingSubmit || this.step !== 'code') return;
    this.frmValidateCode.markAllAsTouched();
    if (this.frmValidateCode.invalid) return;
    this.loadingSubmit = true;
    this.textError = '';
    const code = this.digits.map(i => this.frmValidateCode.get('code' + i).value).join('');
    this.api.postValidateCode({ code }, this.validation).pipe(
      takeUntil(this.destroyed), finalize(() => this.loadingSubmit = false)
    ).subscribe(res => {
      if (!res.success) { this.textError = res.message; return; }
      const data = res.data;
      if (data?.validation !== this.validation || !/^[a-f0-9]{64}$/.test(data?.recovery_token || '') ||
          !Number.isFinite(data?.expires_in) || data.expires_in <= 0) {
        this.expire('No se recibió una autorización válida. Solicita un nuevo código.');
        return;
      }
      this.recoveryToken = data.recovery_token;
      this.expiresAt = Date.now() + Math.min(data.expires_in, 300) * 1000;
      this.frmValidateCode.reset();
      this.step = 'password';
      this.expiryTimer = setTimeout(() => this.expire(), Math.min(data.expires_in, 300) * 1000);
    }, error => this.textError = recoveryError(error));
  }

  savePassword(): void {
    if (this.loadingSubmit || this.step !== 'password') return;
    if (!this.recoveryToken || Date.now() >= this.expiresAt) { this.expire(); return; }
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) return;
    this.textError = '';
    this.loadingSubmit = true;
    this.api.postResetPassword({
      validation: this.validation, recovery_token: this.recoveryToken,
      password: this.passwordForm.get('password').value,
      password_confirmation: this.passwordForm.get('password_confirmation').value
    }).pipe(takeUntil(this.destroyed), finalize(() => this.loadingSubmit = false))
      .subscribe(res => {
        if (!res.success) { this.textError = res.message; return; }
        this.clearSensitive();
        this.validation = '';
        this.textError = '';
        this.step = 'success';
        this.redirectTimer = setTimeout(() => this.router.navigate(['/auth/login'], { replaceUrl: true }), 2500);
      }, error => {
        const message = recoveryError(error);
        const fields = error.error?.data;
        const passwordErrors = fields?.password || fields?.password_confirmation;
        if (error.status === 422 && !passwordErrors) this.expire(message + ' Solicita un nuevo código.');
        else this.textError = message;
      });
  }

  onDigit(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, '').slice(-1);
    this.frmValidateCode.get('code' + index).setValue(value);
    if (value) document.getElementById('code' + (index + 1))?.focus();
  }

  private expire(message = 'La autorización ha vencido. Solicita un nuevo código para continuar.'): void {
    this.clearSensitive();
    this.step = 'expired';
    this.textError = message;
  }

  private clearSensitive(): void {
    clearTimeout(this.expiryTimer);
    this.recoveryToken = '';
    this.expiresAt = 0;
    this.passwordForm.reset();
    this.frmValidateCode.reset();
    this.showPassword = this.showConfirmation = false;
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
    clearTimeout(this.redirectTimer);
    this.clearSensitive();
    this.validation = '';
  }
}
