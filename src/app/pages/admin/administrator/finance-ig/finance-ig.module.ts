import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '@shared/shared.module';
import { FinanceIgComponent } from './finance-ig.component';
import { FinanceIgAdminGuard } from './finance-ig-admin.guard';
import { FinanceIgReportService } from './finance-ig-report.service';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import {
  BarChartOutline, CalendarOutline, CheckCircleOutline, CloseCircleOutline, DollarCircleOutline, DownOutline, DownloadOutline, EditOutline,
  ExclamationCircleOutline, EyeOutline, FileExcelOutline, FundOutline, InboxOutline, InfoCircleOutline,
  LoadingOutline, ReloadOutline, ShopOutline, ShoppingCartOutline, TeamOutline, UserOutline
} from '@ant-design/icons-angular/icons';

const financeIcons = [
  BarChartOutline, CalendarOutline, CheckCircleOutline, CloseCircleOutline, DollarCircleOutline, DownOutline, DownloadOutline, EditOutline,
  ExclamationCircleOutline, EyeOutline, FileExcelOutline, FundOutline, InboxOutline, InfoCircleOutline,
  LoadingOutline, ReloadOutline, ShopOutline, ShoppingCartOutline, TeamOutline, UserOutline
];

const routes: Routes = [
  { path: '', component: FinanceIgComponent, canActivate: [FinanceIgAdminGuard] }
];

@NgModule({
  declarations: [FinanceIgComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(routes)],
  providers: [
    FinanceIgAdminGuard,
    FinanceIgReportService,
    { provide: NZ_ICONS, useValue: financeIcons }
  ]
})
export class FinanceIgModule {}
