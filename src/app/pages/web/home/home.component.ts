import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { ApiService } from '@shared/services/api.service';
import { PackModel } from '@shared/services/models/packs.interface';
import { IProductModel } from '@shared/services/models/product.interface';
import { CONSTANTS } from '@shared/constants/constants';
import { ModalService } from '@shared/utilities/modal-services';
import AOS from 'aos';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  windowWidth: number = 0;
  env = environment;
  planList: Array<PackModel> = [];
  productList: Array<IProductModel> = [];
  detailProduct: IProductModel | null = null;
  loadingProducts: boolean = false;
  readonly fallbackImage = CONSTANTS.IMAGE.FALLBACK;

  public get isAuthenticated(): boolean {
    return Boolean(this.authenticationService.currentTokenValue);
  }

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
    private authenticationService: AuthenticationService,
    private themeConstantService: ThemeConstantService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.windowWidth = window.innerWidth;
    AOS.init({disable: 'mobile'});
    AOS.refresh();
    this.loadOptions();
    this.loadPlans();
    this.loadProducts();
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

  public loadProducts(): void {
    this.loadingProducts = true;
    this.apiService.getProducts().subscribe(
      response => {
        this.productList = (response.data ?? []).map(product => ({
          ...product,
          public_price: Number(product.public_price ?? product.price ?? 0),
          final_price: Number(product.final_price ?? product.public_price ?? product.price ?? 0),
          discount_percentage: Number(product.discount_percentage ?? 0),
          points: Number(product.points ?? 0),
          stock: Number(product.stock ?? 0),
          quantity: 1
        }));
        this.loadingProducts = false;
      },
      () => this.loadingProducts = false
    );
  }

  public getProductImage(path?: string): string {
    return path ? `${environment.apiStorageUrl}/${path.replace(/^\/?storage\//, '')}` : this.fallbackImage;
  }

  public getDisplayedPrice(product: IProductModel): number {
    return Number(product.public_price ?? product.price ?? 0);
  }

  public openProductDetails(product: IProductModel): void {
    this.detailProduct = product;
  }

  public closeProductDetails(): void {
    this.detailProduct = null;
  }

  public getProductBenefits(product: IProductModel): string[] {
    const title = product.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const details: Array<{ terms: string[]; benefits: string[] }> = [
      { terms: ['servicio de educacion', 'educacion internacional'], benefits: ['Acceso a contenidos de formación internacional.', 'Aprendizaje flexible para avanzar a tu propio ritmo.', 'Herramientas para fortalecer habilidades personales y profesionales.', 'Contenido orientado al crecimiento y desarrollo continuo.'] },
      { terms: ['omega'], benefits: ['Complementa una alimentación equilibrada con ácidos grasos esenciales.', 'Contribuye al cuidado cardiovascular.', 'Apoya el funcionamiento cerebral y el bienestar general.', 'Presentación práctica para el consumo diario.'] },
      { terms: ['colageno'], benefits: ['Complemento nutricional para el cuidado de piel y articulaciones.', 'Aporta proteínas que forman parte de tejidos y ligamentos.', 'Fácil de incorporar a la rutina diaria.', 'Presentación práctica y de consumo sencillo.'] },
      { terms: ['21 dias', 'redisenar tu vida'], benefits: ['Programa práctico de desarrollo personal.', 'Ayuda a establecer objetivos y hábitos positivos.', 'Incluye ejercicios de reflexión y acción diaria.', 'Orientado a fortalecer motivación, enfoque y constancia.'] },
      { terms: ['polo'], benefits: ['Diseño institucional para dama y caballero.', 'Prenda cómoda para actividades y eventos.', 'Material de uso cotidiano y fácil cuidado.', 'Disponible de acuerdo con talla y stock.'] },
      { terms: ['tomatodo'], benefits: ['Capacidad de un litro para una hidratación práctica.', 'Diseño reutilizable y fácil de transportar.', 'Ideal para oficina, entrenamiento o actividades diarias.', 'Ayuda a reducir el uso de botellas descartables.'] },
      { terms: ['bio imperio'], benefits: ['Favorece el equilibrio de la flora intestinal.', 'Complementa el cuidado digestivo diario.', 'Apoya el bienestar general desde la nutrición.', 'Presentación práctica para integrar a tu rutina.'] },
      { terms: ['moringa'], benefits: ['Fuente vegetal de nutrientes y antioxidantes.', 'Complementa una alimentación equilibrada.', 'Acompaña rutinas de vitalidad y bienestar.', 'Presentación práctica para consumo diario.'] },
      { terms: ['adelgazante'], benefits: ['Infusión pensada para acompañar hábitos saludables.', 'Fácil de preparar e incorporar a la rutina.', 'Complementa una alimentación balanceada y actividad física.', 'Presentación práctica de consumo.'] },
      { terms: ['limpieza potencial'], benefits: ['Complementa el cuidado digestivo.', 'Fácil de preparar y consumir.', 'Acompaña una rutina de alimentación equilibrada.', 'Agradable sabor a tamarindo.'] },
      { terms: ['agua alcalina'], benefits: ['Alternativa práctica para mantener la hidratación.', 'Acompaña actividades cotidianas y deportivas.', 'Presentación lista para consumir.', 'Ideal para complementar una rutina de bienestar.'] },
      { terms: ['sacha jergon'], benefits: ['Producto natural de origen amazónico.', 'Complementa rutinas de bienestar y nutrición.', 'Presentación diseñada para un consumo práctico.', 'Elaborado para integrarse a una alimentación variada.'] },
      { terms: ['power energy'], benefits: ['Acompaña jornadas de actividad física y mental.', 'Presentación práctica para la rutina diaria.', 'Complementa hábitos de descanso y alimentación.', 'Pensado para momentos que requieren vitalidad.'] },
      { terms: ['cappuccino'], benefits: ['Bebida de preparación rápida y sabor agradable.', 'Ideal para acompañar distintos momentos del día.', 'Formato práctico para preparar en casa u oficina.', 'Una alternativa para disfrutar dentro de una dieta equilibrada.'] },
      { terms: ['acciona'], benefits: ['Contenido de desarrollo personal y liderazgo.', 'Promueve una mentalidad orientada a objetivos.', 'Incluye ideas para fortalecer motivación y constancia.', 'Lectura práctica para crecimiento personal.'] }
    ];
    return details.find(detail => detail.terms.some(term => title.includes(term)))?.benefits ?? [
      'Producto seleccionado por Imperio Global.',
      'Presentación práctica para el uso cotidiano.',
      'Calidad y bienestar para complementar tu estilo de vida.',
      'Consulta disponibilidad y condiciones de compra por WhatsApp.'
    ];
  }

  public changeProductQuantity(product: IProductModel, amount: number): void {
    if (product.stock < 1) return;
    product.quantity = Math.max(1, Math.min(product.stock, Number(product.quantity ?? 1) + amount));
  }

  public addPublicProduct(product: IProductModel, notify = true): void {
    if (product.stock < 1) return;
    const quantity = Math.max(1, Math.min(product.stock, Number(product.quantity ?? 1)));
    const current = [...this.themeConstantService.cartList];
    const index = current.findIndex(item => item.id === product.id);
    const cart = index >= 0
      ? current.map((item, currentIndex) => currentIndex === index ? { ...product, quantity } : item)
      : [...current, { ...product, quantity }];
    this.themeConstantService.cartList = cart;
    this.themeConstantService.changeCurrentCartList(cart);
    if (notify) this.modalService.success('Producto agregado al carrito. Inicia sesión para continuar con el pago.');
  }

  public buyPublicProduct(product: IProductModel): void {
    const quantity = Math.max(1, Math.min(product.stock, Number(product.quantity ?? 1)));
    this.buyViaWhatsApp(product.title, this.getDisplayedPrice(product), quantity);
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
