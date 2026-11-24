import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { TreeViewComponent } from './tree-view.component';

describe('TreeViewComponent', () => {
  let component: TreeViewComponent;
  let fixture: ComponentFixture<TreeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [ TreeViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps offscreen nodes in the layout and navigates to them without rendering all nodes', fakeAsync(() => {
    const viewport = document.createElement('div');
    spyOn(viewport, 'getBoundingClientRect').and.returnValue(new DOMRect(0, 0, 240, 300));
    const scrollTo = spyOn(viewport, 'scrollTo');
    fixture.componentRef.setInput('viewport', viewport);
    fixture.componentRef.setInput('data', {
      data: { id: 'root' },
      children: Array.from({ length: 30 }, (_, index) => ({ data: { id: `member-${index}` } }))
    });
    fixture.detectChanges();
    tick(16);
    fixture.detectChanges();

    expect(component.nodes.length).toBe(31);
    expect(component.visibleNodes.length).toBeLessThan(31);
    const offscreen = component.nodes.find(node => !component.visibleNodes.includes(node));
    expect(offscreen).toBeDefined();
    component.scrollToNode(offscreen.data.id);
    expect(scrollTo.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ behavior: 'smooth' }));
  }));
});
