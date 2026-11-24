import { Dialog } from '@angular/cdk/dialog';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LOGIN_WELCOME_NAVIGATION } from '@shared/constants/login-welcome';
import { ApiService } from '@shared/services/api.service';
import { AuthenticationService } from '@shared/services/authentication.service';
import { ThemeConstantService } from '@shared/services/theme-constant.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of, Subject } from 'rxjs';
import { CommonLayoutComponent } from './common-layout.component';
import { LoginWelcomeComponent } from './login-welcome/login-welcome.component';

@Component({ selector: 'app-dashboard-stub', standalone: true, template: 'Área privada' })
class DashboardStub {}

describe('Bienvenida después del inicio de sesión', () => {
  let router: Router;
  let dialog: jasmine.SpyObj<Dialog>;
  let closeWelcome: jasmine.Spy;
  let otherDialogsClosed: Subject<void>;
  let originalToken: string | null;

  beforeEach(async () => {
    originalToken = localStorage.getItem('access_token');
    localStorage.setItem('access_token', 'test-session');
    otherDialogsClosed = new Subject<void>();
    closeWelcome = jasmine.createSpy('closeWelcome');
    dialog = jasmine.createSpyObj('Dialog', ['open']);
    dialog.open.and.returnValue({ close: closeWelcome } as any);

    TestBed.configureTestingModule({
      imports: [RouterOutlet],
      declarations: [CommonLayoutComponent],
      providers: [
        provideRouter([
          { path: 'login', component: DashboardStub },
          {
            path: 'admin', component: CommonLayoutComponent, children: [
              { path: 'profile', component: DashboardStub },
              { path: 'marketplace', component: DashboardStub }
            ]
          }
        ]),
        { provide: Dialog, useValue: dialog },
        { provide: NzModalService, useValue: { afterAllClose: otherDialogsClosed } },
        { provide: AuthenticationService, useValue: { currentCodeInivited: of(null) } },
        { provide: ThemeConstantService, useValue: {
          isMenuFoldedChanges: of(false), isSideNavDarkChanges: of(false),
          selectedHeaderColor: of('blue'), isExpandChanges: of(false)
        } },
        { provide: ApiService, useValue: {} }
      ]
    }).overrideTemplate(CommonLayoutComponent, '<router-outlet></router-outlet>');
    router = TestBed.inject(Router);
    await RouterTestingHarness.create('/login');
  });

  afterEach(() => {
    if (originalToken === null) localStorage.removeItem('access_token');
    else localStorage.setItem('access_token', originalToken);
  });

  const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  it('waits for navigation and existing modals, then shows once until another login', async () => {
    await router.navigateByUrl('/admin/profile', { info: LOGIN_WELCOME_NAVIGATION });
    await nextFrame();
    expect(dialog.open).not.toHaveBeenCalled();
    otherDialogsClosed.next();
    expect(dialog.open).toHaveBeenCalledOnceWith(LoginWelcomeComponent, jasmine.objectContaining({
      ariaLabelledBy: 'login-welcome-title', autoFocus: '.welcome-action'
    }));

    await router.navigateByUrl('/admin/marketplace');
    await nextFrame();
    otherDialogsClosed.next();
    expect(dialog.open).toHaveBeenCalledTimes(1);

    await router.navigateByUrl('/login');
    expect(closeWelcome).toHaveBeenCalledTimes(1);
    await router.navigateByUrl('/admin/marketplace', { info: LOGIN_WELCOME_NAVIGATION });
    await nextFrame();
    otherDialogsClosed.next();
    expect(dialog.open).toHaveBeenCalledTimes(2);
  });

  it('skips a direct load and clears a pending welcome on logout', async () => {
    await router.navigateByUrl('/admin/profile');
    await nextFrame();
    otherDialogsClosed.next();
    expect(dialog.open).not.toHaveBeenCalled();

    await router.navigateByUrl('/login');
    await router.navigateByUrl('/admin/profile', { info: LOGIN_WELCOME_NAVIGATION });
    await nextFrame();
    localStorage.removeItem('access_token');
    await router.navigateByUrl('/login');
    otherDialogsClosed.next();
    expect(dialog.open).not.toHaveBeenCalled();
  });
});
