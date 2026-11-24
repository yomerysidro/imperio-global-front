import { Observable, Subject } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { HttpService } from './http.service';
import { environment } from '@env/environment';
describe('Network API contract', () => {
 let api: ApiService; let http: HttpTestingController; let flags: boolean[];
 const url = environment.hostUrl + '/api/v1';
 beforeEach(() => { TestBed.configureTestingModule({ imports: [HttpClientTestingModule] }); api = TestBed.inject(ApiService); http = TestBed.inject(HttpTestingController); flags = [environment.networkMoveBackendCertified, environment.networkMoveConfirmationEnabled]; });
 afterEach(() => { environment.networkMoveBackendCertified = flags[0]; environment.networkMoveConfirmationEnabled = flags[1]; http.verify(); });
 it('preserves network_meta from the points users endpoint including zero', () => {
  api.getPointListUser().subscribe(response => expect(response.data.network_meta.total_active).toBe(0));
  const request = http.expectOne(url + '/points/users');
  expect(request.request.method).toBe('GET');
  request.flush({ success: true, data: { network_meta: { total_network: 12, total_directs: 2, total_active: 0 } } });
 });
 it('propagates points HTTP failures without manufacturing zero counts', () => {
  api.getPointListUser().subscribe({ next: () => fail('Expected HTTP failure'), error: error => expect(error).toBeTruthy() });
  http.expectOne(url + '/points/users').flush({ message: 'Unavailable' }, { status: 500, statusText: 'Server Error' });
 });
 it('reads encoded UUID from the administrative detail route', () => {
  api.getNetworkMember('a/b').subscribe(u => expect(u.descendantsCount).toBe(0));
  http.expectOne(url + '/admin/network/genealogy/a%2Fb').flush({ user: { uuid: 'a/b' }, descendants_count: 0 });
 });
 it('reads the real move status endpoint contract', () => {
  api.getNetworkMoveStatus().subscribe(status => expect(status).toEqual({ confirmation_enabled: true, mode: 'local_test' }));
  http.expectOne(url + '/admin/network/moves/status').flush({ confirmation_enabled: true, mode: 'local_test' });
 });
 it('confirms with exactly the definitive POST and body', () => {
  environment.networkMoveBackendCertified = true; environment.networkMoveConfirmationEnabled = true;
  const body = { userCode: 'member', newSponsorCode: 'sponsor' }; api.confirmNetworkMove(body).subscribe();
  const r = http.expectOne(url + '/admin/network/moves/confirm'); expect(r.request.method).toBe('POST'); expect(r.request.body).toEqual(body); r.flush({ status: 'confirmed' });
 });
 it('loads administrative accounts from genealogy pages without a target line endpoint', () => {
  api.getNetworkAccounts(1).subscribe(); const request = http.expectOne(url + '/admin/network/genealogy?perPage=100&page=1'); expect(request.request.method).toBe('GET'); request.flush({ data: [], current_page: 1, last_page: 1 }); http.expectNone(r => r.url.includes('/admin/network/target-line'));
 });

});

describe('ApiService authentication requests', () => {
  let api: ApiService;
  let session: { currentUserValue: object; currentTokenValue: string };
  let get: jasmine.Spy;
  let responses: Subject<any>[];
  let cancellations: number;

  beforeEach(() => {
    session = { currentUserValue: {}, currentTokenValue: 'first' };
    responses = [];
    cancellations = 0;
    const httpService = jasmine.createSpyObj<HttpService>('HttpService', ['get']);
    get = httpService.get.and.callFake(() => new Observable(subscriber => {
      const response = new Subject();
      responses.push(response);
      const subscription = response.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        cancellations++;
      };
    }));
    api = new ApiService(httpService, session as AuthenticationService);
  });

  it('shares pending reads and makes a fresh request after the response', () => {
    const first = jasmine.createSpy('first');
    const second = jasmine.createSpy('second');
    api.getAuthenticationUser().subscribe(first);
    api.getAuthenticationUser().subscribe(second);
    expect(get).toHaveBeenCalledOnceWith('/auth');
    const result = { success: true, data: { uuid: 'member' } };
    responses[0].next(result);
    responses[0].complete();
    expect(first).toHaveBeenCalledOnceWith(result);
    expect(second).toHaveBeenCalledOnceWith(result);

    api.getAuthenticationUser().subscribe().unsubscribe();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('isolates sessions and releases a request when its last subscriber leaves', () => {
    const first = api.getAuthenticationUser().subscribe();
    const second = api.getAuthenticationUser().subscribe();
    session.currentTokenValue = 'second';
    const otherSession = api.getAuthenticationUser().subscribe();
    expect(get).toHaveBeenCalledTimes(2);

    first.unsubscribe();
    expect(cancellations).toBe(0);
    second.unsubscribe();
    expect(cancellations).toBe(1);
    otherSession.unsubscribe();
    api.getAuthenticationUser().subscribe().unsubscribe();
    expect(get).toHaveBeenCalledTimes(3);
  });
});
