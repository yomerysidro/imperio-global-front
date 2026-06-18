import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTreeDetailComponent } from './user-tree-detail.component';

describe('UserTreeDetailComponent', () => {
  let component: UserTreeDetailComponent;
  let fixture: ComponentFixture<UserTreeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserTreeDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTreeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
