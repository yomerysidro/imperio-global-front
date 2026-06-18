import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembershipPlanPageComponent } from './membership-plan-page.component';

describe('MembershipPlanPageComponent', () => {
  let component: MembershipPlanPageComponent;
  let fixture: ComponentFixture<MembershipPlanPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MembershipPlanPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembershipPlanPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
