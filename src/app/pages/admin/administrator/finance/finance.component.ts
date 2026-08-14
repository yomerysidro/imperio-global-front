import { Component, OnInit } from '@angular/core';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss']
})
export class FinanceComponent implements OnInit {

  currentDate: Date = new Date();

  patrocinioUserActive: number = 0;
  patrocinioUserInactive: number = 0;

  residualUserActive: number = 0;
  residualUserInactive: number = 0;

  infinitoUser: number = 0;
  totalPoint: number = 0;

  oneMonthAgo: Date;
  isGeneratingCurrentMonthExcel: boolean = false;
  currentMonthReportLabel: string;

  constructor(
    private apiService: ApiService,
    private messageService: NzMessageService,
  ) {
    this.oneMonthAgo = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      this.currentDate.getDate()
    );

    const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(this.currentDate);
    this.currentMonthReportLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${this.currentDate.getFullYear()}`;
  }

  ngOnInit(): void {
    this.loadOption();
  }

  public loadOption(): void{
    this.apiService.getPointList().subscribe(
      (res) => {
        const pointsData = res.data;
        

        const patrocinioPoint = pointsData.filter( f => f.type == "P" );
        const residualPoint = pointsData.filter( f => f.type == "R" );

        patrocinioPoint.forEach( (point) => {
          let activeUser = point?.user_point?.payment_active != null ? true : false;
          if(activeUser){
            this.patrocinioUserActive = this.patrocinioUserActive + point.point;
          }else{
            this.patrocinioUserInactive = this.patrocinioUserInactive + point.point;
          }
        })

        residualPoint.forEach( (point) => {
          let activeUser = point?.user_point?.payment_active != null ? true : false;
          if(activeUser){
            this.residualUserActive = this.residualUserActive + point.point;
          }else{
            this.residualUserInactive = this.residualUserInactive + point.point;
          }
        })

        pointsData.forEach( (point) => {
          this.totalPoint = this.totalPoint + point.point;
        })

      }
    )
  }

  public onDownloadFinance(): void{
    this.apiService.postUserPdfFinance({}).subscribe(
      (response) => {

        const base64 = response.data.base64;
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = response.data.filename || 'archivo.pdf';
        link.click();
      }
    )
  }

  public onDownloadFinanceExcel(): void{
    this.apiService.postUserExcelFinance({}).subscribe(
      (response) => {
        console.log(response)

        const base64 = response.data.base64;
        const byteCharacters = atob(base64);
        const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: response.data.mime
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = response.data.filename;
        link.click();
      }
    )
  }

  public onDownloadCurrentMonthFinanceExcel(): void {
    if (this.isGeneratingCurrentMonthExcel) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    this.isGeneratingCurrentMonthExcel = true;

    this.apiService.postCurrentMonthExcelFinance(month, year)
      .pipe(finalize(() => this.isGeneratingCurrentMonthExcel = false))
      .subscribe({
        next: (response) => this.downloadExcelResponse(response),
        error: (error) => {
          const backendMessage =
            error?.message ||
            error?.error?.message ||
            (typeof error === 'string' ? error : null) ||
            'No se pudo generar el reporte del mes actual.';
          this.messageService.error(backendMessage);
        }
      });
  }

  private downloadExcelResponse(response: any): void {
    const base64 = response?.data?.base64;
    if (!base64) {
      this.messageService.error(response?.message || 'El backend no devolvió el archivo solicitado.');
      return;
    }

    const byteCharacters = atob(base64);
    const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: response.data.mime || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = response.data.filename || `reporte-finanzas-${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}.xlsx`;
    link.click();
    URL.revokeObjectURL(objectUrl);
  }
}
