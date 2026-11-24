import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ApiService } from '@shared/services/api.service';
import { ModalService } from '@shared/utilities/modal-services';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';

import { MembershipPlanPageComponent } from './membership-plan-page.component';

describe('MembershipPlanPageComponent', () => {
  it('renders the starter kit image and points without opening payment', async () => {
    const kit = {
      id: 'kit',
      title: 'Kit de Inicio',
      price: '50.00',
      points: 0,
      state: true,
      image: 12,
      file: { path: 'files/packs/kit-inicio-original.png' },
    };
    const payment = jasmine.createSpyObj('NzModalService', ['create']);

    await TestBed.configureTestingModule({
      declarations: [MembershipPlanPageComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ApiService, useValue: {
          getAuthenticationUser: () => of({ data: {} }),
          getPlansSearch: () => of({ data: [kit] }),
        } },
        { provide: NzModalService, useValue: payment },
        { provide: ModalService, useValue: {} },
        { provide: Router, useValue: {} },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MembershipPlanPageComponent);
    fixture.detectChanges();
    const card: HTMLElement = fixture.nativeElement.querySelector('.plan-card');
    expect(card.textContent).toContain('Kit de Inicio');
    expect(card.textContent).toContain('0 pts');
    expect(card.querySelector('img')?.getAttribute('src'))
      .toBe(fixture.componentInstance.env.hostUrl + '/storage/' + kit.file.path);
    expect(card.querySelector('.buy-button')).toBeNull();
    fixture.componentInstance.onPaymentPlan(fixture.componentInstance.planList[0]);
    expect(payment.create).not.toHaveBeenCalled();
  });
});
