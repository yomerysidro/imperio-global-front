import { NgModule } from '@angular/core';

// ✅ IMPORTAR TODOS LOS MÓDULOS NECESARIOS
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzRadioModule } from 'ng-zorro-antd/radio'; // ✅ AGREGADO
import { NzCollapseModule } from 'ng-zorro-antd/collapse'; // ✅ AGREGADO

@NgModule({
    exports: [
        NzTableModule,
        NzModalModule,
        NzGridModule,
        NzIconModule,
        NzButtonModule,
        NzInputModule,
        NzFormModule,
        NzSelectModule,
        NzDatePickerModule,
        NzTimePickerModule,
        NzUploadModule,
        NzMessageModule,
        NzNotificationModule,
        NzSpinModule,
        NzTabsModule,
        NzTagModule,
        NzBadgeModule,
        NzCardModule,
        NzDividerModule,
        NzDrawerModule,
        NzPopoverModule,
        NzToolTipModule,
        NzImageModule,
        NzListModule,
        NzDropDownModule,
        NzMenuModule,
        NzLayoutModule,
        NzCarouselModule,
        NzSpaceModule,
        NzTypographyModule,
        NzRadioModule, // ✅ AGREGADO
        NzCollapseModule // ✅ AGREGADO
    ]
})
export class NgZorroAntdModule { }