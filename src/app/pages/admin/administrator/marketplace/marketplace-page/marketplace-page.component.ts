import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';
import { PaymentProductsModalComponent } from '@shared/components/payment/payment-products-modal/payment-products-modal.component';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { forkJoin } from 'rxjs';
import { ProductFormModalComponent } from '../product-form-modal/product-form-modal.component';

@Component({ selector: 'app-marketplace-page', templateUrl: './marketplace-page.component.html', styleUrls: ['./marketplace-page.component.scss'] })
export class MarketplacePageComponent implements OnInit {
  tabIndex = 0;
  productList: Array<IProductModel> = [];
  promotionList: Array<IProductModel> = [];
  env = environment;
  quickViewVisible = false;
  userModel: UserModel;
  totalPointsPersonal = 0;
  totalPointsPersonalGlobal = 0;
  queryParams: any = {};
  eventSearch = 0;
  loadingProducts = false;
  _cartList: Array<IProductModel> = [];
  CONSTANTS = CONSTANTS;

  constructor(private apiService: ApiService, private modal: NzModalService, private modalService: ModalService, private themeConstantService: ThemeConstantService, private authenticationService: AuthenticationService) {
    this.themeConstantService.selectedCurrentCartList.subscribe(cart => this._cartList = cart);
  }

  ngOnInit(): void { this.loadData(); }
  get currentUser() {
    const sessionUser = this.authenticationService.currentUserValue;
    const admin = sessionUser?.admin === true || Number(sessionUser?.admin) === 1 ||
      this.userModel?.is_admin === true || Number(this.userModel?.is_admin) === 1 ||
      (this.userModel as any)?.admin === true || Number((this.userModel as any)?.admin) === 1;
    return sessionUser ? { ...sessionUser, admin } : null;
  }
  get isAdmin(): boolean { return this.currentUser?.admin === true; }
  get countProduct(): number { return this._cartList.length; }
  get cartList(): Array<IProductModel> { return this._cartList; }
  get isMember(): boolean { return Boolean(this.userModel?.payment?.payment_order?.pack) && this.isUserActive(); }
  get cartPoints(): number { return this._cartList.reduce((sum, product) => sum + Number(product.points ?? 0) * (product.quantity ?? 0), 0); }
  get totalBuy(): number { return this._cartList.filter(p => (p.quantity ?? 0) > 0).reduce((sum, p) => sum + this.getFinalPrice(p) * (p.quantity ?? 0), 0); }
  isUserActive(): boolean { return this.userModel?.payment?.state === CONSTANTS.PAYMENT_ORDER.PAGADO || this.userModel?.active === true; }

