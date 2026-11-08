import { of, throwError } from 'rxjs';
import { TreeUsersPageComponent } from './tree-users-page.component';
import { UserTreeDetailComponent } from '@shared/components/user-tree-detail/user-tree-detail.component';
describe('Administrative genealogy tree', () => {
 let c: TreeUsersPageComponent; let api: any;
 beforeEach(() => {
  api = jasmine.createSpyObj('api', ['getNetworkRoot','getNetworkMember','getNetworkAccounts','getPointListUser','getAuthenticationUser']);
  api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_network: 2, total_directs: 1 }, point_records: [] } }));
  api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'admin', is_admin: true } }));
  api.getNetworkRoot.and.returnValue(of({ uuid: 'configured-root', name: 'Company' }));
  api.getNetworkMember.and.returnValue(of({ uuid: 'configured-root', name: 'Company', directos: 1, descendantsCount: 2 }));
  api.getNetworkAccounts.and.callFake((page: number) => of({ current_page: page, last_page: 2, data: page === 1 ? [{ uuid: 'parent', name: 'Parent', sponsor_code: 'configured-root', connected: true }] : [{ uuid: 'child', name: 'Child', sponsor_code: 'parent', connected: true }] }));
  c = new TreeUsersPageComponent(api, {} as any, {} as any); spyOn<any>(c, 'scheduleInitialTreeCenter');
 });
 it('reads all pages and preserves direct sponsorship independent of purchases', () => {
  c.loadData(); expect(api.getNetworkAccounts).toHaveBeenCalledWith(2);
  expect(c.data.data.id).toBe('configured-root'); expect(c.data.children[0].data.id).toBe('parent'); expect(c.data.children[0].children[0].data.id).toBe('child');
  expect(c.usuarioTotal).toBe(2); expect(c.usuarioDirectos).toBe(1); expect(c.usuarioActivos).toBeNull();
 });
 it('re-reads relationships when refreshed after a confirmation', () => {
  c.loadData(); api.getNetworkMember.and.returnValue(of({ uuid: 'configured-root', descendantsCount: 0, directos: 0 }));
  api.getNetworkAccounts.and.returnValue(of({ current_page: 1, last_page: 1, data: [] })); c.loadData();
  expect(c.data.children).toEqual([]); expect(c.usuarioTotal).toBe(2);
 });
 it('does not show a partial tree when another page fails', () => {
  api.getNetworkAccounts.and.callFake((page: number) => page === 1 ? of({ current_page: 1, last_page: 2, data: [] }) : throwError({ status: 500 })); c.loadData();
  expect(c.isChart).toBeFalse(); expect(c.branchMoveError).toBeTruthy();
 });
 it('protects the configured corporate root without hardcoded UUIDs', () => {
  c.loadData(); expect(c.canMoveBranch('configured-root')).toBeFalse(); expect(c.canMoveBranch('new-account')).toBeTrue();
 });
 describe('backend network indicators', () => {
  beforeEach(() => { api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'member', is_admin: false } })); });
  it('shows total_active zero and uses backend totals without deriving activity from points', () => {
   api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_network: 303, total_directs: 1, total_active: 0 }, point_records: [] } }));
   c.loadData(); expect(c.usuarioActivos).toBe(0); expect(c.usuarioTotal).toBe(303); expect(c.usuarioDirectos).toBe(1);
  });
  it('shows a positive total_active returned by Laravel', () => {
   api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_network: 10, total_directs: 2, total_active: 7 }, point_records: [] } }));
   c.loadData(); expect(c.usuarioActivos).toBe(7);
  });
  it('keeps missing active count null instead of converting it to zero', () => {
   api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_network: 10, total_directs: 2 }, point_records: [] } }));
   c.loadData(); expect(c.usuarioActivos).toBeNull();
  });
  it('clears indicators after an HTTP failure', () => {
   c.usuarioActivos = 7;
   api.getPointListUser.and.returnValue(throwError({ status: 500 })); c.loadData();
   expect(c.usuarioActivos).toBeNull(); expect(c.usuarioTotal).toBeNull(); expect(c.usuarioDirectos).toBeNull();
  });
  it('refreshes official counters on initialization and every reload', () => {
   api.getPointListUser.and.returnValues(
    of({ success: true, data: { network_meta: { total_active: 5 } } }),
    of({ success: true, data: { network_meta: { total_active: 0 } } })
   );
   c.ngOnInit(); expect(c.usuarioActivos).toBe(5);
   c.loadData(); expect(c.usuarioActivos).toBe(0);
   expect(api.getPointListUser).toHaveBeenCalledTimes(2);
  });
  it('keeps null or invalid counts unavailable', () => {
   [null, '7', -1, NaN, Infinity].forEach(total_active => {
    api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_active } } }));
    c.loadData(); expect(c.usuarioActivos).toBeNull();
   });
  });
  it('keeps profile and tree indicators independent', () => {
   api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_active: 7 }, network_summary: { total_active: 99 } } }));
   c.loadData();
   const profile = new UserTreeDetailComponent({ userModel: { network_summary: { total_active: 3 }, network_meta: { total_active: 99 } } });
   profile.ngOnInit();
   expect(c.usuarioActivos).toBe(7); expect(profile.usuarioActivos).toBe(3);
  });
  it('does not use payload totals when the backend reports failure', () => {
   api.getPointListUser.and.returnValue(of({ success: false, data: { network_meta: { total_active: 7 } } }));
   c.loadData(); expect(c.usuarioActivos).toBeNull();
  });
 });

});
