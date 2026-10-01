import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiService } from '@shared/services/api.service';
import { IProductModel } from '@shared/services/models/product.interface';
import { AffiliationPackDetail, Amount, FinanceIgReport, FinanceIgReportService, InventoryEntryCommand, InventoryMovementPage, ProductSaleOrder, ProductSalesSource } from './finance-ig-report.service';
import { createFinanceIgWorkbook } from './finance-ig-excel';

type InventoryEntryType = InventoryEntryCommand['type'];

interface InventoryLine {
  product_id: string;
  quantity: number | null;
  company_unit_cost: number | null;
  additional_cost: number | null;
}

interface EntryConfirmationLine {
  productTitle: string;
  date: string;
  quantity: number;
  unitCost: number;
  type: InventoryEntryType;
}

@Component({
  selector: 'app-finance-ig',
  templateUrl: './finance-ig.component.html',
  styleUrls: ['./finance-ig.component.scss']
})
export class FinanceIgComponent implements OnInit, OnDestroy {
  activeSection: 'summary' | 'inventory' = 'summary';
  inventorySection: 'entries' | 'exits' | 'movements' = 'entries';
  selectedPeriod = '';
  report: FinanceIgReport | null = null;
  loading = false;
  error = '';
  products: IProductModel[] = [];
  loadingProducts = false;
  productsError = '';
  entrySuccess = '';
  entryConfirmation: EntryConfirmationLine[] = [];
  entryMovementId: number | null = null;
  submittingEntry = false;
  confirmingEntry = false;
  modalProduct: IProductModel | null = null;
  modalLine: InventoryLine = this.emptyLine();
  modalExtraLines: InventoryLine[] = [];
  modalDate = '';
  modalDescription = '';
  modalType: InventoryEntryType = 'PURCHASE_ENTRY';
  modalFetching = false;
  modalFetchError = '';
  modalErrors: string[] = [];
  movementDirection: '' | 'entry' | 'exit' = '';
  movementPage: InventoryMovementPage | null = null;
  movementsLoading = false;
  movementsError = '';
  affiliationModalOpen = false;
  affiliationPeriod = '';
  affiliationRows: AffiliationPackDetail[] = [];
  affiliationPage = 1;
  readonly detailPageSize = 10;
  affiliationTotal: number | null = null;
  affiliationLoading = false;
  affiliationError = '';
  productSalesModalOpen = false;
  productSalesSource: ProductSalesSource = 'store';
  productSalesPeriod = '';
  productSalesOrders: ProductSaleOrder[] = [];
  productSalesHistories: Array<{ buyer: string; orders: ProductSaleOrder[] }> = [];
  productSalesPage = 1;
  productSalesTotals: { sales: number; cost_of_sales: number; gross_profit: number } | null = null;
  productSalesLoading = false;
  productSalesError = '';
  financeHelpOpen: 'after-commissions' | 'net-cash-flow' | null = null;
  private modalRequestId = 0;
  private request?: Subscription;
  private movementsRequest?: Subscription;
  private affiliationRequest?: Subscription;
  private productSalesRequest?: Subscription;

  constructor(
    private reportService: FinanceIgReportService,
    private apiService: ApiService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.selectedPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.modalDate = this.todayDate();
    this.loadReport();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.movementsRequest?.unsubscribe();
    this.affiliationRequest?.unsubscribe();
    this.productSalesRequest?.unsubscribe();
  }

  onPeriodChange(event: Event): void {
    this.closeAffiliationDetails();
    this.closeProductSalesDetails();
    this.selectedPeriod = (event.target as HTMLInputElement).value;
    this.loadReport();
    if (this.inventorySection === 'movements') this.loadMovements(1);
  }

