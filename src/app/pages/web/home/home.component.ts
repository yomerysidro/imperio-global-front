import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { ModalService } from '@shared/utilities/modal-services';
import AOS from 'aos';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  windowWidth: number = 0;
  env = environment;
  planList: Array<PackModel> = [];

  // Variable para controlar qué modal local se abre (0 = ninguno)
  modalActiveId: number = 0;

  // Variables para las cantidades de los 9 productos
  product1Qty: number = 1;
  product2Qty: number = 1;
  product3Qty: number = 1;
  product4Qty: number = 1;
  product5Qty: number = 1;
  product6Qty: number = 1;
  product7PoteQty: number = 1;
  product7CajaQty: number = 1;
  product8Qty: number = 1;
  product9Qty: number = 1;

  // VARIABLES AGREGADAS PARA LOS 2 NUEVOS PRODUCTOS
  productNew1Qty: number = 1;
  productNew2Qty: number = 1;

  constructor(
    private nzModalService: NzModalService,
    private apiService: ApiService,
    private modalService: ModalService,
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;
    AOS.init({disable: 'mobile'});
    AOS.refresh();
    this.loadOptions();
    this.loadPlans();
  }

  ngOnChanges(): void {
    this.windowWidth = window.innerWidth;
  }

  public loadOptions(): void{ }

  public loadPlans(): void{
    this.apiService.getPlansSearch({}).subscribe(
      (response) =>{
        this.planList = response.data;
      },
      (error) =>{ }
    )
  }

  // ==========================================
  // FUNCIÓN PARA ABRIR EL MODAL LOCAL
  // ==========================================
  openLocalModal(productId: number): void {
    this.modalActiveId = productId;
  }

  // ==========================================
  // FUNCIÓN PARA CERRAR EL MODAL LOCAL
  // ==========================================
  closeLocalModal(): void {
    this.modalActiveId = 0;
  }

  // ==========================================
  // FUNCIÓN PARA COMPRAR VÍA WHATSAPP
  // ==========================================
  buyViaWhatsApp(productName: string, price: number, quantity: number): void {
    const phoneNumber = '51997245632'; // Número sin el +
    const total = (price * quantity).toFixed(2);
    
    const message = `¡Hola Imperio Global! Quiero comprar el producto:%0A%0A*Producto:* ${productName}%0A*Cantidad:* ${quantity}%0A*Total a pagar:* S/. ${total}%0A%0A¡Gracias!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
    
    window.open(url, '_blank');
  }

  // ==========================================
  // FUNCIÓN PARA EL BOTÓN "ÚNETE AHORA" (Abre WhatsApp)
  // ==========================================
  joinNowWhatsApp(): void {
    const phoneNumber = '51997245632';
    const message = `¡Hola Imperio Global! Estoy interesado en unirme a su red de networking. Quiero recibir más información sobre los planes y beneficios. ¡Gracias!`;
    
    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
    window.open(url, '_blank');
  }

  // ==========================================
  // FUNCIÓN PARA EL BOTÓN "DESCUBRE LOS PLANES" (Desplazamiento suave)
  // ==========================================
  goToPlans(): void {
    const element = document.getElementById('planes-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================
  // FUNCIONES DE CONTACTO
  // ==========================================
  goToWhatsApp(): void {
    const phone = '51997245632'; // Reemplaza con el número correcto de WhatsApp
    const message = 'Hola Imperio Global, quisiera más información.';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
  }

  goToEmail(): void {
    window.location.href = 'mailto:pascual.seminario@gmail.com';
  }

  // ==========================================
  // VARIABLE PARA EL MODAL DEL PACK INTERNACIONAL
  // ==========================================
  isConstructorModalOpen: boolean = false;

  // ==========================================
  // FUNCIÓN PARA ABRIR EL MODAL INTERNACIONAL
  // ==========================================
  openConstructorModal(): void {
    this.isConstructorModalOpen = true;
  }

  // ==========================================
  // FUNCIÓN PARA CERRAR EL MODAL INTERNACIONAL
  // ==========================================
  closeConstructorModal(): void {
    this.isConstructorModalOpen = false;
  }

  // ==========================================
  // FUNCIÓN ÚNICA PARA COMPRAR CUALQUIER PACK VÍA WHATSAPP
  // ==========================================
  buyWhatsApp(productName: string, price: number, quantity: number = 1): void {
    const phoneNumber = '51997245632'; // Número de WhatsApp sin el +
    const total = (price * quantity).toFixed(2);
    
    const message = `¡Hola Imperio Global! Quiero comprar el pack:%0A%0A*Nombre:* ${productName}%0A*Cantidad:* ${quantity}%0A*Total a pagar:* S/. ${total}%0A%0A¡Gracias!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;
    window.open(url, '_blank');
  }

  // ==========================================
  // FUNCIONES DE REDES SOCIALES
  // ==========================================
  goToFacebook(): void {
    window.open('https://www.facebook.com/share/1D6fZzrjkT/', '_blank'); // Cambia el link
  }

  goToYoutube(): void {
    window.open('https://www.youtube.com/@ImperioGlobalPeru', '_blank'); // Cambia el link
  }

  goToInstagram(): void {
    window.open('https://www.instagram.com', '_blank'); // Cambia el link
  }
}