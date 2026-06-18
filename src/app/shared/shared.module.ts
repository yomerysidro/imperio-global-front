import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { RouterModule } from "@angular/router";

// ✅ PIPES Y COMPONENTES
import { SearchPipe } from './pipes/search.pipe';
import { LoadingSpinerComponent } from './components/loading-spiner/loading-spiner.component';
// ❌ COMENTADO: CarouselImagesComponent (usa owl-carousel-o)
// import { CarouselImagesComponent } from './components/carousel-images/carousel-images.component';
import { CardServiceComponent } from './components/card-service/card-service.component';
import { PaymentReservationModalComponent } from './components/payment/payment-reservation-modal/payment-reservation-modal.component';
import { TreeViewComponent } from './components/tree-view/tree-view.component';
// ❌ COMENTADO: ImageCropperUploadComponent (usa ngx-image-cropper)
// import { ImageCropperUploadComponent } from './components/image-cropper-upload/image-cropper-upload.component';
import { UserTreeDetailComponent } from './components/user-tree-detail/user-tree-detail.component';
import { DelayedInputDirective } from './directives/delayed-input.directive';
import { PaymentProductsModalComponent } from './components/payment/payment-products-modal/payment-products-modal.component';
import { TablePaymentProductOrderComponent } from './components/table/table-payment-product-order/table-payment-product-order.component';
import { PaymentViewVoucherModalComponent } from './components/payment/payment-view-voucher-modal/payment-view-voucher-modal.component';
import { PaymentOfflineEfectivoComponent } from './components/payment/payment-offline-efectivo/payment-offline-efectivo.component';

// ✅ MÓDULOS NG-ZORRO
import { NgZorroAntdModule } from './ng-zorro-antd.module';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio'; // ✅ AGREGAR PARA nz-radio-button
import { NzCollapseModule } from 'ng-zorro-antd/collapse'; // ✅ AGREGAR PARA nz-collapse

// ❌ ELIMINAR TODAS LAS LIBRERÍAS INCOMPATIBLES
// import { ImageCropperModule } from 'ngx-image-cropper';
// import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
// import { CarouselModule } from 'ngx-owl-carousel-o';
// import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';

// ✅ CONSTANTES
const MODULES = [
    ReactiveFormsModule,
    NzCarouselModule,
    NzGridModule,
    NzTableModule,
    NzModalModule,
    NzSpinModule,
    NzUploadModule,
    NzButtonModule,
    NzRadioModule, // ✅ AGREGADO
    NzCollapseModule, // ✅ AGREGADO
    NgZorroAntdModule,
    NzImageModule,
];

const COMPONENTS = [
    LoadingSpinerComponent,
    // ❌ COMENTADO: CarouselImagesComponent,
    CardServiceComponent,
    PaymentReservationModalComponent,
    TreeViewComponent,
    // ❌ COMENTADO: ImageCropperUploadComponent,
    UserTreeDetailComponent,
    PaymentProductsModalComponent,
    DelayedInputDirective,
    TablePaymentProductOrderComponent,
    PaymentViewVoucherModalComponent,
    PaymentOfflineEfectivoComponent
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        ...MODULES
    ],
    declarations: [
        SearchPipe,
        ...COMPONENTS
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        ...MODULES,
        SearchPipe,
        ...COMPONENTS,
    ],
    providers: [
        DecimalPipe
    ]
})
export class SharedModule { }