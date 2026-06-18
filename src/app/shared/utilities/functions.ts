import { CONSTANTS } from "@shared/constants/constants";
import * as crypto from 'crypto-js';
import { DatePipe } from '@angular/common'
import { Nodes } from "@shared/interfaces/node.type";
import { AuthModel } from "@shared/services/models/user.interface";

  export const changeDateFormat = ( date?: any ): string => {
    if( date == null ) return null;
    const pipe = new DatePipe('en-US');
    let _date = new Date(date);
    return pipe.transform(_date, 'yyyy-MM-dd');
  }

  export const dateAdult = (): Date => {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    return new Date(year - 18, month, day);

  }

  export const ageCurrent = ( date: string | Date ): number => {
    const today: Date = new Date();
    const birthDate: Date = new Date(date);

    let age: number = today.getFullYear() - birthDate.getFullYear();
    const monthDiff: number = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  export const stringFormat = (str: string, ...val: any[]): string => {
    for (let index = 0; index < val.length; index++) {
      str = str.replace(`{${index}}`, val[index]);
    }
    return str;
  }

  export const getMultiSelectValue = (value: String[]): string => {
    let valuesList = null;

    if (value != null) {
      valuesList = '';
      for (let i = 0; i < value.length; i++) {
        valuesList += value[i] + ',';
      }

      if (valuesList.length > 0) {
        valuesList = valuesList.toString().substring(0, valuesList.length - 1);
      }
    }

    return valuesList;
  }

  export const getMultiSelectValueArrayInteger = (value: String[]): Array<number> => {
    let arrayList: Array<number> = [];

    if(value !== null){
      for (let i = 0; i < value.length; i++) {
        arrayList.push(Number(value[i]));
      }
    }

    return arrayList;
  }

  export const getMultiSelectValueArrayString = (value: String[]): Array<string> => {
    let arrayList: Array<string> = [];

    if(value !== null){
      for (let i = 0; i < value.length; i++) {
        arrayList.push(value[i] as string);
      }
    }

    return arrayList;
  }

  export const downloadFile =(base64:any,fileName:any) =>{
    const src = `data:text/csv;base64,${base64}`;
    const link = document.createElement("a")
    link.href = src
    link.download = fileName
    link.click()

    link.remove()
  }



  export const saveSessionStorage = (value: AuthModel) => {

    localStorage.setItem('access_token', value.token);
    localStorage.setItem('currentUser' , JSON.stringify( { name: value.name , photo: value.photo } ));
    localStorage.setItem('uuid' , value.uuid );

    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    date.setHours( hours + 2 );
    // date.setMinutes(minutes + 2);
    localStorage.setItem('expire_time', date.toString());

  }

  export const saveSessionToken = (value: any) => {

  }

  export const saveSessionStoraheUser = (value: any) => {
    localStorage.setItem('currentUser' , JSON.stringify( { name: value.name , photo: value.photo } ));
  }

  export const getUserId = (): number | undefined => {
    return parseInt(localStorage.getItem('user_id'));
  }

  export const getUserFullname = (): string | undefined => {
    return localStorage.getItem('user');
  }

  export const getCodeUuid = (): string | undefined => {
    return localStorage.getItem('uuid');
  }

  export const getAccesToken = (): string | undefined => {
    return localStorage.getItem('access_token');
  }

  export const getCurrentUser = (): AuthModel | undefined => {
    return JSON.parse( localStorage.getItem('currentUser') );
  }

  export const getExpireTime = (): string | undefined => {
    return localStorage.getItem('expire_time') ;
  }

  export const validateExpirateToken = (): boolean => {
    let validation = false;
    let dateNow = new Date();
    let dateExpired = new Date( getExpireTime() );
    if ( getExpireTime() ) {
      if (dateExpired >= dateNow) validation = true;
    }
    return validation;
  }

  export const saveSessionStorageRefreshToken = (value: any) => {
    let date = new Date();
    let hours = date.getHours();
    date.setHours(hours + Math.round(Number(value[0].expirationTime)));
    localStorage.setItem('expire_time', date.toString());
    localStorage.setItem('access_token', value[0].token);
    localStorage.setItem('refresh_token', value[0].refreshToken);
  }

  export const isAuth = (): boolean => {
    return getAccesToken() ? true : false;
  }

  export const saveSessionStorageProfile = (value: any[]) => {
    // localStorage.setItem('role_id', value[0].id);
    // localStorage.setItem('role_name', value[0].name);
  }

  export const separateFirstMiddleName = (value: string): Array<string> => {
    let names: Array<any> = [];

    let arrayName = value.split(' ');
    arrayName.forEach(element => {
      names.push(element);
    });

    return names;
  }

  export const separateFirstMiddleLastName = (value: string): Array<string> => {
    let lastNames: Array<any> = [];

    let arrayLastName = value.split(' ');
    arrayLastName.forEach(element => {
      lastNames.push(element);
    });

    return lastNames;
  }

  export const saveLocalCurrentMenus = (menus: any) => {
    // localStorage.setItem( 'menus' , JSON.stringify(menus) );
  }

  export const getLocalCurrentMenus = (): any => {
    // return JSON.parse( localStorage.getItem("menus") );
  }

  export const saveLocalCompanies = (companies: any) => {
    // localStorage.setItem( 'companies' , JSON.stringify(companies) );
  }

  export const getLocalCompanies = (): any => {
    // return JSON.parse( localStorage.getItem("companies") );
  }

  export const saveCurrentCompany = (company: any): any => {
    // localStorage.setItem( 'currentCompany' , company );
  }

  export const getCurrentCompany = (): any => {
    // return  localStorage.getItem("currentCompany");
  }

  export const removeSessionLocalAll = () => {
    localStorage.clear();
  }
