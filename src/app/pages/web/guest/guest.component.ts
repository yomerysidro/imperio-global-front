import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '@shared/services/api.service';
import { isAuth } from '@shared/utilities/functions';

@Component({
  selector: 'app-guest',
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.scss']
})
export class GuestComponent implements OnInit {

  codeToken: string;
  loading: boolean = true;
  status: string = 'warning';
  title: string = 'warning';

  constructor(
    private _route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
  ) {
    this.codeToken = this._route.snapshot.paramMap.get('code');
  }

  ngOnInit(): void {
    console.log(this.codeToken);
    this.verifyData();
  }

  public verifyData(): void{
    this.loading = true;
    this.apiService.postInvitedEmailVerify({token: this.codeToken}).subscribe(
      (res) => {
        this.loading = false;
        this.title = res.message;
        if( res.success ){
          localStorage.setItem("guest", this.codeToken);
          if( !isAuth() ){
            this.status = 'warning';
            this.title = "Inicia sesion para activar la invitación.";
          }else{
            this.status = 'success';
            this.confirmData();
          }
        }else{
          this.status = 'error';
        }
        console.log(res)
      }, (error) => {
        this.loading = false;
        this.status = 'error';
        this.title = "Hubo un error con el codigo de invitación.";
      }
    );
  }

  public confirmData(): void{
    this.apiService.postInvitedEmailConfirm({}).subscribe(
      (res) => {
        this.loading = false;
        localStorage.removeItem("guest");
        console.log(res)
        if( res.success ){
          this.router.navigate(['/auth/profile']);
        }
      }, (error) => {
        this.loading = false;
        this.status = 'error';
        this.title = "Hubo un error con el codigo de invitación.";
      }
    )
  }
}
