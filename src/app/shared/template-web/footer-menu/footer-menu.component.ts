import { Component, OnInit } from '@angular/core';
import { IdentityService } from '@shared/services/identity.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer-menu',
  templateUrl: './footer-menu.component.html',
  styleUrls: ['./footer-menu.component.scss']
})
export class FooterMenuComponent implements OnInit {

  private userActiveSubscription: Subscription | undefined;
  footerActive: boolean = false;
  constructor(
    private identityService: IdentityService
  ) {

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.userActiveSubscription?.unsubscribe();
    this.footerActive = false;
  }
}