  openAffiliationDetails(): void {
    if (!this.report || this.loading || this.report.period !== this.selectedPeriod) return;
    const match = /^(\d{4})-(\d{2})$/.exec(this.report.period);
    if (!match) return;

    this.affiliationRequest?.unsubscribe();
    this.affiliationModalOpen = true;
    this.affiliationPeriod = this.report.period;
    this.affiliationRows = [];
    this.affiliationPage = 1;
    this.affiliationTotal = null;
    this.affiliationError = '';
    this.affiliationLoading = true;
    this.affiliationRequest = this.reportService.getAffiliationPackDetails(Number(match[1]), Number(match[2])).subscribe({
      next: response => {
        this.affiliationLoading = false;
        const details = response?.data;
        const items = details?.items;
        if (!response?.success || details?.period !== this.affiliationPeriod || !Array.isArray(items)) {
          this.affiliationError = 'No se pudo cargar el detalle de packs de este período.';
          return;
        }
        const amounts = items.map(item => this.amountInCents(item?.amount));
        const cardTotal = this.amountInCents(this.report?.affiliation_packs?.sales);
        const apiTotal = this.amountInCents(details.total);
        const rowTotal = amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
        if (amounts.some(amount => amount === null) || cardTotal === null || apiTotal === null ||
          rowTotal !== apiTotal || rowTotal !== cardTotal ||
          items.some(item => !item?.date || !item?.buyer || !item?.pack)) {
          this.affiliationError = 'La lista de packs no coincide con el total del card. Consulta el backend.';
          return;
        }
        this.affiliationRows = items;
        this.affiliationPage = 1;
        this.affiliationTotal = rowTotal / 100;
      },
      error: () => {
        this.affiliationLoading = false;
        this.affiliationError = 'El detalle de packs aún no está disponible. Intenta nuevamente más tarde.';
      }
    });
  }

  closeAffiliationDetails(): void {
    this.affiliationRequest?.unsubscribe();
    this.affiliationModalOpen = false;
    this.affiliationLoading = false;
  }

  get affiliationPageCount(): number {
    return Math.max(1, Math.ceil(this.affiliationRows.length / this.detailPageSize));
  }

  get visibleAffiliationRows(): AffiliationPackDetail[] {
    const start = (this.affiliationPage - 1) * this.detailPageSize;
    return this.affiliationRows.slice(start, start + this.detailPageSize);
  }

  setAffiliationPage(page: number): void {
    this.affiliationPage = Math.max(1, Math.min(this.affiliationPageCount, page));
    this.scrollModalBody('affiliation-detail-body');
  }

  get productSalesPageCount(): number {
    return Math.max(1, Math.ceil(this.productSalesHistories.length / this.detailPageSize));
  }

  get visibleProductSalesHistories(): Array<{ buyer: string; orders: ProductSaleOrder[] }> {
    const start = (this.productSalesPage - 1) * this.detailPageSize;
    return this.productSalesHistories.slice(start, start + this.detailPageSize);
  }

  setProductSalesPage(page: number): void {
    this.productSalesPage = Math.max(1, Math.min(this.productSalesPageCount, page));
    this.scrollModalBody('product-sales-detail-body');
  }

