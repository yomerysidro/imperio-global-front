import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-carousel-images',
  templateUrl: './carousel-images.component.html',
  styleUrls: ['./carousel-images.component.scss']
})
export class CarouselImagesComponent implements OnInit {

  @Input() fullWidth: boolean = false;

  customOptions = {
    loop: true,
    autoplay: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: true,
    navSpeed: 700,
    center: true,
    navText: [],
    items: 1,
    nav: false
  }


  constructor() { }

  ngOnInit(): void {
  }

}
