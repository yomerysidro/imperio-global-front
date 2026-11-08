import { UserTreeDetailComponent } from './user-tree-detail.component';
describe('UserTreeDetailComponent network summary', () => {
 it('uses profile network_summary including zero without counting local nodes', () => {
  const c = new UserTreeDetailComponent(null); c.userModel = { uuid: 'member', name: 'Member', network_summary: { total_network: 12, total_directs: 3, total_active: 0 } }; c.listPoints = [{ user_code: 'a', sponsor_code: 'member' }]; c.ngOnInit();
  expect(c.usuarioTotal).toBe(12); expect(c.usuarioDirectos).toBe(3); expect(c.usuarioActivos).toBe(0);
 });
 it('does not fall back to legacy totals or network_meta when summary is absent', () => {
  const c = new UserTreeDetailComponent({ userModel: { activos: 8, network_meta: { total_active: 9 } } });
  c.ngOnInit(); expect(c.usuarioActivos).toBeNull();
 });
 it('leaves indicators unavailable without profile data', () => {
  const c = new UserTreeDetailComponent(null); c.ngOnInit();
  expect(c.usuarioActivos).toBeNull();
 });
 it('keeps missing profile metrics as null', () => {
  const c = new UserTreeDetailComponent(null); c.userModel = { uuid: 'member', name: 'Member', network_summary: { total_network: null, total_directs: null, total_active: null } }; c.ngOnInit(); expect(c.usuarioActivos).toBeNull();
 });
});
