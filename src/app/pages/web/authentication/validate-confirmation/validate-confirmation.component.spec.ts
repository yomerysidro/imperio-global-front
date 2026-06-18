import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateConfirmationComponent } from './validate-confirmation.component';

describe('ValidateConfirmationComponent', () => {
  let component: ValidateConfirmationComponent;
  let fixture: ComponentFixture<ValidateConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidateConfirmationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidateConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
