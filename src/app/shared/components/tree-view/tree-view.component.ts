import { Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { ECONode, ECOTree } from '@shared/interfaces/econode.type';

interface TreeLink {
  node: ECONode;
  child: ECONode;
  path: string;
}

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnChanges, OnDestroy {

  @Input() template: TemplateRef<any>;
  @Input() data: any;
  @Input() viewport?: HTMLElement;
  @Input() zoom = 1;
  @ViewChild('origin') origin?: ElementRef<HTMLElement>;

  visibleNodes: ECONode[] = [];
  visibleLinks: TreeLink[] = [];
  private links: TreeLink[] = [];
  private nodesByCode = new Map<string, ECONode>();
  private observedViewport?: HTMLElement;
  private resizeObserver?: ResizeObserver;
  private renderFrame?: number;

  tree:ECOTree = new ECOTree();

  constructor(private zone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data) {
      this.tree = new ECOTree();
      this.nodesByCode.clear();
      if (this.data) {
        this.addNodes(this.tree, this.data);
        this.tree.UpdateTree();
      }
      this.links = [];
      for (const node of this.nodes) {
        const paths = node._drawChildrenLinks(this.tree);
        paths.forEach((path: string, index: number) => {
          this.links.push({ node, child: node.nodeChildren[index], path });
        });
      }
      this.visibleNodes = this.viewport ? this.nodes.slice(0, 1) : this.nodes;
      this.visibleLinks = this.viewport ? [] : this.links;
    }

    if (changes.viewport) this.observeViewport();
    this.queueVisibleUpdate();
  }

  ngOnDestroy(): void {
    this.stopObserving();
    if (this.renderFrame !== undefined) cancelAnimationFrame(this.renderFrame);
  }

  private observeViewport(): void {
    this.stopObserving();
    const viewport = this.viewport;
    if (!viewport) {
      this.visibleNodes = this.nodes;
      this.visibleLinks = this.links;
      return;
    }
    this.observedViewport = viewport;
    this.zone.runOutsideAngular(() => {
      viewport.addEventListener('scroll', this.queueVisibleUpdate, { passive: true });
      viewport.addEventListener('transitionend', this.queueVisibleUpdate);
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.queueVisibleUpdate);
        this.resizeObserver.observe(viewport);
      }
    });
  }

  private stopObserving(): void {
    this.observedViewport?.removeEventListener('scroll', this.queueVisibleUpdate);
    this.observedViewport?.removeEventListener('transitionend', this.queueVisibleUpdate);
    this.resizeObserver?.disconnect();
    this.observedViewport = undefined;
  }

  private readonly queueVisibleUpdate = (): void => {
    if (!this.viewport || this.renderFrame !== undefined) return;
    this.zone.runOutsideAngular(() => {
      this.renderFrame = requestAnimationFrame(() => {
        this.renderFrame = undefined;
        this.updateVisible();
      });
    });
  };

  private updateVisible(): void {
    const viewport = this.viewport;
    const origin = this.origin?.nativeElement;
    if (!viewport || !origin) return;

    const bounds = viewport.getBoundingClientRect();
    const start = origin.getBoundingClientRect();
    const buffer = 320;
    const left = (bounds.left - start.left) / this.zoom - buffer;
    const right = (bounds.right - start.left) / this.zoom + buffer;
    const top = (bounds.top - start.top) / this.zoom - buffer;
    const bottom = (bounds.bottom - start.top) / this.zoom + buffer;
    const intersects = (a: ECONode, b: ECONode): boolean =>
      Math.min(a.XPosition, b.XPosition) <= right &&
      Math.max(a.XPosition + a.w, b.XPosition + b.w) >= left &&
      Math.min(a.YPosition, b.YPosition) <= bottom &&
      Math.max(a.YPosition + a.h, b.YPosition + b.h) >= top;

    const nodes = this.nodes.filter(node => intersects(node, node));
    const links = this.links.filter(link => intersects(link.node, link.child));
    const unchanged = <T>(next: T[], current: T[]) =>
      next.length === current.length && next.every((item, index) => item === current[index]);
    if (unchanged(nodes, this.visibleNodes) && unchanged(links, this.visibleLinks)) return;
    this.zone.run(() => {
      this.visibleNodes = nodes;
      this.visibleLinks = links;
    });
  }

  public scrollToNode(code: string, root = false): void {
    const node = this.nodesByCode.get(code);
    const viewport = this.viewport;
    const origin = this.origin?.nativeElement;
    if (!node || !viewport || !origin) return;

    const bounds = viewport.getBoundingClientRect();
    const start = origin.getBoundingClientRect();
    const left = viewport.scrollLeft + start.left - bounds.left + node.XPosition * this.zoom;
    const top = viewport.scrollTop + start.top - bounds.top + node.YPosition * this.zoom;
    viewport.scrollTo({
      left: root ? left - 24 : left + (node.w * this.zoom - viewport.clientWidth) / 2,
      top: root ? 0 : top + (node.h * this.zoom - viewport.clientHeight) / 2,
      behavior: root ? 'instant' : 'smooth'
    });
  }

  trackNode(_index: number, node: ECONode): number {
    return node.id;
  }

  get nodes(): ECONode[] {
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
    parent=parent || {id:-1,width:null,height:null,color:null,background:null,linkColor:null}
    node.width=node.width || parent.width
    node.height=node.height || parent.height
    node.color=node.color || parent.color
    node.background='transparent'
    node.linkColor= 'black'
    node.id=tree.nDatabaseNodes.length
      tree.add(node.id,parent.id,node.title, node.width, node.height, node.color, node.background, node.linkColor, node.data,node.selected,node.active)
      this.nodesByCode.set(String(node.data?.id), tree.nDatabaseNodes[node.id]);
      if (node.children)
      {
      node.children.forEach((x:any)=>{
        this.addNodes(tree,x,node)
      })
      }
  }


}
