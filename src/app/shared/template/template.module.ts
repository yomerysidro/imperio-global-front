import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { SharedModule } from '../shared.module';

import { HeaderComponent } from "./header/header.component";
import { SearchComponent } from "./search/search.component";
import { QuickViewComponent } from './quick-view/quick-view.component';
import { SideNavComponent } from "./side-nav/side-nav.component";
import { FooterComponent } from "./footer/footer.component";

import { SideNavDirective } from "../directives/side-nav.directive";
import { ThemeConstantService } from '../services/theme-constant.service';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';

const antdModule = [
    NzIconModule,
    NzDrawerModule,
    NzInputModule
]

@NgModule({
    exports: [
        CommonModule,
        HeaderComponent,
        SearchComponent,
        QuickViewComponent,
        SideNavComponent,
        SideNavDirective,
        FooterComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        SharedModule,
        ...antdModule
    ],
    declarations: [
        HeaderComponent,
        SearchComponent,
        QuickViewComponent,
        SideNavComponent,
        SideNavDirective,
        FooterComponent
    ],
    providers: [ 
        ThemeConstantService
    ]
})

export class TemplateModule { }
