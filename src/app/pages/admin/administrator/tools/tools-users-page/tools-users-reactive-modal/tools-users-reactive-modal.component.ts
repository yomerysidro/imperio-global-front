import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CONSTANTS } from '@shared/constants/constants';
import { ApiService } from '@shared/services/api.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { UserModel } from '@shared/services/models/user.interface';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';

type ReactivationCategoryCode = 'product' | 'service';

interface ReactivationItem extends IProductModel {
  quantity?: number;
}

interface ReactivationCategory {
  code: ReactivationCategoryCode;
  label: string;
  backendStatus: any;
  products: ReactivationItem[];
  minimumPoints: number;
  discountPercentage: number;
  loaded: boolean;
  loading: boolean;
}

@Component({
  selector: 'app-tools-users-reactive-modal',
  templateUrl: './tools-users-reactive-modal.component.html',
  styleUrls: ['./tools-users-reactive-modal.component.scss']
})
export class ToolsUsersReactiveModalComponent implements OnInit {

  @Input() userModel: UserModel;
  @Output() back: EventEmitter<number> = new EventEmitter<number>();

  avatarUrl: string = CONSTANTS.IMAGE.FALLBACK;
  loadingStatus: boolean = false;
  statusLoaded: boolean = false;
  loadingDesactive: boolean = false;
  selectedCategoryIndex: number = 0;

  categories: ReactivationCategory[] = [
    this.createCategory('product', 'Productos'),
    this.createCategory('service', 'Servicios')
  ];

  constructor(
    private apiService: ApiService,
    private modalRef: NzModalService,
    private modalService: ModalService
  ) { }

  ngOnInit(): void {
    this.loadReactivationStatus();
  }

  get selectedCategory(): ReactivationCategory {
    return this.categories[this.selectedCategoryIndex];
  }

  get cartList(): ReactivationItem[] {
    return this.selectedCategory.products.filter(product => (product.quantity || 0) > 0);
  }

  get totalPoints(): number {
    return this.cartList.reduce(
      (total, product) => total + (Number(product.points) * Number(product.quantity || 0)),
      0
    );
  }

  get publicSubtotal(): number {
    return this.cartList.reduce(
      (total, product) => total + (Number(product.price || 0) * Number(product.quantity || 0)),
      0
    );
  }

  get discountSubtotal(): number {
    return this.publicSubtotal * this.selectedCategory.discountPercentage / 100;
  }

  get totalBuy(): number {
    return this.publicSubtotal - this.discountSubtotal;
  }

  get meetsMinimumPoints(): boolean {
    return this.totalPoints >= this.selectedCategory.minimumPoints;
  }

  public onCategoryChange(index: number): void {
    this.selectedCategoryIndex = index;
    this.loadCategory(this.selectedCategory);
  }

  public isCategoryAvailable(category: ReactivationCategory): boolean {
    const status = category.backendStatus;
    if (typeof status === 'boolean') return status;
    if (!status) return false;
    if (status.success === false) return false;
    if (status.reason === 'no_package_purchase' || status.data?.reason === 'no_package_purchase') return false;
    if (status.can_reactivate !== undefined) return this.isTrue(status.can_reactivate);
    if (status.available !== undefined) return this.isTrue(status.available);
    if (status.eligible !== undefined) return this.isTrue(status.eligible);
    if (status.is_active !== undefined) return !this.isTrue(status.is_active);
    return true;
  }

  public onAddQuantity(index: number, amount: number): void {
    const product = this.selectedCategory.products[index];
    product.quantity = Math.max(0, Number(product.quantity || 0) + amount);
  }

  public getDiscountAmount(product: ReactivationItem): number {
    return Number(product.price || 0) * this.selectedCategory.discountPercentage / 100;
  }

  public getFinalPrice(product: ReactivationItem): number {
    return Number(product.price || 0) - this.getDiscountAmount(product);
  }

  public getPublicSubtotal(product: ReactivationItem): number {
    return Number(product.price || 0) * Number(product.quantity || 0);
  }

