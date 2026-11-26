import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
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

    this.linkInited = new URL('guest/' + encodeURIComponent(this.codeInvited), document.baseURI).href;
    this.avatarUrl = this.userModel?.file?.path
      ? environment.hostUrl + '/storage/' + this.userModel.file.path
      : CONSTANTS.IMAGE.FALLBACK;
    if (this.userModel?.is_admin) this.loadData();
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

  loadData(): void {
    this.apiService.getUsersSearch({}).subscribe({
      next: ({ data }) => this.listUsers = data.filter(user => user.payment == null),
      error: () => this.messageService.error('No se pudo cargar la lista de destinatarios.'),
    });
  }

  onSendEmail(): void {
    if (this.loading || !this.multipleUsers.length) return;

    this.loading = true;
    const users = this.multipleUsers.map(code => ({ code }));
    this.apiService.postInvitedEmail({ users }).pipe(
      finalize(() => this.loading = false),
    ).subscribe({
      next: () => {
        this.messageService.success('Invitaciones enviadas.');
        this.modalRef.close();
      },
      error: () => this.messageService.error('No se pudieron enviar todas las invitaciones.'),
    });
  }
}
