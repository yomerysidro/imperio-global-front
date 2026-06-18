import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsUsersPageComponent } from './tools-users-page.component';

describe('ToolsUsersPageComponent', () => {
  let component: ToolsUsersPageComponent;
  let fixture: ComponentFixture<ToolsUsersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsUsersPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsUsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
