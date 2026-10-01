import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from '@shared/services/http.service';
import { IResponse } from '@shared/services/interfaces/response.interface';

export type Amount = number | string;

export interface FinanceIgReport {
  period: string;
  currency: string;
  gross_public_sales: Amount;
  price_adjustment: Amount;
  sales_collected: Amount;
  cost_of_sales: Amount;
  gross_profit: Amount;
  commissions_generated: {
    sponsorship: Amount;
    residual: Amount;
    infinity: Amount;
    total: Amount;
  };
  profit_after_commissions: Amount;
  store: { sales: Amount; cost_of_sales: Amount; gross_profit: Amount };
  reactivations: { sales: Amount; cost_of_sales: Amount; gross_profit: Amount };
  affiliation_packs: { sales: Amount; gross_profit_before_other_costs: Amount };
  merchandise_purchased: Amount;
  commissions_paid: Amount;
  net_cash_flow: Amount;
}

export interface AffiliationPackDetail {
  date: string;
  buyer: string;
  pack: string;
  amount: Amount;
}

export interface AffiliationPackDetails {
  period: string;
  total: Amount;
  items: AffiliationPackDetail[];
}

export type ProductSalesSource = 'store' | 'reactivations';

export interface ProductSaleLine {
  product: string;
  quantity: number;
  sales: Amount;
  cost_of_sales: Amount;
  gross_profit: Amount;
}

export interface ProductSaleOrder {
  order_id: string;
  movement_id: number;
  movement_type: 'SALE_EXIT' | 'SALE_CANCELLATION';
  date: string;
  buyer: string;
  sales: Amount;
  cost_of_sales: Amount;
  gross_profit: Amount;
  items: ProductSaleLine[];
}

export interface ProductSalesDetails {
  period: string;
  source: ProductSalesSource;
  orders: ProductSaleOrder[];
}

export interface InventoryEntryCommand {
  type: 'INITIAL_ENTRY' | 'PURCHASE_ENTRY';
  movement_date?: string;
  description?: string;
  lines: Array<{
    product_id: string;
    quantity: number;
    company_unit_cost: number;
    additional_cost: number;
    lot_code?: string;
  }>;
}

export interface InventoryMovementDetail {
  id: number;
  product_id: string;
  product_title: string;
  quantity: number;
  company_unit_cost: Amount;
  additional_cost: Amount;
  total_cost: Amount;
  lot_code: string | null;
}

export interface InventoryMovement {
  id: number;
  movement_type: string;
  movement_date: string;
  description: string | null;
  direction: 'entry' | 'exit';
  total_quantity: number;
  total_cost: Amount;
  details: InventoryMovementDetail[];
}

export interface InventoryMovementPage {
  data: InventoryMovement[];
  current_page: number;
  last_page: number;
  total: number;
}

@Injectable()
export class FinanceIgReportService {
  constructor(private httpService: HttpService) {}

  getMonthlyReport(year: number, month: number): Observable<IResponse<FinanceIgReport>> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('month', String(month));

    return this.httpService.get<IResponse<FinanceIgReport>>(
      '/finance-ig/monthly-report',
      { params }
    );
  }

  getAffiliationPackDetails(year: number, month: number): Observable<IResponse<AffiliationPackDetails>> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('month', String(month));
    return this.httpService.get<IResponse<AffiliationPackDetails>>('/finance-ig/affiliation-packs', { params });
  }

  getProductSalesDetails(year: number, month: number, source: ProductSalesSource): Observable<IResponse<ProductSalesDetails>> {
    const params = new HttpParams()
      .set('year', String(year))
      .set('month', String(month))
      .set('source', source);
    return this.httpService.get<IResponse<ProductSalesDetails>>('/finance-ig/product-sales-details', { params });
  }

  registerEntry(command: InventoryEntryCommand): Observable<IResponse<{ movement_id: number }>> {
    return this.httpService.postWithHttpError<IResponse<{ movement_id: number }>>(
      '/finance-ig/inventory/entry', command
    );
  }

  getMovements(year: number, month: number, page = 1, direction?: 'entry' | 'exit'): Observable<IResponse<InventoryMovementPage>> {
    let params = new HttpParams()
      .set('year', String(year))
      .set('month', String(month))
      .set('page', String(page));
    if (direction) params = params.set('direction', direction);
    return this.httpService.get<IResponse<InventoryMovementPage>>('/finance-ig/inventory/movements', { params });
  }
}
