import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of, Subject, throwError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { HttpService } from '@shared/services/http.service';
import { CommonLayout_ROUTES } from '@shared/routes/common-layout.routes';
import { ROUTES as SIDE_NAV_ROUTES } from '@shared/template/side-nav/side-nav-routes.config';
import { FinanceIgAdminGuard } from './finance-ig-admin.guard';
import { FinanceIgComponent } from './finance-ig.component';
import { FinanceIgReport, FinanceIgReportService } from './finance-ig-report.service';
import { createFinanceIgWorkbook } from './finance-ig-excel';
import { ProductFormModalComponent } from '../marketplace/product-form-modal/product-form-modal.component';

const report = {
  period: '2026-08', currency: 'PEN', gross_public_sales: '120.00', price_adjustment: '20.00',
  sales_collected: '100.00', cost_of_sales: '30.00', gross_profit: '70.00',
  commissions_generated: { sponsorship: '1.00', residual: '2.00', infinity: '3.00', total: '6.00' },
  profit_after_commissions: '64.00', merchandise_purchased: '10.00',
  commissions_paid: '5.00', net_cash_flow: '85.00',
  store: { sales: '100.00', cost_of_sales: '30.00', gross_profit: '70.00' },
  reactivations: { sales: '0.00', cost_of_sales: '0.00', gross_profit: '0.00' },
  affiliation_packs: { sales: '0.00', gross_profit_before_other_costs: '0.00' }
} as FinanceIgReport;