  public getProductDiscountSubtotal(product: ReactivationItem): number {
    return this.getPublicSubtotal(product) * this.selectedCategory.discountPercentage / 100;
  }

  public getFinalSubtotal(product: ReactivationItem): number {
    return this.getPublicSubtotal(product) - this.getProductDiscountSubtotal(product);
  }

  public modalDesactive(): void {
    if (!this.meetsMinimumPoints) {
      this.modalService.warning(`⚠ Selección incompleta. Agrega más elementos para completar la reactivación.`);
      return;
    }

    this.modalService.confirm(
      `🛒 ¿Confirmas la reactivación con ${this.selectedCategory.label.toLowerCase()}?`,
      () => {
        this.loadingDesactive = true;
        this.apiService.postUsercodeActiveResidual({
          userCode: this.userModel?.uuid,
          category: this.selectedCategory.code,
          products: this.cartList.map(product => ({
            product: product.id,
            quantity: product.quantity || 0
          }))
        }).subscribe(
          (response) => {
            this.loadingDesactive = false;
            if (response?.success) {
              this.modalRef.closeAll();
              const successMessage = response.message || 'Puntos reactivados correctamente.';
              this.modalService.success(`✓ ${successMessage}`);
              return;
            }
            this.modalService.error(`✕ ${response?.message || 'No se pudieron reactivar los puntos.'}`);
          },
          (error) => {
            this.loadingDesactive = false;
            this.modalService.error(`✕ ${this.getErrorMessage(error) || 'No se pudieron reactivar los puntos.'}`);
          }
        );
      }
    );
  }

  private loadReactivationStatus(): void {
    const userCode = this.userModel?.uuid;
    if (!userCode) return;

    this.loadingStatus = true;
    this.apiService.getUserReactivationStatus(userCode).subscribe(
      (response) => {
        this.loadingStatus = false;
        this.statusLoaded = true;
        const statuses = response?.data?.categories || {};
        this.categories.forEach(category => {
          category.backendStatus = statuses[category.code];
        });

        const firstAvailableIndex = this.categories.findIndex(category => this.isCategoryAvailable(category));
        if (firstAvailableIndex >= 0) {
          this.selectedCategoryIndex = firstAvailableIndex;
        }
        this.loadCategory(this.selectedCategory);
      },
      (error) => {
        this.loadingStatus = false;
        this.modalService.error(this.getErrorMessage(error) || 'No se pudo consultar el estado de reactivación.');
      }
    );
  }

  private loadCategory(category: ReactivationCategory): void {
    const userCode = this.userModel?.uuid;
    if (!userCode || !this.statusLoaded || !this.isCategoryAvailable(category) || category.loaded || category.loading) return;

    category.loading = true;
    this.apiService.getUserReactivationProducts(userCode, category.code).subscribe(
      (response) => {
        category.loading = false;
        if (!response?.success) {
          this.modalService.error(response?.message || `No se pudieron cargar ${category.label.toLowerCase()}.`);
          return;
        }

        const data = response.data || {};
        const responseCategory = data.category as ReactivationCategoryCode;
        if (responseCategory !== category.code) {
          this.modalService.error('El backend devolvió una categoría distinta a la solicitada.');
          return;
        }

        category.products = (data.products || []).map(product => ({ ...product, quantity: 0 }));
        category.minimumPoints = Number(data.minimum_points || 0);
        category.discountPercentage = Number(data.pack?.discount || 0);
        category.loaded = true;
      },
      (error) => {
        category.loading = false;
        this.modalService.error(this.getErrorMessage(error) || `No se pudieron cargar ${category.label.toLowerCase()}.`);
      }
    );
  }

  private createCategory(code: ReactivationCategoryCode, label: string): ReactivationCategory {
    return {
      code,
      label,
      backendStatus: null,
      products: [],
      minimumPoints: 0,
      discountPercentage: 0,
      loaded: false,
      loading: false
    };
  }

  private isTrue(value: any): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    return error?.message || error?.error?.message || '';
  }
}
