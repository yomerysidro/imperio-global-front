import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
describe('AppComponent', () => {
 beforeEach(async () => { await TestBed.configureTestingModule({ declarations: [AppComponent] }).overrideComponent(AppComponent, { set: { template: '' } }).compileComponents(); });
 it('creates the application shell', () => expect(TestBed.createComponent(AppComponent).componentInstance.isCollapsed).toBeFalse());
});
