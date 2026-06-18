import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from '@env/environment';
import { CONSTANTS } from '@shared/constants/constants';
import { ServiceModel } from '@shared/services/models/service.interface';


@Component({
  selector: 'app-card-service',
  templateUrl: './card-service.component.html',
  styleUrls: ['./card-service.component.scss']
})
export class CardServiceComponent implements OnInit {

  env = environment;
  @Input() service: ServiceModel;
  @Input() typeHair: number;
  @Output() selectService: EventEmitter<any> = new EventEmitter();

  fallback = CONSTANTS.IMAGE.FALLBACK;

  serviceActive: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  public onActive(): void{
      this.serviceActive = !this.serviceActive;
      this.selectService.emit({
        active : this.serviceActive,
        service : this.service
      });
  }

}
