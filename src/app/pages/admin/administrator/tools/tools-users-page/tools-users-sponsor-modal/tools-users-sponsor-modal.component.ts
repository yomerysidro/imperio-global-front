import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { UserModel } from '@shared/services/models/user.interface';
import { FormValidator } from '@shared/utilities/form-validator';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-tools-users-sponsor-modal',
  templateUrl: './tools-users-sponsor-modal.component.html',
  styleUrls: ['./tools-users-sponsor-modal.component.scss']
})
export class ToolsUsersSponsorModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Output() back: EventEmitter<number> = new EventEmitter<number>();

  validateForm: FormGroup;
  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;
  avatarUrlSponsor: string = CONSTANTS.IMAGE.FALLBACK;
  avatarUrlNewSponsor: string = CONSTANTS.IMAGE.FALLBACK;
  loadingSave: boolean = false;

  newSponsor: UserModel;

  isSponsorNew: boolean = false;
  loadingSearch: boolean = false;
  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private modalMessage: ModalService,
    private modalRef: NzModalService,
    private formValidator: FormValidator

  ) {
    this.validateForm = this.fb.group({
      sponsor: [ {value: null, disabled: true} , []],
      sponsorNew : [ null , [ Validators.required ]],
      sponsorEmailNew: [ null , [ Validators.required , Validators.email ]],
    })
  }

  ngOnInit(): void {

    this.avatarUrl = this.userModel.file?.path ? environment.hostUrl + '/storage/' + this.userModel.file?.path : CONSTANTS.IMAGE.FALLBACK;
    this.validateForm.get('sponsor').setValue( this.userModel?.payment?.payment_order?.sponsor_code );

    this.avatarUrlSponsor = this.userModel.payment?.payment_order?.sponsor?.file?.path ? environment.hostUrl + '/storage/' + this.userModel.payment?.payment_order?.sponsor?.file?.path : CONSTANTS.IMAGE.FALLBACK;
  }

  public onSearchSponsor(): void{
    this.loadingSearch = true;
    this.isSponsorNew = false;
    this.apiService.getUsersSearch({code: this.validateForm.get('sponsorNew').value ?? ""}).subscribe(
      (response) => {
        this.loadingSearch = false;
        this.newSponsor = null;
        if( response.success ){
          if( response.data.length > 0 ){
            this.isSponsorNew = true;
            this.newSponsor = response.data[0];
            this.avatarUrlNewSponsor = response.data[0]?.file?.path ? environment.hostUrl + '/storage/' + response.data[0]?.file?.path : CONSTANTS.IMAGE.FALLBACK;
          }
        }

      },
      (error) => {
        this.loadingSearch = false;
      }
    )
  }

  public onBack(): void{
    this.back.emit( (new Date()).getTime() )
  }

  public onSave(): void{
    if( !this.formValidator.validForm( this.validateForm ) ) return;

    if( this.newSponsor.email != this.validateForm.get('sponsorEmailNew').value )
    {
      this.modalMessage.info("Este correo no le corresponde al nuevo patrocinador.");
      return;
    }

    this.modalMessage.confirm(
      "¿Esta seguro de cambiar este nuevo patrocinador?",
      () => {
        this.loadingSave = true;
        this.apiService.postUsercodeChangeSponsor({userCode : this.userModel?.uuid , sponsorCode: this.validateForm.get('sponsorNew').value }).subscribe(
          (response) => {
            if( response.success ){

            }
            this.loadingSave = false;
            this.modalRef.closeAll();
          },(error) =>{
            this.modalRef.closeAll();
            this.loadingSave = false;
          }
        )
      }
    )

  }

}


