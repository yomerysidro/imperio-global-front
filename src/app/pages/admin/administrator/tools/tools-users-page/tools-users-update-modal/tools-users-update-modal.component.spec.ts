import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsUsersUpdateModalComponent } from './tools-users-update-modal.component';

describe('ToolsUsersUpdateModalComponent', () => {
  let component: ToolsUsersUpdateModalComponent;
  let fixture: ComponentFixture<ToolsUsersUpdateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsUsersUpdateModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsUsersUpdateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
