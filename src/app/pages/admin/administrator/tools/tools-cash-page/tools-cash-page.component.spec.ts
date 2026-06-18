import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsCashPageComponent } from './tools-cash-page.component';

describe('ToolsCashPageComponent', () => {
  let component: ToolsCashPageComponent;
  let fixture: ComponentFixture<ToolsCashPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsCashPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsCashPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
