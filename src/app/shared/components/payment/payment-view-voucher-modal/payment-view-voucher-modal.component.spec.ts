import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentViewVoucherModalComponent } from './payment-view-voucher-modal.component';

describe('PaymentViewVoucherModalComponent', () => {
  let component: PaymentViewVoucherModalComponent;
  let fixture: ComponentFixture<PaymentViewVoucherModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentViewVoucherModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentViewVoucherModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
