import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { environment } from '@env/environment';
import { ImageCropperUploadComponent } from '@shared/components/image-cropper-upload/image-cropper-upload.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { saveSessionStoraheUser } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { filter, finalize, switchMap } from 'rxjs/operators';
import { ProfileInvitedModalComponent } from '../profile-invited-modal/profile-invited-modal.component';


@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.scss'],
})
export class MyProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly alerts = inject(ModalService);
  private readonly modals = inject(NzModalService);
  readonly form = inject(FormBuilder).group({
    address: [''],
    email: [{ value: '', disabled: true }],
    city: [''],
    phone: [''],
    country: [''],
    gender: [null as string | null],
  });

  user?: UserModel;
  avatarUrl = CONSTANTS.IMAGE.FALLBACK;
  loading = false;
  loadError = false;
  editing = false;
  saving = false;
  uploading = false;
  inviting = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.api.getAuthenticationUser().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false),
    ).subscribe({
      next: ({ data }) => {
        this.user = data;
        this.setAvatar(data.file?.path);
        this.resetForm(data);
      },
      error: () => this.loadError = true,
    });
  }

  startEditing(): void {
    this.editing = true;
  }

  cancelEditing(): void {
    if (!this.user || this.saving) return;

    this.resetForm(this.user);
    this.editing = false;
  }

  private resetForm(user: UserModel): void {
    this.form.reset({
      address: user.address,
      email: user.email,
      city: user.city,
      phone: user.phone,
      country: user.country || null,
      gender: user.gender || null,
    });
  }

  save(): void {
    const user = this.user;
    if (!user || !this.editing || this.saving || !this.form.dirty || this.form.invalid) return;

    const { address, city, phone, country, gender } = this.form.getRawValue();
    const changes = { address, city, phone, country, gender };
    this.saving = true;
    this.api.putAuthenticationUpdate(changes).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving = false),
    ).subscribe({
      next: () => {
        this.user = { ...user, ...changes };
        this.resetForm(this.user);
        this.editing = false;
        this.alerts.success('Cambios guardados correctamente.');
      },
      error: error => this.alerts.error(error?.errors ? error.message : 'No se pudieron guardar los cambios. Intenta nuevamente.'),
    });
  }

  changePhoto(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.user || this.uploading) return;

    this.uploading = true;
    this.modals.create({
      nzContent: ImageCropperUploadComponent,
      nzTitle: 'Recortar foto de perfil',
      nzMaskClosable: false,
      nzData: { file },
      nzFooter: null,
    }).afterClose.pipe(
      filter(result => Boolean(result?.file)),
      switchMap(result => {
        const formData = new FormData();
        formData.set('file', result.file);
        return this.api.postAuthenticationAvatar(formData);
      }),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploading = false),
    ).subscribe({
      next: ({ data }) => {
        const path = data.file?.path;
        this.setAvatar(path);
        saveSessionStoraheUser({ name: data.name, photo: path ?? '' });
        this.alerts.success('Foto actualizada correctamente.');
      },
      error: () => this.alerts.error('No se pudo actualizar la foto.'),
    });
  }

  invite(): void {
    const user = this.user;
    if (!user || this.inviting) return;

    this.inviting = true;
    this.api.postGenerateLinkInvited({}).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.inviting = false),
    ).subscribe({
      next: ({ data }) => this.modals.create({
        nzContent: ProfileInvitedModalComponent,
        nzTitle: 'Invitación',
        nzFooter: null,
        nzWidth: '620px',
        nzClassName: 'invitation-modal-window',
        nzData: { userModel: user, codeInvited: data.code },
      }),
      error: () => this.alerts.error('No se pudo generar la invitación.'),
    });
  }

  private setAvatar(path?: string): void {
    this.avatarUrl = path ? environment.hostUrl + '/storage/' + path : CONSTANTS.IMAGE.FALLBACK;
  }
}
