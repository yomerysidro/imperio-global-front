import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tools-order-page',
  templateUrl: './tools-order-page.component.html',
  styleUrls: ['./tools-order-page.component.scss']
})
export class ToolsOrderPageComponent implements OnInit {

  codeUser: string = "";
  nameUser: string = "";
  totalRecord: number = 0;

  eventSearch: number = 0;
  queryParams: any = {};

  constructor() { }

  ngOnInit(): void {
  }

  public onSearch(): void{

    this.queryParams = {
      codeuser: this.codeUser.trim(),
      name: this.nameUser.trim()
    }
    this.eventSearch = (new Date()).getTime();
  }

}
