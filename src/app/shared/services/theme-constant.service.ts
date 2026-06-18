import { Injectable } from '@angular/core';
import { getCurrentCompany } from '@shared/utilities/functions';
import { Observable, BehaviorSubject } from 'rxjs';
import { IProductModel } from './models/product.interface';

@Injectable({
    providedIn: 'root'
})
export class ThemeConstantService {

    // Theme Config
    isMenuFolded: boolean = false
    isSideNavDark: boolean = false;
    loading: boolean = false;
    headerColor: string = 'default';

    cartList: Array<IProductModel> = JSON.parse( localStorage.getItem("cartList") ?? "[]" );

    company?: string = getCurrentCompany();

    private colorConfig: any = {
        colors: {
            magenta: '#eb2f96',
            magentaLight: 'rgba(235, 47, 150, 0.05)',
            red: '#de4436',
            redLight: 'rgba(222, 68, 54, 0.05)',
            volcano: '#fa541c',
            volcanoLight: 'rgba(250, 84, 28, 0.05)',
            orange: '#fa8c16',
            orangeLight: 'rgba(250, 140, 22, 0.1)',
            gold: '#ffc107',
            goldLight: 'rgba(255, 193, 7, 0.1)',
            lime: '#a0d911',
            limeLight: 'rgba(160, 217, 17, 0.1)',
            green: '#52c41a',
            greenLight: 'rgba(82, 196, 26, 0.1)',
            cyan: "#05c9a7",
            cyanLight: 'rgba(0, 201, 167, 0.1)',
            blue: '#3f87f5',
            blueLight: 'rgba(63, 135, 245, 0.15)',
            geekBlue: '#2f54eb',
            geekBlueLight: 'rgba(47, 84, 235, 0.1)',
            purple: '#886cff',
            purpleLight: 'rgba(136, 108, 255, 0.1)',
            gray: '#53535f',
            grayLight: '#77838f',
            grayLighter: '#ededed',
            grayLightest: '#f1f2f3',
            border: '#edf2f9',
            white: '#ffffff',
            dark: '#2a2a2a',
            transparent: 'rgba(255, 255, 255, 0)'
        }
    };

    private isMenuFoldedActived = new BehaviorSubject<boolean>(this.isMenuFolded);
    isMenuFoldedChanges: Observable<boolean> = this.isMenuFoldedActived.asObservable();

    private isSideNavDarkActived = new BehaviorSubject<boolean>(this.isSideNavDark);
    isSideNavDarkChanges: Observable<boolean> = this.isSideNavDarkActived.asObservable();

    private isExpandActived = new BehaviorSubject<boolean>(false);
    isExpandChanges: Observable<boolean> = this.isExpandActived.asObservable();

    private currentHeaderColor = new BehaviorSubject(this.headerColor);
    selectedHeaderColor = this.currentHeaderColor.asObservable();

    private currentLoading = new BehaviorSubject<boolean>(this.loading);
    selectedLoading: Observable<boolean> = this.currentLoading.asObservable();

    private currentCompany$ = new BehaviorSubject<any>(null);
    selectedCompany$: Observable<any> = this.currentCompany$.asObservable();

    private isAdminUserActive = new BehaviorSubject<boolean>( Number.parseInt( localStorage.getItem("admin") ) == 1 ? true : false );
    isAdminUserChanges: Observable<boolean> = this.isAdminUserActive.asObservable();

    private currentCartList = new BehaviorSubject<Array<IProductModel>>(this.cartList);
    selectedCurrentCartList = this.currentCartList.asObservable();

    get() {
        return this.colorConfig;
    }

    toggleFold(isFolded: boolean) {
      console.log(isFolded , "isFolded")
        this.isMenuFoldedActived.next(isFolded);
    }

    toogleSideNavDark(isDark:boolean) {
        this.isSideNavDarkActived.next(isDark);
    }

    toggleExpand(isExpand:boolean) {
      this.isExpandActived.next(isExpand);
    }

    changeHeaderColor(color: string) {
        this.currentHeaderColor.next(color)
    }

    onShowLoading( loading: boolean ) {
        this.currentLoading.next(loading);
    }

    changeCurrentCompany(company: string) {
        this.currentCompany$.next(company);
    }

    changeAdminUser( isAdmin: boolean ){
      localStorage.setItem( "admin" , isAdmin ? "1" : "0");
      this.isAdminUserActive.next( isAdmin )
    }

    changeCurrentCartList( cartList: Array<IProductModel> ){
      localStorage.setItem( "cartList" ,  JSON.stringify(cartList) );
      this.currentCartList.next(cartList);
    }
}
