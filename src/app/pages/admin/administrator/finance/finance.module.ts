import { NgModule } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FinanceRoutingModule } from './finance-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FinanceComponent } from './finance.component';
import es from '@angular/common/locales/es';
import { es_ES, NZ_I18N } from 'ng-zorro-antd/i18n';

registerLocaleData(es);

@NgModule({
  declarations: [
    FinanceComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    FinanceRoutingModule
  ],
  providers:[
    {
      provide: NZ_I18N,
      useValue: es_ES,
    }
  ]
})
export class FinanceModule { }
