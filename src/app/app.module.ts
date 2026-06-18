import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NZ_I18N, en_US , es_ES } from 'ng-zorro-antd/i18n';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

import { AppComponent } from './app.component';
import { registerLocaleData, PathLocationStrategy, LocationStrategy, CommonModule } from '@angular/common';

import es from '@angular/common/locales/es';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';

import { CommonLayoutComponent } from './layouts/common-layout/common-layout.component';
import { FullLayoutComponent } from './layouts/full-layout/full-layout.component';
import { SharedModule } from './shared/shared.module';
import { TemplateModule } from './shared/template/template.module';
import { TemplateWebModule } from '@shared/template-web/template-web.module';
import { WebLayoutComponent } from './layouts/web-layout/web-layout.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { JwtInterceptor } from '@shared/interceptor/token.interceptor';

registerLocaleData(es);

@NgModule({ declarations: [
        AppComponent,
        CommonLayoutComponent,
        FullLayoutComponent,
        WebLayoutComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        NzBreadCrumbModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        TemplateModule,
        TemplateWebModule,
        NzButtonModule], providers: [
        {
            provide: NZ_I18N,
            useValue: es_ES,
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
