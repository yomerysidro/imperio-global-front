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

  patrocinio: number = 0;
  residual: number = 0;
  residualProducto: number = 0;
  residualServicio: number = 0;
  infinito: number = 0;
  total: number = 0;
  selectedPeriod: string = '';
  loadingSummary: boolean = false;

  oneMonthAgo: Date;
  isGeneratingCurrentMonthExcel: boolean = false;
  currentMonthReportLabel: string;
  isDownloading: boolean = false;
  downloadMessage: string = '';
  showPatrocinioValues: boolean = true;
  showResidualValues: boolean = true;

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
    this.refreshCurrentPeriod();
    this.loadCommissionSummary();
  }

  private refreshCurrentPeriod(): void {
    this.currentDate = new Date();
    this.selectedPeriod = `${this.currentDate.getFullYear()}-${String(this.currentDate.getMonth() + 1).padStart(2, '0')}`;
    this.updatePeriodLabel();
  }

  public onPeriodChange(event: Event): void {
    this.selectedPeriod = (event.target as HTMLInputElement).value;
    if (!this.selectedPeriod) return;
    const { month, year } = this.getSelectedPeriod();
    this.currentDate = new Date(year, month - 1, 1);
    this.updatePeriodLabel();
    this.loadCommissionSummary();
  }

  public loadCommissionSummary(): void {
    const { month, year } = this.getSelectedPeriod();
    this.loadingSummary = true;
    this.apiService.getCommissionSummary(month, year)
      .pipe(finalize(() => this.loadingSummary = false))
      .subscribe({
        next: response => {
          const data = response?.data || {};
          this.patrocinio = Number(data.patrocinio ?? 0);
          this.residual = Number(data.residual ?? 0);
          this.residualProducto = Number(data.residualProducto ?? 0);
          this.residualServicio = Number(data.residualServicio ?? 0);
          this.infinito = Number(data.infinito ?? 0);
          this.total = Number(data.bono_total ?? 0);
        },
        error: error => this.showDownloadError(error, 'No se pudo cargar el resumen de comisiones.')
      });
  }

  public onDownloadFinance(): void{
    if (this.isDownloading) return;
    this.startDownload('Generando y descargando el reporte PDF...');
    const { month, year } = this.getSelectedPeriod();
    this.apiService.postUserPdfFinance({ month, year })
      .pipe(finalize(() => this.finishDownload()))
      .subscribe({
        next: response => this.downloadBase64File(response, 'application/pdf', 'reporte-finanzas.pdf'),
        error: error => this.showDownloadError(error, 'No se pudo generar el reporte PDF.')
      });
  }

  public onDownloadFinanceExcel(): void{
    if (this.isDownloading) return;
    const { month, year } = this.getSelectedPeriod();
    this.startDownload('Generando y descargando el Excel del periodo seleccionado...');
    this.apiService.postCurrentMonthExcelFinance(month, year)
      .pipe(finalize(() => this.finishDownload()))
      .subscribe({
        next: response => this.downloadExcelResponse(response),
        error: error => this.showDownloadError(error, 'No se pudo descargar el Excel histórico.')
      });
  }

  public onDownloadCurrentMonthFinanceExcel(): void {
    if (this.isDownloading) return;

    const { month, year } = this.getSelectedPeriod();
    this.isGeneratingCurrentMonthExcel = true;
    this.startDownload('Generando reporte del mes actual...');

    this.apiService.postCurrentMonthExcelFinance(month, year)
      .pipe(finalize(() => {
        this.isGeneratingCurrentMonthExcel = false;
        this.finishDownload();
      }))
      .subscribe({
        next: (response) => this.downloadExcelResponse(response),
        error: (error) => {
          this.showDownloadError(error, 'No se pudo generar el reporte del mes actual.');
        }
      });
  }

  private downloadExcelResponse(response: any): void {
    this.downloadBase64File(
      response,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `reporte-finanzas-${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}.xlsx`
    );
  }

  private getSelectedPeriod(): { month: number; year: number } {
    const [year, month] = this.selectedPeriod.split('-').map(Number);
    return { month, year };
  }

  private updatePeriodLabel(): void {
    const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(this.currentDate);
    this.currentMonthReportLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${this.currentDate.getFullYear()}`;
  }

  private downloadBase64File(response: any, defaultMime: string, defaultFilename: string): void {
    const base64 = response?.data?.base64;
    if (!base64) {
      this.messageService.error(response?.message || 'El backend no devolvió el archivo solicitado.');
      return;
    }

    const byteCharacters = atob(base64);
    const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
    const blob = new Blob([new Uint8Array(byteNumbers)], {
      type: response.data.mime || defaultMime
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = response.data.filename || defaultFilename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  private startDownload(message: string): void {
    this.downloadMessage = message;
    this.isDownloading = true;
  }

  private finishDownload(): void {
    this.isDownloading = false;
    this.downloadMessage = '';
  }

  private showDownloadError(error: any, fallback: string): void {
    const message = error?.message || error?.error?.message ||
      (typeof error === 'string' ? error : null) || fallback;
    this.messageService.error(message);
  }
}