  loadData(): void {
    this.loadingProducts = true;
    forkJoin({ user: this.apiService.getAuthenticationUser(), products: this.apiService.getProducts(), personalPoints: this.apiService.getProductPaymnetPoints(this.getCurrentPeriodParams()) }).subscribe({
      next: ({ user, products, personalPoints }) => {
        this.userModel = user.data;
        if (this.currentUser) {
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        this.totalPointsPersonalGlobal = Number(user.data?.points?.personalGlobal ?? 0);
        this.totalPointsPersonal = personalPoints.success ? personalPoints.data.reduce((sum, item) => sum + Number(item.points ?? 0), 0) : 0;
        this.applyProducts(products.data ?? []);
        this.loadingProducts = false;
      },
      error: error => { this.loadingProducts = false; this.modalService.error(this.getErrorMessage(error, 'No se pudo cargar la tienda.')); }
    });
  }

  reloadProducts(): void {
    this.loadingProducts = true;
    this.apiService.getProducts().subscribe({
      next: response => { this.applyProducts(response.data ?? []); this.loadingProducts = false; },
      error: error => { this.loadingProducts = false; this.modalService.error(this.getErrorMessage(error, 'No se pudieron recargar los productos.')); }
    });
  }

  onAddQuantity(index: number, amount: number): void {
    this.changeQuantity(this.productList[index], amount);
  }

  private changeQuantity(product: IProductModel | undefined, amount: number): void {
    if (!product || !product.state) return;
    const inCart = Number(this._cartList.find(item => item.id === product.id)?.quantity ?? 0);
    const available = Math.max(0, Number(product.stock ?? 0) - inCart);
    product.quantity = Math.max(0, Math.min(available, (product.quantity ?? 0) + amount));
  }

  addToCart(product: IProductModel, notify = true): void {
    if (!product.state || Number(product.stock ?? 0) < 1) return;
    const selectedQuantity = Number(product.quantity ?? 0);
    if (selectedQuantity < 1) return;
    const index = this._cartList.findIndex(current => current.id === product.id);
    const currentQuantity = index >= 0 ? Number(this._cartList[index].quantity ?? 0) : 0;
    const quantity = Math.min(Number(product.stock), currentQuantity + selectedQuantity);
    const item = { ...product, quantity };
    this._cartList = index >= 0
      ? this._cartList.map((current, currentIndex) => currentIndex === index ? item : current)
      : [...this._cartList, item];
    this.themeConstantService.changeCurrentCartList(this._cartList);
    product.quantity = 0;
    if (notify) this.modalService.success('Producto agregado al carrito.');
  }

  buyProduct(product: IProductModel): void {
    this.addToCart(product, false);
    this.onPayment();
  }

  buyPromotion(product: IProductModel): void {
    if (!product.state || Number(product.stock ?? 0) < 1) return;
    product.quantity = 1;
    this.addToCart(product, false);
    this.onPayment();
  }

  openCreateProduct(isPromotion = false): void {
    if (!this.isAdmin) return;
    const ref = this.modal.create({ nzContent: ProductFormModalComponent, nzFooter: null, nzTitle: null, nzWidth: 720, nzData: { isPromotion } });
    ref.afterClose.subscribe(saved => { if (saved) this.reloadProducts(); });
  }

  openEditProduct(product: IProductModel): void {
    if (!this.isAdmin) return;
    this.apiService.getProductById(product.id).subscribe({
      next: response => {
        const ref = this.modal.create({ nzContent: ProductFormModalComponent, nzFooter: null, nzTitle: null, nzWidth: 720, nzData: { product: response.data } });
        ref.afterClose.subscribe(saved => { if (saved) this.reloadProducts(); });
      },
      error: error => this.modalService.error(this.getErrorMessage(error, 'No se pudo consultar el producto.'))
    });
  }

  toggleProductStatus(product: IProductModel): void {
    if (!this.isAdmin) return;
    const state = !product.state;
    this.apiService.updateProductStatus(product.id, state).subscribe({
      next: response => {
        if (!response?.success) return this.modalService.error(this.getErrorMessage(response, 'No se pudo cambiar el estado.'));
        this.modalService.success(state ? 'Producto publicado correctamente.' : 'Producto despublicado correctamente.');
        this.reloadProducts();
      },
      error: error => this.modalService.error(this.getErrorMessage(error, 'No se pudo cambiar el estado.'))
    });
  }

  archiveProduct(product: IProductModel): void {
    if (!this.isAdmin) return;
    this.modalService.confirm('¿Está seguro de archivar este producto?<br>El producto dejará de aparecer en la tienda.', () => {
      this.apiService.deleteProduct(product.id).subscribe({
        next: response => {
          if (!response?.success) return this.modalService.error(this.getErrorMessage(response, 'No se pudo eliminar el producto.'));
          this.modalService.success('Producto eliminado correctamente.');
          this.reloadProducts();
        },
        error: error => {
          const message = this.getErrorMessage(error, 'No se pudo eliminar el producto.');
          if (error?.status === 409 && product.state) {
            this.modalService.confirm(`${message}<br><br>¿Desea despublicarlo ahora?`, () => this.toggleProductStatus(product));
            return;
          }
          this.modalService.error(message);
        }
      });
    });
  }

  quickViewToggle(): void { this.quickViewVisible = !this.quickViewVisible; }
  getImageUrl(path?: string): string { return path ? `${environment.apiStorageUrl}/${path.replace(/^\/?storage\//, '')}` : CONSTANTS.IMAGE.FALLBACK; }
  getPublicPrice(product: IProductModel): number { return Number(product.public_price ?? product.price ?? 0); }
  getFinalPrice(product: IProductModel): number { return Number(product.final_price ?? product.public_price ?? product.price ?? 0); }
  isPromotionActive(product: IProductModel): boolean {
    if (!product.state || !product.is_promotion || !product.promotion_start_at || !product.promotion_end_at) return false;
    const now = Date.now();
    return new Date(product.promotion_start_at).getTime() <= now && new Date(product.promotion_end_at).getTime() >= now;
  }
  getPromotionStatus(product: IProductModel): string {
    if (!product.state) return 'Borrador';
    const now = Date.now();
    if (product.promotion_start_at && new Date(product.promotion_start_at).getTime() > now) return 'Próxima';
    if (product.promotion_end_at && new Date(product.promotion_end_at).getTime() < now) return 'Vencida';
    return 'Activa';
  }

  onPayment(): void {
    if (this.cartList.length === 0) return this.modalService.info('Debe seleccionar los productos.');
    const ref = this.modal.create({ nzContent: PaymentProductsModalComponent, nzFooter: null, nzTitle: '', nzData: { userModel: this.userModel, cartList: this.cartList } });
    ref.afterClose.subscribe(() => {
      this.onSearch();
      this.reloadProducts();
      this.apiService.getProductPaymnetPoints(this.getCurrentPeriodParams()).subscribe(response => {
        if (response.success) this.totalPointsPersonal = response.data.reduce((sum, item) => sum + Number(item.points ?? 0), 0);
      });
    });
  }

  onSearch(): void { this.eventSearch = Date.now(); }
  onRemove(index: number): void {
    const id = this._cartList[index]?.id;
    this._cartList = this._cartList.filter((_, i) => i !== index);
    this.themeConstantService.changeCurrentCartList(this._cartList);
    const product = this.productList.find(item => item.id === id);
    if (product) product.quantity = 0;
  }

  private applyProducts(products: Array<IProductModel>): void {
    const previousCart = [...this._cartList];
    const normalizedProducts = products.map(product => {
      const isPromotion = product.is_promotion === true || Number(product.is_promotion) === 1;
      const publicPrice = Number(product.public_price ?? product.price ?? 0);
      return { ...product,
        public_price: publicPrice,
        final_price: isPromotion ? publicPrice : Number(product.final_price ?? product.public_price ?? product.price ?? 0),
        discount_percentage: isPromotion ? 0 : Number(product.discount_percentage ?? 0),
        points: Number(product.points ?? 0), stock: Number(product.stock ?? 0), state: product.state === true || Number(product.state) === 1,
        is_promotion: isPromotion,
        quantity: 0
      };
    });
    this.productList = normalizedProducts.filter(product => !product.is_promotion);
    const promotions = normalizedProducts.filter(product => product.is_promotion);
    // El backend determina cuáles promociones puede recibir el socio. En el frontend
    // solo ocultamos borradores para no aplicar una segunda regla de fechas/pack.
    this.promotionList = this.isAdmin ? promotions : promotions.filter(product => product.state);
    this._cartList = previousCart.map(cartItem => {
      const product = normalizedProducts.find(item => item.id === cartItem.id);
      return product?.state && product.stock > 0 ? { ...product, quantity: Math.min(product.stock, Math.max(1, cartItem.quantity ?? 1)) } : null;
    }).filter(product => product !== null) as Array<IProductModel>;
    this.themeConstantService.changeCurrentCartList(this._cartList);
  }

  private getErrorMessage(error: any, fallback: string): string {
    const body = error?.error ?? error;
    if (body?.data && typeof body.data === 'object') {
      const messages = Object.values(body.data).reduce<string[]>((all, value) => Array.isArray(value) ? all.concat(value.map(String)) : value == null ? all : all.concat(String(value)), []);
      if (messages.length) return messages.join('\n');
    }
    return body?.message || fallback;
  }

  private getCurrentPeriodParams(): { month: number; year: number } {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  }
}
