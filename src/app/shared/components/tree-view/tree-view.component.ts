import { Component, Input, OnInit, SimpleChanges, TemplateRef } from '@angular/core';
import { ECONode, ECOTree } from '@shared/interfaces/econode.type';

@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss']
})
export class TreeViewComponent implements OnInit {

  @Input() template: TemplateRef<any>;
  @Input() data: any;

  tree:ECOTree = new ECOTree();

  constructor() { }

  ngOnInit(): void {
    // this.tree = new ECOTree();
     this.addNodes( this.tree, this.data );
     this.tree.UpdateTree();

     this.tree.nDatabaseNodes.forEach( node => {
      node.paths = node._drawChildrenLinks(this.tree)
     })
  }

  ngOnChanges(changes: SimpleChanges): void {

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
    parent=parent || {id:-1,width:null,height:null,color:null,background:null,linkColor:null}
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
