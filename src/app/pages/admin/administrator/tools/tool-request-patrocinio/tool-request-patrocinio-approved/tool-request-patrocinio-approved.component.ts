import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NZ_MODAL_DATA, NzModalService } from 'ng-zorro-antd/modal';
import { NzUploadFile } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-tool-request-patrocinio-approved',
  templateUrl: './tool-request-patrocinio-approved.component.html',
  styleUrls: ['./tool-request-patrocinio-approved.component.scss']
})
export class ToolRequestPatrocinioApprovedComponent implements OnInit {

  @Input() userModel: UserModel;
  @Input() points: number;
  @Input() userId: number;
  
    // @Output() back: EventEmitter<number> = new EventEmitter<number>();
  
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;

  loadingSave: boolean = false;
  loading: boolean = false;
  fileList: NzUploadFile[] = [];
  disabledUpload: boolean = true;
  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) private modalData: any,
    private apiService: ApiService,
    private modalRef: NzModalService,
    private modalMessage: ModalService
  ) {
    if (this.modalData) {
      Object.assign(this, this.modalData);
    }
  }

  ngOnInit(): void {
    this.avatarUrl = this.userModel.file?.path ? environment.hostUrl + '/storage/' + this.userModel.file?.path : CONSTANTS.IMAGE.FALLBACK;
  }

  public onCancel(): void{
    this.modalRef.closeAll();
  }

  public onApproved(approved: number): void{
    
    this.modalMessage.confirm("¿Confirmas "+(approved == 2 ? "Pago" : "Anulación")+" de Bono patrocinio?" ,
      () => {
        this.loading = true;

        let formData = new FormData();
        formData.append("approve", approved.toString());
        formData.append("userId", this.userId.toString());
        
        this.fileList.forEach((file: any) => {
          formData.append('file', file);
        });
        this.apiService.postRequestPatrocinioApproved(formData).subscribe(
          (response) =>{
            if( response.success ){
              this.modalRef.closeAll();
            }else{
              this.modalMessage.warning(response.message ?? "")
            }
            this.loading = false;
          }, (error) =>{
            this.modalRef.closeAll();
            this.modalMessage.error(error.message ?? "")
            this.loading = false;
          }
        )
      }
    )
    
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    this.fileList = [file];
    this.disabledUpload = false;
    return false;
  };

  onRemoveFile = (file: NzUploadFile): boolean => {
    
    this.fileList = [];
    this.disabledUpload = true;
    return false;
  };

}
