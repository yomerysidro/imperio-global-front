import { FormBuilder } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { ToolsUsersSponsorModalComponent } from './tools-users-sponsor-modal.component';
describe('Network reorganization', () => {
 let c: ToolsUsersSponsorModalComponent; let api: any; let modal: any;
 const user = (uuid: string, sponsor = 'parent') => ({ uuid, name: uuid, sponsor: { uuid: sponsor, name: sponsor }, genealogyVerified: true, descendantsCount: 0 });
 beforeEach(() => {
  api = jasmine.createSpyObj('api', ['getNetworkMember','getNetworkRoot','getNetworkAccounts','getNetworkMoveStatus','getUsersSearch','confirmNetworkMove']);
  api.getNetworkMember.and.callFake((uuid: string) => of({ ...user(uuid), routeAscending: [{ uuid, name: uuid, level: 1, sponsor_code: null }] }));
  api.getNetworkRoot.and.returnValue(of({ uuid: 'root' }));
  api.getNetworkMoveStatus.and.returnValue(of({ confirmation_enabled: false, mode: 'disabled' }));
  api.getNetworkAccounts.and.returnValue(of({ current_page: 1, last_page: 1, data: [{ uuid: 'root', name: 'Root', connected: true }, { uuid: 'member', name: 'Member', sponsor_code: 'root', connected: true }] }));
  modal = jasmine.createSpyObj('modal', ['confirm','success']);
  modal.confirm.and.callFake((_text: string, cb: () => void) => cb());
  c = new ToolsUsersSponsorModalComponent(new FormBuilder(), api, modal, { currentUserValue: { admin: true } } as any, null);
  c.userModel = user('tUI1') as any; c.ngOnInit();
 });
 function enable() { c.moveConfirmationEnabled = true; api.getNetworkMoveStatus.and.returnValue(of({ confirmation_enabled: true, mode: 'local_test' })); }
 function search() {
  api.getUsersSearch.and.returnValue(of({ success: true, data: [{ uuid: '1234', name: 'Julia Seminario', red_total: 999 }] }));
  api.getNetworkMember.and.callFake((uuid: string) => of({ ...user(uuid, 'alberto-from-server'), sponsor: { uuid: 'alberto-from-server', name: 'Alberto' } }));
  c.validateForm.get('sponsorNew').setValue('1234'); c.onSearchSponsor();
 }
 it('queries availability at modal initialization and enables when Laravel says true', () => {
  api.getNetworkMoveStatus.and.returnValue(of({ confirmation_enabled: true, mode: 'local_test' }));
  c.loadMoveStatus(); expect(api.getNetworkMoveStatus).toHaveBeenCalled(); expect(c.moveConfirmationEnabled).toBeTrue(); expect(c.moveStatusMode).toBe('local_test');
  search(); expect(c.canConfirm()).toBeTrue(); expect(c.confirmationBlockReason).toBe('');
 });
 it('keeps confirmation blocked for false status and status request errors', () => {
  expect(c.canConfirm()).toBeFalse(); expect(c.confirmationBlockReason).toContain('disabled');
  api.getNetworkMoveStatus.and.returnValue(throwError({ status: 403, error: { message: 'Solo administradores' } })); c.loadMoveStatus();
  expect(c.moveConfirmationEnabled).toBeFalse(); expect(c.confirmationBlockReason).toContain('Solo administradores');
 });
 it('identifies Julia by returned UUID and verifies her actual sponsor from genealogy', () => {
  search(); expect(api.getNetworkMember).toHaveBeenCalledWith('1234');
  expect(c.newSponsor.uuid).toBe('1234'); expect(c.newSponsor.sponsor.name).toBe('Alberto');
  expect(c.newSponsor.descendantsCount).toBe(0);
 });
 it('selects Florencio and Julia without changing any relationship', () => {
  search(); expect(c.userModel.uuid).toBe('tUI1'); expect(c.newSponsor.uuid).toBe('1234');
  expect(api.confirmNetworkMove).not.toHaveBeenCalled();
 });
 it('preserves zero descendants in both summaries', () => {
  expect(c.selectedDescendantCount).toBe(0); expect(c.primaryLineFacts(c.userModel).descendants).toBe(0);
 });
 it('blocks when flags are off and explains the reason', () => {
  search(); expect(c.canConfirm()).toBeFalse(); expect(c.confirmationBlockReason).toContain('disabled');
  c.onSave(); expect(api.confirmNetworkMove).not.toHaveBeenCalled();
 });
 it('does not use missing informational counts as authorization', () => {
  enable(); search(); c.userModel.descendantsCount = null; expect(c.canConfirm()).toBeTrue();
 });
 it('requires verified details', () => {
  enable(); search(); c.newSponsor.genealogyVerified = false; expect(c.canConfirm()).toBeFalse();
 });
 it('reports HTTP 423 without success or refresh', () => {
  enable(); search(); api.confirmNetworkMove.and.returnValue(throwError({ status: 423 }));
  spyOn(c.confirmed, 'emit'); c.onSave();
  expect(c.moveError).toContain('deshabilitado en Laravel'); expect(c.confirmed.emit).not.toHaveBeenCalled(); expect(modal.success).not.toHaveBeenCalled();
 });
 it('sends only the two actual UUIDs and re-reads after mocked confirmation', () => {
  enable(); search(); api.confirmNetworkMove.and.returnValue(of({ status: 'confirmed' }));
  api.getNetworkMember.calls.reset(); api.getNetworkAccounts.calls.reset(); spyOn(c.confirmed, 'emit');
  c.onSave(); expect(api.confirmNetworkMove).toHaveBeenCalledWith({ userCode: 'tUI1', newSponsorCode: '1234' });
  expect(api.getNetworkMember).toHaveBeenCalledWith('tUI1'); expect(api.getNetworkAccounts).toHaveBeenCalled(); expect(c.confirmed.emit).toHaveBeenCalled(); expect(c.newSponsor).toBeNull();
 });
 it('builds the vertical line from paginated Laravel genealogy without target-line requests', () => {
  api.getNetworkAccounts.and.returnValue(of({ current_page: 1, last_page: 1, data: [
   { uuid: 'root', name: 'Root', connected: true },
   { uuid: 'dynamic-parent', name: 'Parent', sponsor_code: 'root', connected: true, level: 1 },
   { uuid: 'dynamic-child', name: 'Child', sponsor_code: 'dynamic-parent', connected: true, level: 2, direct_children_count: 0 }
  ] }));
  api.getNetworkMember.and.returnValue(of({ uuid: 'dynamic-child', routeAscending: [{ uuid: 'dynamic-child', name: 'Child', level: 2, sponsor_code: 'dynamic-parent' }, { uuid: 'dynamic-parent', name: 'Parent', level: 1, sponsor_code: 'root' }, { uuid: 'root', name: 'Root', level: 0, sponsor_code: null }] }));
  c.loadPrimaryLine(); expect(api.getNetworkRoot).toHaveBeenCalled(); expect(api.getNetworkAccounts).toHaveBeenCalledWith(1);
  expect(c.primaryLine.map(row => row.code)).toEqual(['root', 'dynamic-parent', 'dynamic-child']);
  expect(c.primaryLine[2].expectedSponsorCode).toBe('dynamic-parent');
  expect(api.getNetworkMember).not.toHaveBeenCalledWith('/admin/network/target-line');
 });
 it('renders each selected reference from its own Laravel route and keeps side branches separate', () => {
  const row = (uuid: string, name: string, sponsor_code: string | null) => ({ uuid, name, sponsor_code, connected: true });
  const graph = [row('corp','Empresa',null),row('pas','Pascual','corp'),row('luis','Luis ?ngel','pas'),row('ric','Ricardo','luis'),row('alb','Alberto','ric'),row('jul','Julia','alb'),row('flo','Florencio','jul'),row('mig','Miguel','flo'),row('gre','Gregoria','mig'),row('alex','Alex','luis'),row('chela','Chela','luis')];
  c.genealogyAccounts = graph;
  const route = (last: string) => { const rows: any[] = []; let current = graph.find(x => x.uuid === last); while (current) { rows.push({ uuid: current.uuid, name: current.name, sponsor_code: current.sponsor_code, level: rows.length }); current = graph.find(x => x.uuid === current!.sponsor_code); } return rows; };
  api.getNetworkMember.and.callFake((uuid: string) => of({ uuid, routeAscending: route(uuid) }));
  c.selectReference('jul'); expect(c.primaryLine.map(x => x.user.name)).toEqual(['Empresa','Pascual','Luis ?ngel','Ricardo','Alberto','Julia']);
  c.selectReference('mig'); expect(c.primaryLine.map(x => x.user.name)).toEqual(['Empresa','Pascual','Luis ?ngel','Ricardo','Alberto','Julia','Florencio','Miguel']);
  c.selectReference('gre'); expect(c.primaryLine.map(x => x.user.name).slice(-2)).toEqual(['Miguel','Gregoria']);
  c.selectReference('alex'); expect(c.primaryLine.map(x => x.user.name)).toContain('Alex'); expect(c.primaryLine.map(x => x.user.name)).not.toContain('Ricardo');
  c.selectReference('chela'); expect(c.primaryLine.map(x => x.user.name)).toContain('Chela'); expect(c.primaryLine.map(x => x.user.name)).not.toContain('Alberto');
 });
 it('continues through every real genealogy page', () => {
  api.getNetworkAccounts.and.callFake((page: number) => page === 1
   ? of({ current_page: 1, last_page: 2, data: [{ uuid: 'root', connected: true }] })
   : of({ current_page: 2, last_page: 2, data: [{ uuid: 'later', sponsor_code: 'root', connected: true }] }));
  api.getNetworkMember.and.returnValue(of({ uuid: 'root', routeAscending: [{ uuid: 'later', name: 'Later', level: 1, sponsor_code: 'root' }, { uuid: 'root', name: 'Root', level: 0, sponsor_code: null }] }));
  c.loadPrimaryLine(); expect(api.getNetworkAccounts).toHaveBeenCalledWith(2); expect(c.primaryLine[1].code).toBe('later');
 });
 it('ignores a stale sponsor detail after editing the query', () => {
  const pending = new Subject<any>(); api.getUsersSearch.and.returnValue(of({ success: true, data: [{ uuid: '1234' }] })); api.getNetworkMember.and.returnValue(pending);
  c.validateForm.get('sponsorNew').setValue('1234'); c.onSearchSponsor(); c.onSponsorQueryChanged(); pending.next(user('1234'));
  expect(c.newSponsor).toBeNull();
 });
 it('allows retry after a failed detail read', () => {
  api.getNetworkMember.and.returnValue(throwError({ status: 500 })); c.loadSelectedMember(); expect(c.userModel.genealogyVerified).toBeFalse(); expect(c.detailError).toBeTruthy();
  api.getNetworkMember.and.returnValue(of(user('tUI1'))); c.loadSelectedMember(); expect(c.detailError).toBe(''); expect(c.userModel.genealogyVerified).toBeTrue();
 });
 it('keeps the action blocked after Laravel responds 423', () => {
  enable(); search(); api.confirmNetworkMove.and.returnValue(throwError({ status: 423 })); c.onSave(); expect(c.canConfirm()).toBeFalse(); expect(c.backendLocked).toBeTrue();
 });
 it('does not report generic success as a confirmed movement', () => {
  enable(); search(); api.confirmNetworkMove.and.returnValue(of({ success: true, status: 'pending' })); spyOn(c.confirmed, 'emit'); c.onSave(); expect(c.confirmed.emit).not.toHaveBeenCalled(); expect(modal.success).not.toHaveBeenCalled();
 });
 it('requires approval for the same UUIDs that the administrator reviewed', () => {
  enable(); search(); let approve: () => void; modal.confirm.and.callFake((_text: string, cb: () => void) => approve = cb);
  c.onSave(); c.newSponsor = user('different-account') as any; approve(); expect(api.confirmNetworkMove).not.toHaveBeenCalled();
 });

});