  private scrollModalBody(id: string): void {
    document.getElementById(id)?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private amountInCents(value: Amount | null | undefined): number | null {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return null;
    return Math.round(Number(value) * 100);
  }

  get productSalesTitle(): string {
    return this.productSalesSource === 'store' ? 'Ventas de Tienda' : 'Reactivaciones';
  }

  openProductSalesDetails(source: ProductSalesSource): void {
    if (!this.report || this.loading || this.report.period !== this.selectedPeriod) return;
    const match = /^(\d{4})-(\d{2})$/.exec(this.report.period);
    if (!match) return;

    this.productSalesRequest?.unsubscribe();
    this.productSalesModalOpen = true;
    this.productSalesSource = source;
    this.productSalesPeriod = this.report.period;
    this.productSalesOrders = [];
    this.productSalesHistories = [];
    this.productSalesPage = 1;
    this.productSalesTotals = null;
    this.productSalesError = '';
    this.productSalesLoading = true;
    this.productSalesRequest = this.reportService.getProductSalesDetails(Number(match[1]), Number(match[2]), source).subscribe({
      next: response => {
        this.productSalesLoading = false;
        const details = response?.data;
        if (!response?.success || details?.period !== this.productSalesPeriod ||
          details?.source !== source || !Array.isArray(details?.orders)) {
          this.productSalesError = 'No se pudo cargar el detalle de este período.';
          return;
        }

        const totals = { sales: 0, cost_of_sales: 0, gross_profit: 0 };
        for (const order of details.orders) {
          const amounts = this.validatedOrderCents(order);
          if (!amounts) {
            this.productSalesError = 'El detalle contiene importes incompletos o inconsistentes.';
            return;
          }
          totals.sales += amounts.sales;
          totals.cost_of_sales += amounts.cost_of_sales;
          totals.gross_profit += amounts.gross_profit;
        }
        const card = this.report?.[source];
        if (totals.sales !== this.amountInCents(card?.sales) ||
          totals.cost_of_sales !== this.amountInCents(card?.cost_of_sales) ||
          totals.gross_profit !== this.amountInCents(card?.gross_profit)) {
          this.productSalesError = 'La suma del detalle no coincide con ventas, costos y utilidad bruta del card.';
          return;
        }
        this.productSalesOrders = details.orders;
        this.productSalesHistories = this.groupProductSalesHistory(details.orders);
        this.productSalesPage = 1;
        this.productSalesTotals = {
          sales: totals.sales / 100,
          cost_of_sales: totals.cost_of_sales / 100,
          gross_profit: totals.gross_profit / 100
        };
      },
      error: () => {
        this.productSalesLoading = false;
        this.productSalesError = 'No se pudo cargar el detalle de ventas. Intenta nuevamente.';
      }
    });
  }

  closeProductSalesDetails(): void {
    this.productSalesRequest?.unsubscribe();
    this.productSalesModalOpen = false;
    this.productSalesLoading = false;
  }

  private validatedOrderCents(order: ProductSaleOrder): { sales: number; cost_of_sales: number; gross_profit: number } | null {
    if (!order?.date || !order?.buyer || !order?.order_id || !Array.isArray(order.items) || !order.items.length ||
      !['SALE_EXIT', 'SALE_CANCELLATION'].includes(order.movement_type)) return null;
    const totals = { sales: 0, cost_of_sales: 0, gross_profit: 0 };
    for (const item of order.items) {
      const sales = this.amountInCents(item?.sales);
      const cost = this.amountInCents(item?.cost_of_sales);
      const profit = this.amountInCents(item?.gross_profit);
      if (!item?.product || !Number.isInteger(item.quantity) || item.quantity < 1 ||
        sales === null || cost === null || profit === null || profit !== sales - cost) return null;
      totals.sales += sales;
      totals.cost_of_sales += cost;
      totals.gross_profit += profit;
    }
    return totals.sales === this.amountInCents(order.sales) &&
      totals.cost_of_sales === this.amountInCents(order.cost_of_sales) &&
      totals.gross_profit === this.amountInCents(order.gross_profit) ? totals : null;
  }

  private groupProductSalesHistory(orders: ProductSaleOrder[]): Array<{ buyer: string; orders: ProductSaleOrder[] }> {
    const grouped = new Map<string, { buyer: string; orders: ProductSaleOrder[] }>();
    for (const order of orders) {
      const buyer = order.buyer.trim();
      const key = buyer.toLocaleLowerCase('es');
      const history = grouped.get(key) ?? { buyer, orders: [] };
      history.orders.push(order);
      grouped.set(key, history);
    }
    return Array.from(grouped.values()).sort((a, b) => a.buyer.localeCompare(b.buyer, 'es'));
  }

  trackProductSalesHistory(_index: number, history: { buyer: string }): string {
    return history.buyer.toLocaleLowerCase('es');
  }

  selectInventorySection(section: 'entries' | 'exits' | 'movements'): void {
    this.inventorySection = section;
    if (section === 'movements') this.loadMovements(1);
  }

  onMovementDirectionChange(event: Event): void {
    this.movementDirection = (event.target as HTMLSelectElement).value as '' | 'entry' | 'exit';
    this.loadMovements(1);
  }

  loadMovements(page = 1): void {
    this.movementsRequest?.unsubscribe();
    this.movementPage = null;
    this.movementsError = '';
    const match = /^(\d{4})-(\d{2})$/.exec(this.selectedPeriod);
    const year = match ? Number(match[1]) : NaN;
    const month = match ? Number(match[2]) : NaN;
    if (!match || year < 2000 || year > 2100 || month < 1 || month > 12) {
      this.movementsLoading = false;
      this.movementsError = 'Selecciona un mes válido.';
      return;
    }
    this.movementsLoading = true;
    this.movementsRequest = this.reportService.getMovements(year, month, page, this.movementDirection || undefined).subscribe({
      next: response => {
        this.movementsLoading = false;
        if (response?.success && Array.isArray(response.data?.data)) this.movementPage = response.data;
        else this.movementsError = 'No se pudieron cargar los movimientos.';
      },
      error: () => {
        this.movementsLoading = false;
        this.movementsError = 'No se pudieron cargar los movimientos.';
      }
    });
  }

  movementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      INITIAL_ENTRY: 'Stock inicial', PURCHASE_ENTRY: 'Compra a proveedor', SALE_EXIT: 'Salida por venta',
      SALE_CANCELLATION: 'Cancelación de venta', RETURN_ENTRY: 'Devolución',
      ADJUSTMENT_ENTRY: 'Ajuste de entrada', ADJUSTMENT_EXIT: 'Ajuste de salida'
    };
    return labels[type] || type;
  }

  loadProducts(refreshIds: string[] = []): void {
    this.loadingProducts = true;
    this.productsError = '';
    this.products = [];
    this.apiService.getProducts().subscribe({
      next: response => {
        this.loadingProducts = false;
        if (response?.success && Array.isArray(response.data)) {
          this.products = response.data;
          if (refreshIds.length) this.refreshProductDetails(refreshIds);
        } else {
          this.productsError = 'No se pudo cargar el catálogo de productos.';
        }
      },
      error: () => {
        this.loadingProducts = false;
        this.productsError = 'No se pudo cargar el catálogo de productos.';
      }
    });
  }

  getProduct(productId: string): IProductModel | undefined {
    return this.products.find(product => product.id === productId);
  }

  getCompanyCost(product: IProductModel | undefined): Amount | null {
    const value = (product as (IProductModel & { company_unit_cost?: Amount | null }) | undefined)?.company_unit_cost;
    return value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 ? null : value;
  }

  get showCompanyCost(): boolean {
    return this.products.some(product => this.getCompanyCost(product) !== null);
  }

  formatEntryDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  entryPreviewTotal(line: InventoryLine): number | null {
    const quantity = Number(line.quantity);
    const unitCost = Number(line.company_unit_cost);
    const additional = Number(line.additional_cost);
    if (line.quantity === null || line.company_unit_cost === null || line.additional_cost === null ||
      !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(unitCost) || unitCost < 0 ||
      !Number.isFinite(additional) || additional < 0) return null;
    return (quantity * Math.round(unitCost * 100) + Math.round(additional * 100)) / 100;
  }

  get modalGroupPreviewTotal(): number | null {
    const totals = [this.modalLine, ...this.modalExtraLines].map(line => this.entryPreviewTotal(line));
    return totals.some(total => total === null) ? null : totals.reduce<number>((sum, total) => sum + Number(total), 0);
  }

  addModalProduct(): void {
    if (this.submittingEntry || this.confirmingEntry) return;
    this.modalExtraLines.push(this.emptyLine());
  }

  removeModalProduct(index: number): void {
    if (this.submittingEntry || this.confirmingEntry) return;
    this.modalExtraLines.splice(index, 1);
  }

  isPurchaseEligible(product: IProductModel): boolean {
    return Number(product.stock) === 0 || (this.getCompanyCost(product) !== null && Number(this.getCompanyCost(product)) > 0);
  }

  isExtraProductEligible(product: IProductModel, line: InventoryLine): boolean {
    if (this.modalType === 'PURCHASE_ENTRY') return this.isPurchaseEligible(product);
    const cost = this.getCompanyCost(product);
    return Number(product.stock) > 0 && cost !== null && Number(cost) === 0 &&
      ![this.modalLine, ...this.modalExtraLines].some(other => other !== line && other.product_id === product.id);
  }

  onExtraProductChange(line: InventoryLine, productId: string): void {
    line.product_id = productId;
    const product = this.getProduct(productId);
    line.quantity = this.modalType === 'INITIAL_ENTRY' && product ? Number(product.stock) : null;
  }

  openProductEntry(product: IProductModel): void {
    if (this.submittingEntry || this.confirmingEntry) return;
    this.entrySuccess = '';
    this.entryConfirmation = [];
    this.entryMovementId = null;
    this.modalProduct = product;
    this.modalDate = this.todayDate();
    this.modalDescription = '';
    this.modalErrors = [];
    this.modalFetchError = '';
    this.modalExtraLines = [];
    this.prepareModalProduct(product);
    this.modalFetching = true;
    const requestId = ++this.modalRequestId;
    this.apiService.getProductById(product.id).subscribe({
      next: response => {
        if (requestId !== this.modalRequestId || this.modalProduct?.id !== product.id) return;
        this.modalFetching = false;
        if (!response?.success || !response.data) {
          this.modalFetchError = 'No se pudo consultar el producto actualizado. Cierra y vuelve a intentar.';
          return;
        }
        this.modalProduct = response.data;
        const index = this.products.findIndex(item => item.id === product.id);
        if (index >= 0) this.products[index] = response.data;
        this.prepareModalProduct(response.data);
      },
      error: () => {
        if (requestId !== this.modalRequestId || this.modalProduct?.id !== product.id) return;
        this.modalFetching = false;
        this.modalFetchError = 'No se pudo consultar el producto actualizado. Cierra y vuelve a intentar.';
      }
    });
  }

  closeProductEntry(): void {
    if (this.submittingEntry || this.confirmingEntry) return;
    this.modalRequestId++;
    this.modalProduct = null;
    this.modalErrors = [];
  }

  get modalCostUnavailable(): boolean {
    return !!this.modalProduct && Number(this.modalProduct.stock) > 0 && this.getCompanyCost(this.modalProduct) === null;
  }

  submitProductEntry(): void {
    if (!this.modalProduct || this.modalFetching || this.modalFetchError || this.submittingEntry || this.confirmingEntry) return;
    if (this.modalCostUnavailable) {
      this.modalErrors = ['El costo de empresa no está disponible. Se necesita este dato para determinar el tipo de entrada.'];
      return;
    }
    const lines = [this.modalLine, ...this.modalExtraLines];
    this.modalErrors = this.validateEntry(this.modalType, this.modalDate, this.modalDescription, lines);
    if (this.modalErrors.length) return;
    const command = this.createEntryCommand(this.modalType, this.modalDate, this.modalDescription, lines);
    this.confirmEntry(command);
  }

  private prepareModalProduct(product: IProductModel): void {
    const stock = Number(product.stock);
    const companyCost = this.getCompanyCost(product);
    this.modalType = stock > 0 && companyCost !== null && Number(companyCost) === 0
      ? 'INITIAL_ENTRY' : 'PURCHASE_ENTRY';
    this.modalLine = { ...this.emptyLine(), product_id: product.id, quantity: this.modalType === 'INITIAL_ENTRY' ? stock : null };
  }

  private createEntryCommand(type: InventoryEntryType, date: string, description: string, lines: InventoryLine[]): InventoryEntryCommand {
    return {
      type,
      movement_date: date || undefined,
      description: description.trim() || undefined,
      lines: lines.map(line => ({
        product_id: line.product_id,
        quantity: Number(line.quantity),
        company_unit_cost: Number(line.company_unit_cost),
        additional_cost: Number(line.additional_cost || 0)
      }))
    };
  }

  private confirmEntry(command: InventoryEntryCommand): void {
    const confirmation = command.lines.map(line => ({
      productTitle: this.getProduct(line.product_id)?.title || 'Producto',
      date: command.movement_date!,
      quantity: line.quantity,
      unitCost: line.company_unit_cost,
      type: command.type
    }));

    this.confirmingEntry = true;
    const isInitial = command.type === 'INITIAL_ENTRY';
    const details = command.lines.map(line => {
      const name = this.getProduct(line.product_id)?.title || 'Producto';
      return `${name}: ${line.quantity} unidades a ${this.formatSoles(line.company_unit_cost)} por unidad, costo adicional ${this.formatSoles(line.additional_cost)}`;
    }).join('; ');
    const description = `Descripción: ${command.description}. `;
    this.modal.confirm({
      nzTitle: isInitial ? 'Revisar stock inicial' : 'Revisar compra antes de aumentar stock',
      nzContent: isInitial
        ? `Fecha: ${this.formatEntryDate(command.movement_date!)}. ${description}${details}. El stock actual no se sumará de nuevo. ¿Confirmas el registro?`
        : `Fecha: ${this.formatEntryDate(command.movement_date!)}. ${description}${details}. Solo al confirmar se enviará la compra y el backend aumentará el stock. ¿Estás conforme?`,
      nzOkText: isInitial ? 'Sí, registrar stock inicial' : 'Sí, registrar compra y aumentar stock',
      nzCancelText: 'No, volver a revisar',
      nzOnOk: () => {
        this.confirmingEntry = false;
        this.registerEntry(command, confirmation);
      },
      nzOnCancel: () => { this.confirmingEntry = false; }
    });
  }

  private registerEntry(command: InventoryEntryCommand, confirmation: EntryConfirmationLine[]): void {
    if (this.submittingEntry) return;
    this.submittingEntry = true;
    this.reportService.registerEntry(command).subscribe({
      next: response => {
        this.submittingEntry = false;
        if (!response?.success) {
          this.modalErrors = this.apiErrors(response);
          return;
        }
        this.modalErrors = [];
        this.entrySuccess = command.type === 'INITIAL_ENTRY'
          ? 'Stock inicial documentado. El stock no se incrementó.'
          : 'Compra a proveedor registrada. Consultando el stock y el costo promedio actualizados.';
        this.entryConfirmation = confirmation;
        this.entryMovementId = response.data?.movement_id ?? null;
        this.modalProduct = null;
        if (command.movement_date) this.selectedPeriod = command.movement_date.slice(0, 7);
        this.loadProducts(command.lines.map(line => line.product_id));
        this.loadReport();
        if (this.inventorySection === 'movements') this.loadMovements(1);
      },
      error: error => {
        this.submittingEntry = false;
        this.modalErrors = this.apiErrors(error);
      }
    });
  }

  private refreshProductDetails(productIds: string[]): void {
    Array.from(new Set(productIds)).forEach(productId => {
      this.apiService.getProductById(productId).subscribe({
        next: response => {
          if (!response?.success || !response.data) return;
          const index = this.products.findIndex(product => product.id === productId);
          if (index >= 0) this.products[index] = response.data;
          else this.products = [...this.products, response.data];
        },
        error: () => { /* The product list refresh shows its own error if it fails. */ }
      });
    });
  }

  private validateEntry(type: InventoryEntryType, date: string, description: string, lines: InventoryLine[]): string[] {
    const errors: string[] = [];
    if (this.loadingProducts || this.productsError || !this.products.length) {
      errors.push('Carga el catálogo de productos antes de registrar una entrada.');
      return errors;
    }
    if (!description.trim()) errors.push('Ingresa una descripción de la entrada.');
    if (description.length > 500) errors.push('La descripción no puede superar 500 caracteres.');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Selecciona una fecha de movimiento válida.');
    const quantities = new Map<string, number>();
    lines.forEach((line, index) => {
      const label = `Fila ${index + 1}`;
      const product = this.getProduct(line.product_id);
      if (!product) errors.push(`${label}: selecciona un producto válido.`);
      if (product && type === 'PURCHASE_ENTRY' && !this.isPurchaseEligible(product)) {
        errors.push(`${label}: documenta primero el stock inicial o consulta el costo de empresa de ${product.title}.`);
      }
      if (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1) errors.push(`${label}: la cantidad debe ser un entero mayor que cero.`);
      for (const [field, value] of [['costo por unidad', line.company_unit_cost], ['costo adicional', line.additional_cost]] as const) {
        if (value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
          errors.push(`${label}: ${field} debe ser un importe válido con hasta dos decimales.`);
        }
      }
      if (type === 'INITIAL_ENTRY' && Number(line.company_unit_cost) <= 0) {
        errors.push(`${label}: ingresa un costo por unidad mayor que cero para documentar el stock inicial.`);
      }
      if (line.product_id && Number.isInteger(Number(line.quantity)) && Number(line.quantity) > 0) {
        quantities.set(line.product_id, (quantities.get(line.product_id) || 0) + Number(line.quantity));
      }
    });
    if (type === 'INITIAL_ENTRY') {
      quantities.forEach((quantity, productId) => {
        const product = this.getProduct(productId);
        if (product && quantity !== Number(product.stock)) {
          errors.push(`${product.title}: la entrada inicial debe sumar exactamente el stock actual (${product.stock}).`);
        }
        if (product && Number(product.stock) === 0) {
          errors.push(`${product.title}: un producto nuevo con stock cero se abastece mediante Compra a proveedor.`);
        }
      });
    }
    return errors;
  }

  private apiErrors(error: any): string[] {
    const body = error?.error ?? error;
    const details = body?.data;
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      const messages = Object.entries(details).reduce<string[]>((all, [field, value]) => {
        const fieldLabels: Record<string, string> = {
          product_id: 'Producto', quantity: 'Cantidad', company_unit_cost: 'Costo por unidad',
          additional_cost: 'Costo adicional', lot_code: 'Lote'
        };
        const match = /^lines\.(\d+)\.(.+)$/.exec(field);
        const label = match
          ? `Fila ${Number(match[1]) + 1}, ${fieldLabels[match[2]] || match[2]}`
          : field === 'lines' ? 'Productos' : field;
        return all.concat((Array.isArray(value) ? value : [value]).map(message => `${label}: ${String(message)}`));
      }, []);
      if (messages.length) return messages;
    }
    if (body?.message === 'Solo administradores.') return [body.message];
    return ['No se pudo registrar la entrada. Intenta nuevamente.'];
  }

  private emptyLine(): InventoryLine {
    return { product_id: '', quantity: null, company_unit_cost: null, additional_cost: 0 };
  }

  private todayDate(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  loadReport(): void {
    this.request?.unsubscribe();
    this.report = null;
    this.error = '';

    const match = /^(\d{4})-(\d{2})$/.exec(this.selectedPeriod);
    const year = match ? Number(match[1]) : NaN;
    const month = match ? Number(match[2]) : NaN;
    if (!match || year < 2000 || year > 2100 || month < 1 || month > 12) {
      this.loading = false;
      this.error = 'Selecciona un mes válido.';
      return;
    }

    this.loading = true;
    this.request = this.reportService.getMonthlyReport(year, month).subscribe({
      next: response => {
        this.loading = false;
        if (!response?.success) {
          this.error = 'No se pudo cargar el reporte. Intenta nuevamente.';
          return;
        }
        this.report = this.isReport(response.data) ? response.data : null;
        if (response.data && !this.report) {
          this.error = 'El reporte recibido tiene un formato incompleto.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar el reporte. Intenta nuevamente.';
      }
    });
  }

  formatSoles(value: Amount | null | undefined): string {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
      return '—';
    }
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency: 'PEN', minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(Number(value));
  }

  amountColor(value: Amount | null | undefined): string {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return 'amount-neutral';
    const amount = Number(value);
    return amount < 0 ? 'amount-negative' : amount > 0 ? 'amount-positive' : 'amount-neutral';
  }

  toggleFinanceHelp(help: 'after-commissions' | 'net-cash-flow'): void {
    this.financeHelpOpen = this.financeHelpOpen === help ? null : help;
  }

  get totalIncomeAndCommissions(): number | null {
    if (!this.report) return null;
    const sales = Number(this.report.sales_collected);
    const commissions = Number(this.report.commissions_generated?.total);
    if (!Number.isFinite(sales) || !Number.isFinite(commissions)) return null;
    return (Math.round(sales * 100) + Math.round(commissions * 100)) / 100;
  }

  downloadExcel(): void {
    if (!this.report || this.loading) return;
    const url = URL.createObjectURL(createFinanceIgWorkbook(this.report));
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzas-ig-${this.report.period}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private isReport(data: FinanceIgReport | null | undefined): data is FinanceIgReport {
    return !!data && data.currency === 'PEN' &&
      data.gross_public_sales != null && data.price_adjustment != null &&
      data.sales_collected != null && data.cost_of_sales != null &&
      data.gross_profit != null && data.profit_after_commissions != null &&
      data.merchandise_purchased != null && data.commissions_paid != null &&
      data.net_cash_flow != null &&
      data.commissions_generated?.total != null &&
      data.commissions_generated?.sponsorship != null &&
      data.commissions_generated?.residual != null &&
      data.commissions_generated?.infinity != null &&
      data.store?.sales != null && data.reactivations?.sales != null &&
      data.affiliation_packs?.sales != null;
  }
}
