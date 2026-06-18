import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { ModalService } from '@shared/utilities/modal-services';
import AOS from 'aos';
import { NzModalService } from 'ng-zorro-antd/modal';
// ❌ ELIMINAR: import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  windowWidth: number = 0;

  // ❌ ELIMINAR customOptions
  // customOptions: OwlOptions = {
  //   loop: true,
  //   mouseDrag: true,
  //   touchDrag: true,
  //   pullDrag: false,
  //   dots: false,
  //   navSpeed: 700,
  //   navText: ['', ''],
  //   responsive: {
  //     0: { items: 1 },
  //     400: { items: 2 },
  //     900: { items: 3 }
  //   },
  //   nav: true
  // }

  env = environment;

  planList: Array<PackModel> = [];

  constructor(
    private nzModalService: NzModalService,
    private apiService: ApiService,
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;

    AOS.init({disable: 'mobile'});//AOS - 2
    AOS.refresh();

    this.loadOptions();
    this.loadPlans();
  }


  ngOnChanges(): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
    this.windowWidth = window.innerWidth;
  }

  public loadOptions(): void{

  }

  public loadPlans(): void{
    this.apiService.getPlansSearch({}).subscribe(
      (response) =>{
        this.planList = response.data;
      },
      (error) =>{

      }
    )
  }

}