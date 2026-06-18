import { Component, OnInit } from '@angular/core';

import { CONSTANTS } from '@shared/constants/constants';
import { ServiceModel } from '@shared/services/models/service.interface';

import { isAuth } from '@shared/utilities/functions';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {

  serviceList: Array<ServiceModel> = [
    {
      name: 'Adelgazante Filtrante',
      description: 'Filtrante natural que ayuda a perder peso, fortalece el sistema inmune, desintoxica tu cuerpo y corrige tu presión arterial. Ideal para contrarrestar triglicéridos',
      type_service: {
        description: 'Nutrición'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3893.png'
      },
      price: 77
    },
    {
      name: 'Limpieza Potencial (LP)',
      description: 'Elimina el estreñimiento e Limpia y desinflama el colon, además ayuda a a eliminar el tránsito lento y depura toxinas. Mejora la absorción de nutrientes, rico sabor a tamarindo.',
      type_service: {
        description: 'Nutrición'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3892.png'
      },
      price: 170
    },
    {
      name: 'Agua Alcalina',
      description: 'Desintoxica el organismo, mejora la hidratación, equilibra el PH del cuerpo y ayuda a fortalecer el sistema digestivo. Reduce niveles de glucosa en la sangre.',
      type_service: {
        description: 'Nutrición'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3891.png'
      },
      price: 55
    },
    {
      name: 'Colágeno',
      description: 'Ayuda a retrasar el proceso de envejecimiento, colabora con la fijación de calcio en los huesos. Ayuda a combatir flacidez en el cuerpo y previene enfermedades como artritis.',
      type_service: {
        description: 'Belleza'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3890.png'
      },
      price: 170
    },
    {
      name: 'Acciona Carajo',
      description: 'Libro de enseñanza en Marketing Multinivel y liderazgo para el desarrollo. En esta edición el autor explica como superar miedos y superar obstáculos para ser un emprendedor exitoso. Autor Pascual Seminario',
      type_service: {
        description: 'Libro de educación/Liderazgo'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 462.png'
      },
      price: 70
    },
    {
      name: 'Capuccino Star',
      description: 'Promete la regeneración de células hepáticas, estimula el sistema inmunológico, brinda energía y rejuvenece. Relaja el sistema nervioso.',
      type_service: {
        description: 'Nutrición'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3894.png'
      },
      price: 170
    },
    {
      name: 'Sacha Jergon',
      description: 'Fortalece el sistema inmunológico, antinflamatorio, Tuberculosis, Hígado hepatitis, úlceras, Cervicitis.',
      type_service: {
        description: 'Nutrición'
      },
      file: {
        path: 'assets/images/imagenes_imperio/Rectangle 3895.png'
      },
      price: 170
    }


  ];
  isLoading: boolean = false;

  chkHairSize: boolean = true;
  sltHairSize: any = 1;
  hairSizeList: Array<any> = [];
  totalPage: number = 0;
  rdFilter: number = 2;
  selectedServices: Array<any> = [];
  amountServiceTotal: number = 0;

  amountReservation: number = 0;
  amountReservationSelect: number = 0;

  showTicket: boolean = true;

  pageIndex: number = CONSTANTS.PAGINATION.PAGE_INDEX;
  pageSize: number = CONSTANTS.PAGINATION.PAGE_SIZE;

  constructor(
    private nzModalService: NzModalService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {

    // this.loadOptions();
  }

  public onSearch(
  ): void{
    // this.isLoading = true;
    // this.beautifulFastService.getFindAllService(
    //   {type: this.sltHairSize, page: this.pageIndex, limit: this.pageSize}
    // ).subscribe(
    //   (response) => {
    //     if( response.success )
    //     {
    //       this.serviceList = response.data.data;
    //       this.totalPage = response.data.pagination.total;
    //     }
    //     this.isLoading = false;
    //   }
    // )
  }

  public loadOptions(): void{
    // forkJoin(
    //   this.beautifulFastService.getSearchParameterDetail( CONSTANTS.PARAMETER.TYPE_HAIR ),
    //   this.beautifulFastService.getByIdGeneralOption( CONSTANTS.OPTIONS.RESERVATION )
    // ).subscribe(
    //   (res) => {
    //     this.hairSizeList = res[0].data;
    //     this.sltHairSize = this.hairSizeList[0].id;
    //     this.amountReservation = Number.parseFloat( res[1].data.option_value );
    //     this.onSearch();
    //   }
    // )
  }

  // public onOpenPrepareReservation(): void {

  //   if( !isAuth() ){
  //     this.modalService.info("Porfavor debes logearte para poder continuar.")
  //     return;
  //   }

  //   if( this.selectedServices.length == 0 ){
  //     this.modalService.warning("Debe seleccionar un servicio para continuar...");
  //     return;
  //   }

  //   let modal = this.nzModalService.create({
  //     nzTitle: null,
  //     nzClosable: true,
  //     nzWidth: '420px',
  //     nzContent: PrepareReservationComponent,
  //     nzFooter: null,
  //     nzClassName: 'modal--two--section',
  //     nzComponentParams: {
  //       services: this.selectedServices
  //     },
  //     nzCloseIcon: null
  //   });

  //   modal.afterClose.subscribe((result) => {
  //     if (result?.process) {
  //       this.onOpenReservationPayment(null);
  //     }
  //   });
  // }

  // onOpenReservationPayment(reservationId?: any): void {
  //   let modal = this.nzModalService.create({
  //     nzTitle: null,//CONSTANTS.MODAL_TITLE.RESERVATION_PAYMENT,
  //     nzClosable: true,
  //     nzWidth: '440px',
  //     nzContent: ReservationPaymentComponent,
  //     nzClassName: 'modal--body--section',
  //     nzComponentParams: {
  //       reservationId: reservationId
  //     },
  //     nzFooter: null,
  //   });

  //   modal.afterClose.subscribe((result) => {
  //     if (result?.process) {
  //       //this.onSearch();
  //     }
  //   });
  // }


  public onChangeTypeHair(ev: any){
    this.onSearch();
  }

  // public onSelectService(ev: any){

  //   if( ev.active ){

  //     this.selectedServices.push( {
  //       id: ev.service.id,
  //       type_id: this.sltHairSize,
  //       amount: ev.service.prices.find( p => p.type_id == this.sltHairSize ).price
  //     } )
  //   }else{

  //     this.selectedServices = this.selectedServices.filter( s => (s.id != ev.service.id ) );
  //   }

  //   this.calculateAmount();
  // }

  // private calculateAmount(): void{
  //   this.amountServiceTotal = 0;
  //   this.amountReservationSelect = 0;
  //   this.selectedServices.forEach( element => {
  //     this.amountServiceTotal += element.amount;
  //     this.amountReservationSelect = this.amountReservation;
  //   })


  // }

  // public onShowPayment(): void{
  //   this.showTicket = !this.showTicket;
  // }

  // public onPageIndexChange(index: number): void{
  //   this.pageIndex = index;
  //   this.onSearch();
  // }

}
