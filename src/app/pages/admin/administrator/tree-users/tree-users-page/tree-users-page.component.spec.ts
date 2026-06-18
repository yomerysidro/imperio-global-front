import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreeUsersPageComponent } from './tree-users-page.component';

describe('TreeUsersPageComponent', () => {
  let component: TreeUsersPageComponent;
  let fixture: ComponentFixture<TreeUsersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TreeUsersPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeUsersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy(); 
  });
});