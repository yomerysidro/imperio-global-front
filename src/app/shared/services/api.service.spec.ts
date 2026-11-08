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
