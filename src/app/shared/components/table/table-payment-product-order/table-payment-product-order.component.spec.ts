import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablePaymentProductOrderComponent } from './table-payment-product-order.component';

describe('TablePaymentProductOrderComponent', () => {
  let component: TablePaymentProductOrderComponent;
  let fixture: ComponentFixture<TablePaymentProductOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TablePaymentProductOrderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TablePaymentProductOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