describe('Finanzas Imperio', () => {
  it('conecta la ruta y la entrada lateral a /admin/finance', () => {
    expect(CommonLayout_ROUTES.find(route => route.path === 'finance')?.loadChildren).toBeDefined();
    const menuItem = SIDE_NAV_ROUTES.find(item => item.path === '/admin/finance');
    expect(menuItem?.title).toBe('Finanzas Imperio');
    expect(menuItem?.submenu).toEqual([]);
  });

  it('envía year y month al endpoint mensual', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpService, FinanceIgReportService]
    });
    const service = TestBed.inject(FinanceIgReportService);
    const http = TestBed.inject(HttpTestingController);

    service.getMonthlyReport(2026, 8).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/api/v1/finance-ig/monthly-report'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('year')).toBe('2026');
    expect(request.request.params.get('month')).toBe('8');
    request.flush({ success: true, data: null, message: '' });
    http.verify();
  });

  it('consulta el detalle de packs para el período seleccionado', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [HttpService, FinanceIgReportService] });
    const service = TestBed.inject(FinanceIgReportService);
    const http = TestBed.inject(HttpTestingController);
    service.getAffiliationPackDetails(2026, 8).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/api/v1/finance-ig/affiliation-packs'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('year')).toBe('2026');
    expect(request.request.params.get('month')).toBe('8');
    request.flush({ success: true, data: { period: '2026-08', total: '0.00', items: [] }, message: '' });
    http.verify();
  });

  it('consulta el detalle de Tienda o Reactivaciones con el período y origen', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [HttpService, FinanceIgReportService] });
    const service = TestBed.inject(FinanceIgReportService);
    const http = TestBed.inject(HttpTestingController);
    service.getProductSalesDetails(2026, 8, 'reactivations').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/api/v1/finance-ig/product-sales-details'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('year')).toBe('2026');
    expect(request.request.params.get('month')).toBe('8');
    expect(request.request.params.get('source')).toBe('reactivations');
    request.flush({ success: true, data: { period: '2026-08', source: 'reactivations', orders: [] }, message: '' });
    http.verify();
  });

  it('concilia varios productos, total de compra y totales del card antes de mostrar el detalle', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['getProductSalesDetails']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    component.selectedPeriod = '2026-08';
    component.report = report;
    const order = {
      order_id: 'order-1', movement_id: 7, movement_type: 'SALE_EXIT' as const,
      date: '2026-08-12', buyer: 'Ana', sales: '100.00', cost_of_sales: '30.00', gross_profit: '70.00',
      items: [
        { product: 'Producto A', quantity: 1, sales: '40.00', cost_of_sales: '10.00', gross_profit: '30.00' },
        { product: 'Producto B', quantity: 2, sales: '60.00', cost_of_sales: '20.00', gross_profit: '40.00' }
      ]
    };
    service.getProductSalesDetails.and.returnValue(of({ success: true, data: { period: '2026-08', source: 'store', orders: [order] }, message: '' }));
    component.openProductSalesDetails('store');
    expect(service.getProductSalesDetails).toHaveBeenCalledWith(2026, 8, 'store');
    expect(component.productSalesOrders[0].items.length).toBe(2);
    expect(component.productSalesTotals).toEqual({ sales: 100, cost_of_sales: 30, gross_profit: 70 });

    const wrongCost = { ...order, items: [{ ...order.items[0], cost_of_sales: '11.00' }, order.items[1]] };
    service.getProductSalesDetails.and.returnValue(of({ success: true, data: { period: '2026-08', source: 'store', orders: [wrongCost] }, message: '' }));
    component.openProductSalesDetails('store');
    expect(component.productSalesOrders).toEqual([]);
    expect(component.productSalesError).toContain('inconsistentes');
  });

  it('muestra el detalle solo cuando sus importes concilian con el card', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['getAffiliationPackDetails']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    component.selectedPeriod = '2026-08';
    component.report = { ...report, affiliation_packs: { sales: '30.00', gross_profit_before_other_costs: '30.00' } };
    const items = [
      { date: '2026-08-10', buyer: 'Ana', pack: 'Inicial', amount: '10.00' },
      { date: '2026-08-11', buyer: 'Luis', pack: 'Premium', amount: '20.00' }
    ];
    service.getAffiliationPackDetails.and.returnValue(of({ success: true, data: { period: '2026-08', total: '30.00', items }, message: '' }));
    component.openAffiliationDetails();
    expect(service.getAffiliationPackDetails).toHaveBeenCalledWith(2026, 8);
    expect(component.affiliationTotal).toBe(30);
    expect(component.affiliationRows.length).toBe(2);
    expect(component.affiliationError).toBe('');

    service.getAffiliationPackDetails.and.returnValue(of({ success: true, data: { period: '2026-08', total: '29.00', items }, message: '' }));
    component.openAffiliationDetails();
    expect(component.affiliationRows).toEqual([]);
    expect(component.affiliationError).toContain('no coincide');
  });

  it('envía una entrada de inventario al endpoint protegido de IG', () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpService, FinanceIgReportService]
    });
    const service = TestBed.inject(FinanceIgReportService);
    const http = TestBed.inject(HttpTestingController);
    const command = { type: 'PURCHASE_ENTRY' as const, lines: [{
      product_id: 'product-1', quantity: 3, company_unit_cost: 10, additional_cost: 2
    }] };
    service.registerEntry(command).subscribe();
    const request = http.expectOne(req => req.url.endsWith('/api/v1/finance-ig/inventory/entry'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(command);
    expect(request.request.body.lines[0].expiration_at).toBeUndefined();
    request.flush({ success: true, data: { movement_id: 1 }, message: 'Entrada registrada.' });
    http.verify();
  });

  it('consulta movimientos paginados con periodo y dirección', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [HttpService, FinanceIgReportService] });
    const service = TestBed.inject(FinanceIgReportService);
    const http = TestBed.inject(HttpTestingController);
    service.getMovements(2026, 9, 2, 'exit').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/api/v1/finance-ig/inventory/movements'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('year')).toBe('2026');
    expect(request.request.params.get('month')).toBe('9');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('direction')).toBe('exit');
    request.flush({ success: true, data: { data: [], current_page: 2, last_page: 2, total: 0 }, message: '' });
    http.verify();
  });

  it('mantiene las tarjetas sin cifras anteriores si la API falla al cambiar de mes', () => {
    const responses: Subject<any>[] = [];
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['getMonthlyReport', 'getMovements']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    api.getProducts.and.returnValue(of({ success: true, data: [], message: '' }));
    service.getMovements.and.returnValue(of({ success: true, data: { data: [{
      id: 7, movement_type: 'PURCHASE_ENTRY', movement_date: '2026-08-12', description: 'Proveedor',
      direction: 'entry', total_quantity: 3, total_cost: '30.00', details: [{
        id: 8, product_id: 'product-1', product_title: 'Producto de prueba', quantity: 3,
        company_unit_cost: '10.00', additional_cost: '0.00', total_cost: '30.00', lot_code: 'L-1'
      }]
    }], current_page: 1, last_page: 1, total: 1 }, message: '' }));
    service.getMonthlyReport.and.callFake(() => {
      const response = new Subject<any>();
      responses.push(response);
      return response.asObservable();
    });
    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [FinanceIgComponent],
      providers: [
        { provide: FinanceIgReportService, useValue: service },
        { provide: ApiService, useValue: api },
        { provide: NzModalService, useValue: modal }
      ]
    });
    const fixture = TestBed.createComponent(FinanceIgComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading).toBeTrue();

    responses[0].next({ success: true, data: report });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingresos cobrados');
    expect(fixture.nativeElement.querySelector('.header-total strong').textContent.trim()).toMatch(/S\/\s*106\.00/);
    expect(fixture.nativeElement.querySelector('.header-total').textContent).toContain('Total de ingresos y comisiones generadas');
    expect(fixture.nativeElement.querySelector('.header-total').textContent).not.toContain('antes de costos y comisiones');
    expect(fixture.nativeElement.querySelector('.excel-report-card').disabled).toBeFalse();

    const input = fixture.nativeElement.querySelector('input[type="month"]') as HTMLInputElement;
    input.value = '2026-08';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(service.getMonthlyReport).toHaveBeenCalledWith(2026, 8);
    expect(fixture.componentInstance.report).toBeNull();
    responses[1].error({ message: 'Database error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el reporte');
    expect(fixture.nativeElement.textContent).toContain('Ingresos cobrados');
    expect(fixture.nativeElement.querySelector('.sales-card .card-total strong').textContent.trim()).toBe('—');
    expect(fixture.nativeElement.querySelector('.excel-report-card').disabled).toBeTrue();
    (fixture.nativeElement.querySelectorAll('.finance-tabs button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Varios productos o lotes');
    expect(fixture.nativeElement.querySelector('.bulk-toggle-button')).toBeNull();
    (fixture.nativeElement.querySelectorAll('.inventory-tabs button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Salidas automáticas');
    expect(fixture.nativeElement.textContent).toContain('Detalle disponible');
    expect(fixture.nativeElement.querySelector('.submit-entry-button')).toBeNull();
    (fixture.nativeElement.querySelectorAll('.inventory-tabs button')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(service.getMovements).toHaveBeenCalledWith(2026, 8, 1, undefined);
    expect(fixture.nativeElement.textContent).toContain('Producto de prueba');
    expect(fixture.nativeElement.textContent).toContain('Compra a proveedor');
    const direction = fixture.nativeElement.querySelector('.movement-filters select') as HTMLSelectElement;
    direction.value = 'exit';
    direction.dispatchEvent(new Event('change'));
    expect(service.getMovements).toHaveBeenCalledWith(2026, 8, 1, 'exit');
  });

  it('crea productos con precio público y stock cero', () => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['createProduct']);
    const messages = jasmine.createSpyObj('ModalService', ['success', 'error']);
    const modalRef = jasmine.createSpyObj('NzModalRef', ['close']);
    api.createProduct.and.returnValue(of({ success: true, data: {} as any, message: '' }));
    const component = new ProductFormModalComponent(null, new FormBuilder(), api, messages, modalRef);
    component.ngOnInit();
    component.form.patchValue({ title: 'Producto nuevo', price: 99.90, points: 10 });
    component.submit();
    const data = api.createProduct.calls.mostRecent().args[0];
    expect(data.get('price')).toBe('99.9');
    expect(data.get('stock')).toBe('0');
  });

  it('conserva el stock al editar otros datos de un producto', () => {
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['updateProduct']);
    const messages = jasmine.createSpyObj('ModalService', ['success', 'error']);
    const modalRef = jasmine.createSpyObj('NzModalRef', ['close']);
    api.updateProduct.and.returnValue(of({ success: true, data: {} as any, message: '' }));
    const product = { id: 'product-1', title: 'Producto', public_price: 50, price: 50, points: 10, stock: 8, state: false } as any;
    const component = new ProductFormModalComponent({ product }, new FormBuilder(), api, messages, modalRef);
    component.ngOnInit();
    component.form.patchValue({ price: 55 });
    component.submit();
    expect(api.updateProduct).toHaveBeenCalledWith('product-1', { price: 55 });
  });

  it('muestra el stock y costo promedio que devuelve la nueva consulta del producto', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['getMonthlyReport', 'registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts', 'getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    api.getProducts.and.returnValue(of({ success: true, data: [{ id: 'product-1', title: 'Producto', stock: 5 } as any], message: '' }));
    api.getProductById.and.returnValue(of({ success: true, data: { id: 'product-1', title: 'Producto', stock: 8, company_unit_cost: '11.25' } as any, message: '' }));
    const component = new FinanceIgComponent(service, api, modal);
    component.loadProducts(['product-1']);
    expect(api.getProductById).toHaveBeenCalledWith('product-1');
    expect(component.getProduct('product-1')?.stock).toBe(8);
    expect(component.getCompanyCost(component.getProduct('product-1'))).toBe('11.25');
  });

  it('abre la acción de la tabla y exige stock inicial si hay unidades con costo cero', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['getMonthlyReport']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts', 'getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const product = { id: 'product-1', title: 'Producto antiguo', stock: 5, company_unit_cost: '0.00', public_price: 80 } as any;
    api.getProducts.and.returnValue(of({ success: true, data: [product], message: '' }));
    api.getProductById.and.returnValue(of({ success: true, data: product, message: '' }));
    service.getMonthlyReport.and.returnValue(of({ success: true, data: report, message: '' }));
    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule], declarations: [FinanceIgComponent],
      providers: [
        { provide: FinanceIgReportService, useValue: service },
        { provide: ApiService, useValue: api },
        { provide: NzModalService, useValue: modal }
      ]
    });
    const fixture = TestBed.createComponent(FinanceIgComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('.finance-tabs button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const entryButton = fixture.nativeElement.querySelector('.row-entry-button') as HTMLButtonElement;
    expect(entryButton.textContent.trim()).toBe('');
    expect(entryButton.querySelector('i')).toBeTruthy();
    entryButton.click();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(api.getProductById).toHaveBeenCalledWith('product-1');
    expect(component.modalType).toBe('INITIAL_ENTRY');
    expect(component.modalLine.quantity).toBe(5);
    expect(fixture.nativeElement.querySelector('.entry-modal').textContent).toContain('Registrar stock inicial');
    expect(fixture.nativeElement.querySelector('.entry-modal').textContent).toMatch(/S\/\s*80\.00/);
    expect((fixture.nativeElement.querySelector('.entry-modal-fields input[type="number"]') as HTMLInputElement).readOnly).toBeTrue();
    expect(fixture.nativeElement.querySelector('.entry-modal').textContent).not.toContain('Vencimiento');
  });

  it('registra desde el modal según el stock y el costo de empresa y vuelve a consultar', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProducts', 'getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const product = { id: 'product-1', title: 'Producto', stock: 0, company_unit_cost: '0.00', public_price: 50 } as any;
    component.products = [product];
    api.getProductById.and.returnValue(of({ success: true, data: product, message: '' }));
    component.openProductEntry(product);
    component.modalDate = '2026-09-29';
    expect(component.modalType).toBe('PURCHASE_ENTRY');
    component.modalDescription = 'Compra proveedor';
    component.modalLine.quantity = 3;
    component.modalLine.company_unit_cost = 12.5;
    component.modalLine.additional_cost = 2;
    expect(component.entryPreviewTotal(component.modalLine)).toBe(39.5);
    service.registerEntry.and.returnValue(of({ success: true, data: { movement_id: 3 }, message: '' }));
    spyOn(component, 'loadProducts');
    spyOn(component, 'loadReport');
    component.submitProductEntry();
    (modal.confirm.calls.mostRecent().args[0].nzOnOk as Function)();
    expect(service.registerEntry).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'PURCHASE_ENTRY', movement_date: '2026-09-29',
      lines: [jasmine.objectContaining({ product_id: 'product-1', quantity: 3, company_unit_cost: 12.5, additional_cost: 2 })]
    }));
    expect(component.modalProduct).toBeNull();
    expect(component.entryConfirmation[0]).toEqual({ productTitle: 'Producto', date: '2026-09-29', quantity: 3, unitCost: 12.5, type: 'PURCHASE_ENTRY' });
    expect(component.loadProducts).toHaveBeenCalledWith(['product-1']);
    expect(component.loadReport).toHaveBeenCalled();
  });

  it('agrupa varios productos en un solo movimiento desde el lápiz', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const first = { id: 'product-1', title: 'Primero', stock: 0, company_unit_cost: '0.00' } as any;
    const second = { id: 'product-2', title: 'Segundo', stock: 4, company_unit_cost: '5.00' } as any;
    component.products = [first, second];
    api.getProductById.and.returnValue(of({ success: true, data: first, message: '' }));
    component.openProductEntry(first);
    component.modalDate = '2026-09-29';
    component.modalDescription = 'Compra en grupo';
    component.modalLine.quantity = 3;
    component.modalLine.company_unit_cost = 10;
    component.addModalProduct();
    component.modalExtraLines[0].product_id = 'product-2';
    component.modalExtraLines[0].quantity = 2;
    component.modalExtraLines[0].company_unit_cost = 11;
    expect(component.modalGroupPreviewTotal).toBe(52);
    service.registerEntry.and.returnValue(of({ success: true, data: { movement_id: 8 }, message: '' }));
    spyOn(component, 'loadProducts');
    spyOn(component, 'loadReport');
    component.submitProductEntry();
    expect(service.registerEntry).not.toHaveBeenCalled();
    (modal.confirm.calls.mostRecent().args[0].nzOnOk as Function)();
    expect(service.registerEntry).toHaveBeenCalledTimes(1);
    expect(service.registerEntry).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'PURCHASE_ENTRY', lines: [
        jasmine.objectContaining({ product_id: 'product-1', quantity: 3 }),
        jasmine.objectContaining({ product_id: 'product-2', quantity: 2 })
      ]
    }));
    expect(component.loadProducts).toHaveBeenCalledWith(['product-1', 'product-2']);
    expect(component.entryConfirmation.length).toBe(2);
  });

  it('puede documentar un grupo de stock inicial sin sumar unidades', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const first = { id: 'product-1', title: 'Primero', stock: 5, company_unit_cost: '0.00' } as any;
    const second = { id: 'product-2', title: 'Segundo', stock: 3, company_unit_cost: '0.00' } as any;
    component.products = [first, second];
    api.getProductById.and.returnValue(of({ success: true, data: first, message: '' }));
    component.openProductEntry(first);
    component.modalDate = '2026-09-29';
    component.modalDescription = 'Inventario anterior';
    component.modalLine.company_unit_cost = 8;
    component.addModalProduct();
    component.onExtraProductChange(component.modalExtraLines[0], 'product-2');
    expect(component.modalExtraLines[0].quantity).toBe(3);
    component.modalExtraLines[0].company_unit_cost = 9;
    service.registerEntry.and.returnValue(of({ success: true, data: { movement_id: 9 }, message: '' }));
    spyOn(component, 'loadProducts');
    spyOn(component, 'loadReport');
    component.submitProductEntry();
    (modal.confirm.calls.mostRecent().args[0].nzOnOk as Function)();
    expect(service.registerEntry).toHaveBeenCalledTimes(1);
    expect(service.registerEntry).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'INITIAL_ENTRY', lines: [
        jasmine.objectContaining({ product_id: 'product-1', quantity: 5 }),
        jasmine.objectContaining({ product_id: 'product-2', quantity: 3 })
      ]
    }));
  });

  it('revisa la entrada antes de enviarla y cancelar no registra nada', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const product = { id: 'product-1', title: 'Producto', stock: 2, company_unit_cost: '5.00' } as any;
    component.products = [product];
    api.getProductById.and.returnValue(of({ success: true, data: product, message: '' }));
    component.openProductEntry(product);
    component.modalDate = '2026-09-29';
    component.modalLine.quantity = 4;
    component.modalDescription = 'Compra proveedor';
    component.modalLine.company_unit_cost = 10;
    component.modalLine.additional_cost = 3;
    component.submitProductEntry();
    const options = modal.confirm.calls.mostRecent().args[0];
    expect(options.nzContent as string).toContain('Producto: 4 unidades');
    expect(options.nzContent as string).toContain('costo adicional');
    expect(options.nzOkText).toContain('Sí, registrar');
    expect(service.registerEntry).not.toHaveBeenCalled();
    (options.nzOnCancel as Function)();
    expect(service.registerEntry).not.toHaveBeenCalled();
    expect(component.confirmingEntry).toBeFalse();
  });

  it('exige descripción y costo adicional antes de confirmar la entrada individual', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const product = { id: 'product-1', title: 'Nuevo', stock: 0, company_unit_cost: '0.00' } as any;
    component.products = [product];
    api.getProductById.and.returnValue(of({ success: true, data: product, message: '' }));
    component.openProductEntry(product);
    component.modalDate = '2026-09-29';
    component.modalLine.quantity = 2;
    component.modalLine.company_unit_cost = 10;
    component.modalLine.additional_cost = null;
    component.submitProductEntry();
    expect(component.modalErrors.join(' ')).toContain('descripción');
    expect(component.modalErrors.join(' ')).toContain('costo adicional');
    expect(modal.confirm).not.toHaveBeenCalled();
  });

  it('no adivina la operación cuando falta el costo de empresa de un producto con stock', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const product = { id: 'product-1', title: 'Producto', stock: 5 } as any;
    component.products = [product];
    api.getProductById.and.returnValue(of({ success: true, data: product, message: '' }));
    component.openProductEntry(product);
    expect(component.modalCostUnavailable).toBeTrue();
    component.submitProductEntry();
    expect(modal.confirm).not.toHaveBeenCalled();
  });

  it('envía INITIAL_ENTRY desde el modal y permite compra con costo ya registrado', () => {
    const service = jasmine.createSpyObj<FinanceIgReportService>('FinanceIgReportService', ['registerEntry']);
    const api = jasmine.createSpyObj<ApiService>('ApiService', ['getProductById']);
    const modal = jasmine.createSpyObj<NzModalService>('NzModalService', ['confirm']);
    const component = new FinanceIgComponent(service, api, modal);
    const oldProduct = { id: 'product-1', title: 'Antiguo', stock: 5, company_unit_cost: '0.00' } as any;
    component.products = [oldProduct];
    service.registerEntry.and.returnValue(of({ success: true, data: { movement_id: 4 }, message: '' }));
    spyOn(component, 'loadProducts');
    spyOn(component, 'loadReport');
    api.getProductById.and.returnValue(of({ success: true, data: oldProduct, message: '' }));
    component.openProductEntry(oldProduct);
    component.modalDate = '2026-09-29';
    component.modalDescription = 'Stock anterior';
    component.modalLine.company_unit_cost = 0;
    component.submitProductEntry();
    expect(component.modalErrors.join(' ')).toContain('mayor que cero');
    expect(modal.confirm).not.toHaveBeenCalled();
    component.modalLine.company_unit_cost = 8;
    component.submitProductEntry();
    (modal.confirm.calls.mostRecent().args[0].nzOnOk as Function)();
    expect(service.registerEntry).toHaveBeenCalledWith(jasmine.objectContaining({
      type: 'INITIAL_ENTRY', lines: [jasmine.objectContaining({ quantity: 5, company_unit_cost: 8 })]
    }));
    component.closeProductEntry();

    const stockedProduct = { ...oldProduct, company_unit_cost: '8.00' };
    component.products = [stockedProduct];
    api.getProductById.and.returnValue(of({ success: true, data: stockedProduct, message: '' }));
    component.openProductEntry(stockedProduct);
    expect(component.modalType).toBe('PURCHASE_ENTRY');
    expect(component.modalLine.quantity).toBeNull();
  });

  it('crea un XLSX con los importes recibidos del reporte', async () => {
    const blob = createFinanceIgWorkbook(report);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([80, 75, 3, 4]);
    const contents = new TextDecoder().decode(bytes);
    expect(contents).toContain('xl/worksheets/sheet1.xml');
    expect(contents).toContain('<v>100</v>');
    expect(contents).toContain('Resultado después de comisiones');
  });

  it('abre de inmediato para administradores e impide navegar a otros usuarios', () => {
    let currentUser = { admin: true };
    const authentication = { get currentUserValue() { return currentUser; } } as AuthenticationService;
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [FinanceIgAdminGuard, { provide: AuthenticationService, useValue: authentication }]
    });
    const guard = TestBed.inject(FinanceIgAdminGuard);
    const router = TestBed.inject(Router);
    expect(guard.canActivate()).toBeTrue();
    currentUser = { admin: false };
    expect(guard.canActivate()).toEqual(router.parseUrl('/admin/profile'));
  });
});
