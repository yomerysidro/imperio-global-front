import { of, throwError } from 'rxjs';
import { TreeUsersPageComponent } from './tree-users-page.component';
describe('Administrative genealogy tree', () => {
 let c: TreeUsersPageComponent; let api: any;
 beforeEach(() => {
  api = jasmine.createSpyObj('api', ['getNetworkRoot','getNetworkMember','getNetworkAccounts','getPointListUser','getAuthenticationUser']);
  api.getPointListUser.and.returnValue(of({ success: true, data: { point_records: [] } }));
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
  expect(c.data.children).toEqual([]); expect(c.usuarioTotal).toBe(0);
 });
 it('does not show a partial tree when another page fails', () => {
  api.getNetworkAccounts.and.callFake((page: number) => page === 1 ? of({ current_page: 1, last_page: 2, data: [] }) : throwError({ status: 500 })); c.loadData();
  expect(c.isChart).toBeFalse(); expect(c.branchMoveError).toBeTruthy();
 });
 it('protects the configured corporate root without hardcoded UUIDs', () => {
  c.loadData(); expect(c.canMoveBranch('configured-root')).toBeFalse(); expect(c.canMoveBranch('new-account')).toBeTrue();
 });
});
