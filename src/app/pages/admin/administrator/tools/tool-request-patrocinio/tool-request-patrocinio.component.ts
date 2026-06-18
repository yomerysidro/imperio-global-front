import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { forkJoin } from 'rxjs';
import { ToolRequestPatrocinioApprovedComponent } from './tool-request-patrocinio-approved/tool-request-patrocinio-approved.component';
import { DownloadFile } from '@shared/utilities/download-file';

@Component({
  selector: 'app-tool-request-patrocinio',
  templateUrl: './tool-request-patrocinio.component.html',
  styleUrls: ['./tool-request-patrocinio.component.scss']
})
export class ToolRequestPatrocinioComponent implements OnInit {

  pageIndex: number = CONSTANTS.PAGINATION.PAGE_INDEX;
  pageSize: number = CONSTANTS.PAGINATION.PAGE_SIZE;
  sortProperty: string = '';
  sortPropertyName: string = '';
  totalRecord: number = 0;

  tableProductLoading: boolean = false;
  tableProducts: Array<any> = [];

  CONSTANTS = CONSTANTS;
  environment = environment;
  codeUser: string = "";
  nameUser: string = "";
  initLoad: boolean = true;

  _listPoints: Array<any> = [];


  planSelected: any = null;

  planList: Array<any> = [];
  loadingDesactive: boolean = false;
  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private nzModalService: NzModalService,
    private fb : FormBuilder,
    private downloadFile: DownloadFile
  ) {

  }

  ngOnInit(): void {

    this.onSearch();
  }

  public onSearch(): void{
    this.tableProductLoading = true;
    this.apiService.getRequestPatrocinioFindAll({code: this.codeUser.trim(), name: this.nameUser.trim() , limit: this.pageSize , page: this.pageIndex }).subscribe(
      (response) =>{
        if( response.success ){
          console.log(response.data.items);
          this.totalRecord = response.data.pagination.total;
          this.tableProducts = response.data.items;
        }
        this.tableProductLoading = false;

      }, (error) =>{
        this.modalService.error(error.message ?? "")
        this.tableProductLoading = false;
      }
    )
  }

  public loadData(): void{
    this.tableProductLoading = true;
    forkJoin(
      this.apiService.getPointList({}),
      this.apiService.getUsersFindAll({code: this.codeUser.trim(), name: this.nameUser.trim() , plan: this.planSelected ?? "" , limit: this.pageSize , page: this.pageIndex }),
      this.apiService.getPlansSearch({}),
    ).subscribe(
      ([listPoints, usersList, planList])=>{
        this._listPoints = listPoints.data;

        if( usersList.success ){
          this.totalRecord = usersList.data.pagination.total;
          this.tableProducts = usersList.data.items;
        }
        this.tableProductLoading = false;

        this.planList = planList.data

        this.initLoad = false;
      }
    )
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    let sortOrder;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    if (sort[0]?.value !== null) {
      if (sort[0]?.value == 'ascend') sortOrder = 'ASC';
      if (sort[0]?.value == 'descend') sortOrder = 'DESC';

      if (sort[0]?.key === 'name') this.sortProperty = 'name ' + sortOrder;

    }

    console.log( pageSize, pageIndex, sort, filter )

    if( !this.initLoad ) this.onSearch();
  }

  public onApproved(item: any): void{
    const modal = this.nzModalService.create({
      nzTitle: null,
      nzContent: ToolRequestPatrocinioApprovedComponent,
      nzFooter: null,
      nzMaskClosable: false,
      nzClosable: false,
      nzWidth: "450px",
      nzData: {
        userModel: item.user,
        points: item.points,
        userId: item.user_id
      }
    });

    modal.afterClose.subscribe( (respnse) => {
      console.log(respnse);
      this.onSearch();
    } )
  }

  public onDownload(fileId: number): void{
    this.apiService.getRequestPatrocinioDownload({file: fileId}).subscribe(
      (response) => {
        if( response.success ){
          this.downloadFile.DownloadDocumentBase64( response.data.filename , response.data.filedata , response.data.mimeType);
        }
      }
    )
  }

}
