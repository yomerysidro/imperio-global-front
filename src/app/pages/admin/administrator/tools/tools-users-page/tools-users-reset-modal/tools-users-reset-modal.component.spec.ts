import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsUsersResetModalComponent } from './tools-users-reset-modal.component';

describe('ToolsUsersResetModalComponent', () => {
  let component: ToolsUsersResetModalComponent;
  let fixture: ComponentFixture<ToolsUsersResetModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsUsersResetModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsUsersResetModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
