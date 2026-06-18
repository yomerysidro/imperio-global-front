import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

import { AuthModel } from './models/user.interface';

const USER_AUTH_API_URL = '/api-url';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
    private currentUserSubject: BehaviorSubject<AuthModel>;
    public currentUser: Observable<AuthModel>;

    private currentTokenSubject: BehaviorSubject<string>;
    public currentToken: Observable<string>;

    private currentCodeInivitedSubject: BehaviorSubject<string>;
    public currentCodeInivited: Observable<string>;

    constructor(private http: HttpClient) {
      this.currentUserSubject = new BehaviorSubject<AuthModel>( JSON.parse(localStorage.getItem('currentUser')) );
      this.currentUser = this.currentUserSubject.asObservable();

      this.currentTokenSubject = new BehaviorSubject<string>( localStorage.getItem('access_token') );
      this.currentToken = this.currentTokenSubject.asObservable();

      this.currentCodeInivitedSubject = new BehaviorSubject<string>( localStorage.getItem("guest") );
      this.currentCodeInivited = this.currentCodeInivitedSubject.asObservable();
    }

    public get currentUserValue(): AuthModel {
        return this.currentUserSubject.value;
    }

    public get currentTokenValue(): string {
      return this.currentTokenSubject.value;
    }

    public get currentCodeInivitedValue(): string {
      return this.currentCodeInivitedSubject.value;
    }

    public setCurrentUser(user: AuthModel): void{
      this.currentUserSubject.next( user );
      if( user?.token ) this.setCurrentUserToken( user.token )
        else this.setCurrentUserToken( "" )
    }

    public setCurrentUserToken(token: string): void{
      this.currentTokenSubject.next( token );
    }

    public setCurrentCodeInivited(token: string): void{
      this.currentCodeInivitedSubject.next(token);
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
    }
}
