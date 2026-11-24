import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { Subscription } from 'rxjs';
import { ToolRequestPatrocinioApprovedComponent } from './tool-request-patrocinio-approved/tool-request-patrocinio-approved.component';
import { DownloadFile } from '@shared/utilities/download-file';

@Component({
  selector: 'app-tool-request-patrocinio',
  templateUrl: './tool-request-patrocinio.component.html',
  styleUrls: ['./tool-request-patrocinio.component.scss']
})
export class ToolRequestPatrocinioComponent implements OnInit, OnDestroy {

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
  private searchRequest?: Subscription;
  filterMonth: number | null = null;
  filterYear: number | null = null;
  months = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date(2026, index, 1)) }));
  years = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

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

  ngOnDestroy(): void {
    this.searchRequest?.unsubscribe();
  }

  public onFilterSearch(): void {
    this.pageIndex = 1;
    this.onSearch();
  }

  public onSearch(): void{
    this.searchRequest?.unsubscribe();
    this.tableProductLoading = true;
    const filters: any = { code: this.codeUser.trim(), name: this.nameUser.trim(), limit: this.pageSize, page: this.pageIndex };
    if (this.filterMonth) filters.month = this.filterMonth;
    if (this.filterYear) filters.year = this.filterYear;
    this.searchRequest = this.apiService.getRequestPatrocinioFindAll(filters).subscribe(
      (response) =>{
        if( response.success ){
          this.totalRecord = response.data?.pagination?.total ?? response.data?.length ?? 0;
          this.tableProducts = response.data?.items ?? response.data ?? [];
        }
        this.tableProductLoading = false;

      }, (error) =>{
        this.modalService.error(error.message ?? "")
        this.tableProductLoading = false;
      }
    )
  }

  onQueryParamsChange({ pageSize, pageIndex }: NzTableQueryParams): void {
    if (this.pageSize === pageSize && this.pageIndex === pageIndex) return;
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.onSearch();
  }

  public onApproved(item: any): void{
    const modal = this.nzModalService.create({
      nzTitle: null,
      nzContent: ToolRequestPatrocinioApprovedComponent,
      nzFooter: null,
      nzMaskClosable: false,
      nzClosable: false,
      nzWidth: "760px",
      nzClassName: "payment-request-modal",
      nzData: {
        userModel: item.user,
        amount: item.amount,
        requestId: item.id,
        request: item
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
