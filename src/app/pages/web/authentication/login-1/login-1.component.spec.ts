import { FormBuilder } from '@angular/forms';
import { LOGIN_WELCOME_NAVIGATION } from '@shared/constants/login-welcome';
import { of, throwError } from 'rxjs';
import { Login1Component } from './login-1.component';

describe('Marca de bienvenida del login', () => {
  let component: Login1Component;
  let api: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<any>;
  let errors: jasmine.SpyObj<any>;

  beforeEach(() => {
    spyOn(Storage.prototype, 'clear');
    spyOn(Storage.prototype, 'setItem');
    spyOn(Storage.prototype, 'removeItem');
    spyOn(Storage.prototype, 'getItem').and.returnValue(null);
    api = jasmine.createSpyObj('ApiService', ['postAuthentication']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    errors = jasmine.createSpyObj('ModalService', ['error']);
    component = new Login1Component(
      new FormBuilder(), router, api, { validForm: () => true } as any, errors,
      jasmine.createSpyObj('AuthenticationService', ['setCurrentUser', 'setCurrentCodeInivited']),
      jasmine.createSpyObj('ThemeConstantService', ['changeAdminUser', 'changeCurrentCartList'])
    );
    component.ngOnInit();
  });

  for (const admin of [false, true]) {
    it(`marks the existing profile destination for admin=${admin}`, () => {
      api.postAuthentication.and.returnValue(of({ success: true, data: { admin, token: 'test-token' } }));
      component.onSubmit();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/admin/profile'], { info: LOGIN_WELCOME_NAVIGATION });
    });
  }

  it('keeps the marketplace redirect when the session has a pending cart', () => {
    (Storage.prototype.getItem as jasmine.Spy).withArgs('pendingProductCart').and.returnValue('[]');
    api.postAuthentication.and.returnValue(of({ success: true, data: { token: 'test-token' } }));
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/admin/marketplace'], { info: LOGIN_WELCOME_NAVIGATION });
  });

  it('does not mark or navigate after rejected credentials', () => {
    api.postAuthentication.and.returnValue(throwError('Credenciales incorrectas'));
    component.onSubmit();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(errors.error).toHaveBeenCalled();
    expect(component.loadingSubmit).toBeFalse();
  });
});
