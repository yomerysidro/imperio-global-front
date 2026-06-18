import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentProductsModalComponent } from './payment-products-modal.component';

describe('PaymentProductsModalComponent', () => {
  let component: PaymentProductsModalComponent;
  let fixture: ComponentFixture<PaymentProductsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentProductsModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentProductsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
