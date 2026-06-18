import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsUsersSponsorModalComponent } from './tools-users-sponsor-modal.component';

describe('ToolsUsersSponsorModalComponent', () => {
  let component: ToolsUsersSponsorModalComponent;
  let fixture: ComponentFixture<ToolsUsersSponsorModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsUsersSponsorModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsUsersSponsorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
