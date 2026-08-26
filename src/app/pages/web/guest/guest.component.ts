import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-guest',
  templateUrl: './guest.component.html',
  styleUrls: ['./guest.component.scss']
})
export class GuestComponent implements OnInit {

  codeToken: string;
  constructor(
    private _route: ActivatedRoute,
    private router: Router,
  ) {
    this.codeToken = this._route.snapshot.paramMap.get('code');
  }

  ngOnInit(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { invitation: this.codeToken },
      replaceUrl: true
    });
  }
}
