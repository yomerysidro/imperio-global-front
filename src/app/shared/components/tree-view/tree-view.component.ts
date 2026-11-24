import { Component, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { ECONode, ECOTree } from '@shared/interfaces/econode.type';

interface SubtreeContour {
  // The last entry is the root's generation. Entries can be reused by the parent.
  rows: { left: number; right: number }[];
  offset: number;
  leftmost: number;
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnChanges {

  @Input() template: TemplateRef<any>;
  @Input() data: any;
  @Input() nodeHeight?: (node: ECONode) => number;

  private readonly levelGap = 16;

  tree:ECOTree = new ECOTree();

  readonly trackNode = (_index: number, node: ECONode) => node.data?.id ?? node.id;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.data || !this.data) return;

    this.tree = new ECOTree();
    this.addNodes(this.tree, this.data);
    for (const node of this.tree.nDatabaseNodes) {
      node.h = this.nodeHeight?.(node) ?? node.h;
    }
    this.layoutTree();
    for (const node of this.tree.nDatabaseNodes) {
      const children = node.nodeChildren;
      if (!children.length) continue;

      const first = children[0];
      const last = children[children.length - 1];
      const railY = first.YPosition - this.levelGap / 2;
      const parentX = node.XPosition + node.w / 2;
      const firstX = first.XPosition + first.w / 2;
      const lastX = last.XPosition + last.w / 2;
      node.branchPath = `M${parentX} ${node.YPosition + node.h} V${railY}`;
      if (firstX !== lastX) node.branchPath += ` M${firstX} ${railY} H${lastX}`;
      node.paths = children.map(child => `M${child.XPosition + child.w / 2} ${railY} V${child.YPosition}`);
    }
  }

  private layoutTree(): void {
    const nodes: ECONode[] = this.tree.nDatabaseNodes;
    const siblingGap = 16;
    const contours = new Map<ECONode, SubtreeContour>();
    const childOffsets = new Map<ECONode, number>();
    const parentCenters = new Map<ECONode, number>();
    const leadingBranch = new Set<ECONode>();
    for (let node = nodes[0]; node; node = node.nodeChildren[0]) {
      leadingBranch.add(node);
    }

    // Reverse preorder measures each subtree before placing it alongside its siblings.
    for (let index = nodes.length - 1; index >= 0; index--) {
      const node = nodes[index];
      let forest: SubtreeContour | undefined;
      let lastChildX = 0;
      for (const child of node.nodeChildren) {
        const contour = contours.get(child);
        lastChildX = forest ? this.separateContours(forest, contour, siblingGap) : 0;
        childOffsets.set(child, lastChildX);
        forest = forest ? this.mergeContours(forest, contour, lastChildX) : contour;
        contours.delete(child);
      }

      // Center small groups while keeping a parent close to the start of a wide branch.
      const center = leadingBranch.has(node) ? 0 : Math.min(lastChildX / 2, (node.w + siblingGap) / 2);
      parentCenters.set(node, center);
      const contour = forest ?? { rows: [], offset: 0, leftmost: center - node.w / 2 };
      const left = center - node.w / 2;
      contour.rows.push({ left: left - contour.offset, right: center + node.w / 2 - contour.offset });
      contour.leftmost = Math.min(contour.leftmost, left) - center;
      contour.offset -= center;
      contours.set(node, contour);
    }

    const depths = new Map<ECONode, number>();
    const generationHeights: number[] = [];
    const leftmost = contours.get(nodes[0])?.leftmost ?? 0;
    for (const node of nodes) {
      const parentDepth = depths.get(node.nodeParent);
      const depth = parentDepth === undefined ? 0 : parentDepth + 1;
      depths.set(node, depth);
      generationHeights[depth] = Math.max(generationHeights[depth] ?? 0, node.h);
    }
    const generationTops: number[] = [];
    let top = 0;
    for (const height of generationHeights) {
      generationTops.push(top);
      top += height + this.levelGap;
    }

    const centers = new Map<ECONode, number>();
    for (const node of nodes) {
      const parentX = centers.get(node.nodeParent);
      const center = parentX === undefined
        ? -leftmost
        : parentX + childOffsets.get(node) - parentCenters.get(node.nodeParent);
      centers.set(node, center);
      node.XPosition = center - node.w / 2;
      node.YPosition = generationTops[depths.get(node)];
      this.tree.width = Math.max(this.tree.width, node.XPosition + node.w);
      this.tree.height = Math.max(this.tree.height, node.YPosition + node.h);
    }
  }

  private separateContours(left: SubtreeContour, right: SubtreeContour, gap: number): number {
    // Keep overhanging descendants within the start of their sibling group.
    let distance = left.leftmost - right.leftmost;
    const sharedRows = Math.min(left.rows.length, right.rows.length);
    for (let depth = 1; depth <= sharedRows; depth++) {
      const leftEdge = left.rows[left.rows.length - depth].right + left.offset;
      const rightEdge = right.rows[right.rows.length - depth].left + right.offset;
      distance = Math.max(distance, leftEdge + gap - rightEdge);
    }
    return distance;
  }

  private mergeContours(left: SubtreeContour, right: SubtreeContour, distance: number): SubtreeContour {
    right.offset += distance;
    right.leftmost += distance;
    // Reuse the deeper outline so merging only visits rows shared by both subtrees.
    const result = left.rows.length >= right.rows.length ? left : right;
    const other = result === left ? right : left;
    const offset = other.offset - result.offset;
    for (let depth = 1; depth <= other.rows.length; depth++) {
      const row = result.rows[result.rows.length - depth];
      const next = other.rows[other.rows.length - depth];
      row.left = Math.min(row.left, next.left + offset);
      row.right = Math.max(row.right, next.right + offset);
    }
    result.leftmost = Math.min(result.leftmost, other.leftmost);
    return result;
  }

  get nodes(){
    return this.tree.nDatabaseNodes
  }

  getChildren(node:ECONode,nodes:ECONode[]=[])
  {
     const children=node.nodeChildren;
     if (children && children.length){
        nodes=[...nodes,...children]
        children.forEach(x=>{
          nodes=this.getChildren(x,nodes)
        })
     }
     return nodes
  }
  getParent(node:ECONode,nodes:ECONode[]=[])
  {
     if (node.nodeParent){
        nodes=[...nodes,node.nodeParent]
        nodes=this.getParent(node.nodeParent,nodes)
     }
     return nodes
  }

  getSlibingNodes(node:ECONode){
     return [...this.getParent(node),...this.getChildren(node)]
  }

  private addNodes(tree:ECOTree,node:any,parent:any=null)
  {
    parent=parent || {id:-1,width:88,height:104,color:null,background:null,linkColor:null}
    node.width=node.width || parent.width
    node.height=node.height || parent.height
    node.color=node.color || parent.color
    node.background='transparent'
    node.linkColor= 'black'
    node.id=tree.nDatabaseNodes.length
      tree.add(node.id,parent.id,node.title, node.width, node.height, node.color, node.background, node.linkColor, node.data,node.selected,node.active)
      if (node.children)
      {
      node.children.forEach((x:any)=>{
        this.addNodes(tree,x,node)
      })
      }
  }


}
