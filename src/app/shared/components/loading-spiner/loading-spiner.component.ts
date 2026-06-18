import { Component, OnInit } from '@angular/core';
import { ThemeConstantService } from '@shared/services/theme-constant.service';

@Component({
  selector: 'app-loading-spiner',
  templateUrl: './loading-spiner.component.html',
  styleUrls: ['./loading-spiner.component.scss']
})
export class LoadingSpinerComponent implements OnInit {
  loading: boolean = false;
  constructor(
    
  ) { }

  ngOnInit(): void {
    
  }

  ngOnChanges(): void {
    
  }

}
