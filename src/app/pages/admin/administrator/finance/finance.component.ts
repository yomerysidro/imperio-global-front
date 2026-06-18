import { Component, OnInit } from '@angular/core';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';

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

  constructor(
    private apiService: ApiService,
  ) {
    this.oneMonthAgo = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      this.currentDate.getDate()
    );
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
}
