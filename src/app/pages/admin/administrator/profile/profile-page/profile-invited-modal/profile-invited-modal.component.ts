import { Component, DestroyRef, Inject, Input, OnInit, Optional, inject } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile-invited-modal',
  templateUrl: './profile-invited-modal.component.html',
  styleUrls: ['./profile-invited-modal.component.scss']
})
export class ProfileInvitedModalComponent implements OnInit {
  @Input() userModel: UserModel;
  @Input() codeInvited: string;

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;
  fallback: string = CONSTANTS.IMAGE.FALLBACK;
  linkInited: string;

  multipleUsers: any[] = [];
  listUsers: any[] = [];

  loading: boolean = false;
  loadingUsers = false;
  private usersLoaded = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
    private apiService: ApiService,
    private modalRef: NzModalRef,
    private messageService: NzMessageService
  ) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }
  }

  ngOnInit(): void {

    this.linkInited = environment.serveUrl + "/guest/" + this.codeInvited;
    this.avatarUrl = this.userModel?.file?.path
      ? environment.hostUrl + '/storage/' + this.userModel.file.path
      : CONSTANTS.IMAGE.FALLBACK;
  }

  async copyMessage(val: string, type: 'link' | 'id' = 'link'): Promise<void> {
    if (!val) return;

    try {
      await navigator.clipboard.writeText(val);
    } catch {
      this.copyWithFallback(val);
    }

    this.messageService.success(
      type === 'link' ? 'Enlace copiado' : 'ID copiado',
      { nzDuration: 2500 }
    );
  }

  private copyWithFallback(val: string): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  loadUsers(open: boolean): void {
    if (!open || this.usersLoaded || this.loadingUsers) return;
    this.loadingUsers = true;
    this.apiService.getUsersSearch({}).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingUsers = false)
    ).subscribe({
      next: response => {
        if (!response?.success) return;
        this.listUsers = (response.data ?? []).filter(user => user.payment == null);
        this.usersLoaded = true;
      },
      error: () => this.messageService.error('No se pudo cargar la lista de usuarios.')
    });
  }

  onSendEmail(): void{
    this.loading = true;
    this.apiService.getUsersSearch({users: this.multipleUsers.map( u => { return {code: u} } )}).subscribe(
      (res) => {
        console.log(res);
        this.loading = false;
        this.modalRef.close();
      }
    )
  }
}
