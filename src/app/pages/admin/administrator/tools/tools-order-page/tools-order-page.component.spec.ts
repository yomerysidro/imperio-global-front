import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsOrderPageComponent } from './tools-order-page.component';

describe('ToolsOrderPageComponent', () => {
  let component: ToolsOrderPageComponent;
  let fixture: ComponentFixture<ToolsOrderPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolsOrderPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsOrderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
