import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentReservationModalComponent } from './payment-reservation-modal.component';

describe('PaymentReservationModalComponent', () => {
  let component: PaymentReservationModalComponent;
  let fixture: ComponentFixture<PaymentReservationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentReservationModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentReservationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
