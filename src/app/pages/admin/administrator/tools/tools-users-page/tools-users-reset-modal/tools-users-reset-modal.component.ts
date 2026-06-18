import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-tools-users-reset-modal',
  templateUrl: './tools-users-reset-modal.component.html',
  styleUrls: ['./tools-users-reset-modal.component.scss']
})
export class ToolsUsersResetModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Output() back: EventEmitter<number> = new EventEmitter<number>();

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  loadingSave: boolean = false;

  constructor(
    private apiService: ApiService,
    private modalRef: NzModalService,
    private modalMessage: ModalService
  ) { }

  ngOnInit(): void {
    this.avatarUrl = this.userModel.file?.path ? environment.hostUrl + '/storage/' + this.userModel.file?.path : CONSTANTS.IMAGE.FALLBACK;
  }

  public onBack(): void{
    this.back.emit( (new Date()).getTime() )
  }


  public onSave(): void{
    this.modalMessage.confirm(
      "¿Esta seguro de resetear etse usuario?",
      () => {
        this.loadingSave = true;
        this.apiService.postUsercodeResetPoint({userCode : this.userModel?.uuid }).subscribe(
          (response) => {
            if( response.success ){

            }
            this.loadingSave = false;
            this.modalRef.closeAll();
          },(error) =>{
            this.loadingSave = false;
            this.modalRef.closeAll();
          }
        )
      }
    )

  }

}
