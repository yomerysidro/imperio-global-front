import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ECONode, IECONode } from '@shared/interfaces/econode.type';

import { TreeViewComponent } from './tree-view.component';

describe('TreeViewComponent', () => {
  let component: TreeViewComponent;
  let fixture: ComponentFixture<TreeViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
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

  function layout(data: IECONode): ECONode[] {
    component.data = data;
    component.ngOnChanges({ data: new SimpleChange(undefined, data, true) });
    return component.nodes;
  }

  it('reserves disjoint space for sibling subtrees and connects each ordered child', () => {
    const node = (id: string, children: IECONode[] = []): IECONode => ({ data: { id }, children });
    const [root, first, firstLeft, firstRight, second, secondLeft, secondRight] = layout(
      node('DOSB', [
        node('WAdz', [node('a'), node('b')]),
        node('next', [node('c'), node('d')])
      ])
    );
    const center = (item: ECONode) => item.XPosition + item.w / 2;

    expect(root.XPosition).toBe(0);
    expect(root.YPosition).toBe(0);
    expect(first.XPosition).toBe(0);
    expect(first.YPosition).toBe(second.YPosition);
    expect(firstLeft.XPosition).toBe(0);
    expect(firstRight.XPosition).toBeGreaterThan(firstLeft.XPosition + firstLeft.w);
    expect(secondLeft.XPosition).toBeGreaterThan(firstRight.XPosition + firstRight.w);
    expect(center(second)).toBe((center(secondLeft) + center(secondRight)) / 2);
    expect(root.nodeChildren).toEqual([first, second]);
    expect(first.nodeChildren).toEqual([firstLeft, firstRight]);

    for (const parent of [root, first, second]) {
      const [firstChild, lastChild] = parent.nodeChildren;
      const railY = firstChild.YPosition - 8;
      expect(parent.branchPath).toBe(
        `M${center(parent)} ${parent.YPosition + parent.h} V${railY} M${center(firstChild)} ${railY} H${center(lastChild)}`
      );
      parent.nodeChildren.forEach((child, index) => {
        expect(child.nodeParent).toBe(parent);
        expect(child.YPosition).toBeGreaterThan(parent.YPosition + parent.h);
        expect(parent.paths[index]).toBe(`M${center(child)} ${railY} V${child.YPosition}`);
      });
    }
  });

  it('keeps 3,000 direct affiliates in order and leaves the full width scrollable', () => {
    const children = Array.from({ length: 3000 }, (_, id) => ({ data: { id } }));
    const [root, ...directs] = layout({ data: { id: 'root' }, children });
    const last = directs[directs.length - 1];

    expect(root.paths.length).toBe(children.length);
    expect(root.branchPath).toMatch(new RegExp(`H${last.XPosition + last.w / 2}$`));
    expect(root.nodeChildren.map(child => child.data.id)).toEqual(children.map(child => child.data.id));
    expect(directs.every((child, index) => !index ||
      child.XPosition >= directs[index - 1].XPosition + directs[index - 1].w)).toBeTrue();
    expect(component.tree.width).toBe(last.XPosition + last.w);
  });

  it('keeps early siblings close when only the first branch extends to a wider generation', () => {
    const leaf = (id: string): IECONode => ({ data: { id } });
    const wide = Array.from({ length: 500 }, (_, index) => leaf(`deep-${index}`));
    const nodes = layout({
      data: { id: 'DOSB' },
      children: [{
        data: { id: 'WAdz' },
        children: [
          { data: { id: 'tNdV' }, children: [{ data: { id: 'QHmX' }, children: wide }] },
          { data: { id: 'second' }, children: [leaf('second-child')] },
          leaf('third')
        ]
      }, leaf('second-root-child')]
    });
    const [root, sponsor] = nodes;
    const [first, second, third] = sponsor.nodeChildren;
    const pitch = second.XPosition - first.XPosition;

    expect(root.XPosition).toBe(0);
    expect(sponsor.nodeParent).toBe(root);
    expect(root.nodeChildren[1].XPosition - sponsor.XPosition).toBe(pitch);
    expect(pitch).toBeLessThan(first.w * 1.25);
    expect(third.XPosition - second.XPosition).toBe(pitch);
    expect(second.nodeChildren[0].XPosition).toBe(second.XPosition);
    expect(second.branchPath).not.toContain('H');
    expect(third.branchPath).toBe('');
    expect(first.nodeChildren[0].nodeChildren.length).toBe(wide.length);

    const rows = new Map<number, ECONode[]>();
    for (const node of nodes) {
      const row = rows.get(node.YPosition) ?? [];
      row.push(node);
      rows.set(node.YPosition, row);
      expect(node.XPosition).toBeGreaterThanOrEqual(0);
    }
    for (const row of rows.values()) {
      for (let index = 1; index < row.length; index++) {
        expect(row[index].XPosition).toBeGreaterThan(row[index - 1].XPosition + row[index - 1].w);
      }
    }
  });
});
