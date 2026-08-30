import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketplacePageComponent } from './marketplace-page/marketplace-page.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { ProductFormModalComponent } from './product-form-modal/product-form-modal.component';

const routes: Routes = [
  {
      path: '',
      component: MarketplacePageComponent,
      data: {
          title: 'Marketplace ',
          headerDisplay: "none"
      }
  }
];

@NgModule({
  declarations: [
    MarketplacePageComponent,
    ProductFormModalComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports:[RouterModule]
})
export class MarketplaceModule { }
