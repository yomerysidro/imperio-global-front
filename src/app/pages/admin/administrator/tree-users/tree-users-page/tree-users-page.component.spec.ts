import { OverlayContainer } from '@angular/cdk/overlay';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { TreeViewComponent } from '@shared/components/tree-view/tree-view.component';
import { ApiService } from '@shared/services/api.service';
import { TreeUsersPageComponent } from './tree-users-page.component';
import { UserTreeDetailComponent } from '@shared/components/user-tree-detail/user-tree-detail.component';

describe('Affiliate tree viewport', () => {
  for (const first of ['indicators', 'tree', 'failure']) {
    it(`reveals the initial network together when ${first} is first`, async () => {
      const points = new Subject();
      const genealogy = new Subject();
      await TestBed.configureTestingModule({
        imports: [FormsModule],
        declarations: [TreeUsersPageComponent, TreeViewComponent],
        providers: [
          { provide: ApiService, useValue: {
            getAuthenticationUser: () => of({ success: true, data: { uuid: 'root', is_admin: true } }),
            getPointListUser: () => points,
            getNetworkRoot: () => of({ uuid: 'root' }),
            getNetworkMember: () => of({ uuid: 'root' }),
            getNetworkAccounts: () => genealogy
          } },
          { provide: NzModalService, useValue: {} },
          { provide: OverlayContainer, useValue: {} }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      const fixture = TestBed.createComponent(TreeUsersPageComponent);
      const host = fixture.nativeElement as HTMLElement;
      const loader = () => host.querySelector('.initial-network-loading');
      const indicators = () => Array.from(host.querySelectorAll('.stat-number'), element => element.textContent.trim());
      const finishIndicators = () => points.next({ success: true, data: {
        network_meta: { total_network: 1, total_directs: 1, total_active: 0 }
      } });
      const finishTree = () => {
        genealogy.next({ current_page: 1, last_page: 1, data: [
          { uuid: 'child', sponsor_code: 'root', connected: true }
        ] });
        genealogy.complete();
      };

      fixture.detectChanges();
      expect(loader()?.textContent).toContain('Preparando tu red de afiliados...');

      if (first === 'indicators') finishIndicators();
      if (first === 'tree') finishTree();
      if (first === 'failure') points.error(new Error('Counters unavailable'));
      fixture.detectChanges();
      expect(loader()).toBeTruthy();
      expect(getComputedStyle(host.querySelector('.stats-card')).visibility).toBe('hidden');
      expect(getComputedStyle(host.querySelector('.tree-shell')).visibility).toBe('hidden');

      if (first === 'tree') finishIndicators();
      else finishTree();
      fixture.detectChanges();
      expect(loader()).toBeNull();
      expect(getComputedStyle(host.querySelector('.stats-card')).visibility).toBe('visible');
      expect(getComputedStyle(host.querySelector('[data-node-code="child"]')).visibility).toBe('visible');
      expect(indicators()).toEqual(first === 'failure' ? Array(3).fill('No disponible') : ['1', '1', '0']);
    });
  }

  for (const width of [320, 1000]) {
    it(`frames the root and preserves navigation at ${width}px`, async () => {
      const account = (uuid: string, sponsor_code: string, active = true) =>
        ({ uuid, sponsor_code, active, connected: true });
      let accounts = [
        account('WAdz', 'DOSB', false),
        ...Array.from({ length: 9 }, (_, i) => account(`sibling-${i}`, 'DOSB')),
        account('second-direct', 'WAdz'),
        ...Array.from({ length: 8 }, (_, i) => account(`descendant-${i}`, i ? `descendant-${i - 1}` : 'WAdz')),
        ...Array.from({ length: 20 }, (_, i) => account(`deep-direct-${i}`, 'descendant-7'))
      ];
      let refresh: Subject<any> | undefined;
      await TestBed.configureTestingModule({
        imports: [FormsModule],
        declarations: [TreeUsersPageComponent, TreeViewComponent],
        providers: [
          { provide: ApiService, useValue: {
            getPointListUser: () => of({ success: true, data: {} }),
            getAuthenticationUser: () => of({ success: true, data: { uuid: 'DOSB', is_admin: true,
              network_summary: { total_network: accounts.length, total_directs: 10, total_active: accounts.length - 1 } } }),
            getNetworkRoot: () => of({ uuid: 'DOSB' }),
            getNetworkMember: () => of({ uuid: 'DOSB', active: true }),
            getNetworkAccounts: () => refresh || of({ current_page: 1, last_page: 1, data: accounts })
          } },
          { provide: NzModalService, useValue: {} },
          { provide: OverlayContainer, useValue: {} }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      const requests = spyOn(TestBed.inject(ApiService), 'getNetworkAccounts').and.callThrough();
      const fixture = TestBed.createComponent(TreeUsersPageComponent);
      fixture.nativeElement.style.display = 'block';
      fixture.nativeElement.style.width = `${width}px`;
      fixture.detectChanges();
      const page = fixture.componentInstance;
      const viewport = page.treeViewport.nativeElement;
      const root = () => viewport.querySelector<HTMLElement>('[data-node-code="DOSB"]');
      const nextPaint = () => new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await nextPaint();

      const initialLeft = viewport.scrollLeft;
      const initialTop = viewport.scrollTop;
      const initialRootLeft = root().getBoundingClientRect().left - viewport.getBoundingClientRect().left;
      expect(initialLeft).toBe(0);
      expect(initialTop).toBe(0);
      expect(initialRootLeft).toBeGreaterThanOrEqual(10);
      expect(initialRootLeft).toBeLessThanOrEqual(22);
      const rootTop = root().getBoundingClientRect().top;
      expect(rootTop - viewport.getBoundingClientRect().top).toBeGreaterThanOrEqual(14);
      expect(rootTop - viewport.getBoundingClientRect().top).toBeLessThanOrEqual(22);
      const child = viewport.querySelector<HTMLElement>('[data-node-code="WAdz"]');
      expect(child.getBoundingClientRect().top).toBeGreaterThan(rootTop);
      expect(child.getBoundingClientRect().left).toBeCloseTo(root().getBoundingClientRect().left, 0);
      expect(child.classList.contains('is-active')).toBeFalse();
      const nextRootDirect = viewport.querySelector('[data-node-code="sibling-0"]').getBoundingClientRect();
      expect(nextRootDirect.top).toBe(child.getBoundingClientRect().top);
      expect(nextRootDirect.right).toBeLessThan(viewport.getBoundingClientRect().right);
      const firstDirect = viewport.querySelector('[data-node-code="second-direct"]').getBoundingClientRect();
      const secondDirect = viewport.querySelector('[data-node-code="descendant-0"]').getBoundingClientRect();
      expect(firstDirect.top).toBe(secondDirect.top);
      expect(secondDirect.left).toBeGreaterThan(firstDirect.right);
      expect(secondDirect.right).toBeLessThan(viewport.getBoundingClientRect().right);
      expect(viewport.querySelectorAll('svg.treeLink .tree-child-link').length).toBe(accounts.length);
      expect(child.getBoundingClientRect().top - rootTop).toBeLessThan(100);
      const branchButton = child.querySelector('.move-branch-action').getBoundingClientRect();
      expect(firstDirect.top).toBeGreaterThan(branchButton.bottom);

      const originalWidth = root().getBoundingClientRect().width;
      const originalData = page.data;
      page.zoomIn();
      fixture.detectChanges();
      expect(root().getBoundingClientRect().width).toBeGreaterThan(originalWidth);
      viewport.scrollTo(30, 100);
      const navigatedTop = viewport.scrollTop;
      expect(navigatedTop).toBeGreaterThan(0);
      expect(page.data).toBe(originalData);
      expect(requests).toHaveBeenCalledTimes(1);

      accounts = [...accounts, account('new-descendant', 'descendant-7')];
      refresh = new Subject();
      page.loadData();
      fixture.detectChanges();
      expect(getComputedStyle(child).visibility).toBe('visible');
      expect(fixture.nativeElement.querySelector('.initial-network-loading')).toBeNull();
      refresh.next({ current_page: 1, last_page: 1, data: accounts });
      refresh.complete();
      fixture.detectChanges();
      await nextPaint();
      expect(viewport.scrollLeft).toBe(30);
      expect(viewport.scrollTop).toBe(navigatedTop);
      expect(page.zoomPercent).toBe(110);
      expect(viewport.querySelector('[data-node-code="new-descendant"]')).toBeTruthy();
      expect(viewport.querySelector('[data-node-code="WAdz"]')).toBe(child);
      expect(requests).toHaveBeenCalledTimes(2);

      page.resetTreeView();
      fixture.detectChanges();
      await nextPaint();
      expect(page.zoomPercent).toBe(100);
      expect(viewport.scrollLeft).toBe(initialLeft);
      expect(viewport.scrollTop).toBe(initialTop);
      expect(root().getBoundingClientRect().left - viewport.getBoundingClientRect().left)
        .toBeCloseTo(initialRootLeft, 0);
    });
  }
});

describe('Administrative genealogy tree', () => {
 let c: TreeUsersPageComponent; let api: any;
 beforeEach(() => {
  api = jasmine.createSpyObj('api', ['getNetworkRoot','getNetworkMember','getNetworkAccounts','getPointListUser','getAuthenticationUser','getUsersSearch','getUserById']);
  api.getPointListUser.and.returnValue(of({ success: true, data: { network_meta: { total_network: 2, total_directs: 1 }, point_records: [] } }));
  api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'configured-root', is_admin: true } }));
  api.getNetworkRoot.and.returnValue(of({ uuid: 'configured-root', name: 'Company' }));
  api.getNetworkMember.and.returnValue(of({ uuid: 'configured-root', name: 'Company', directos: 1, descendantsCount: 2 }));
  api.getNetworkAccounts.and.callFake((page: number) => of({ current_page: page, last_page: 2, data: page === 1 ? [{ uuid: 'parent', name: 'Parent', sponsor_code: 'configured-root', connected: true }] : [{ uuid: 'child', name: 'Child', sponsor_code: 'parent', connected: true }] }));
  c = new TreeUsersPageComponent(api, {} as any, {} as any);
 });
 it('reads all pages and preserves direct sponsorship independent of purchases', () => {
  c.loadData(); expect(api.getNetworkAccounts).toHaveBeenCalledWith(2);
  expect(c.data.data.id).toBe('configured-root'); expect(c.data.children[0].data.id).toBe('parent'); expect(c.data.children[0].children[0].data.id).toBe('child');
  expect(c.usuarioTotal).toBe(2); expect(c.usuarioDirectos).toBe(1); expect(c.usuarioActivos).toBeNull();
 });
 it('renders the complete administrative tree while counters are pending and keeps page order', () => {
  const points = new Subject<any>();
  const second = new Subject<any>();
  const third = new Subject<any>();
  const account = (uuid: string) => ({ uuid, sponsor_code: 'configured-root', connected: true });
  api.getPointListUser.and.returnValue(points);
  api.getNetworkAccounts.and.returnValues(
    of({ current_page: 1, last_page: 3, data: [account('first')] }), second, third
  );
  c.loadData();
  expect(api.getNetworkAccounts.calls.allArgs()).toEqual([[1], [2], [3]]);
  third.next({ current_page: 3, last_page: 3, data: [account('third')] });
  third.complete();
  expect(c.isChart).toBeFalse();
  second.next({ current_page: 2, last_page: 3, data: [account('second')] });
  second.complete();
  expect(c.data.children.map(node => node.data.id)).toEqual(['first', 'second', 'third']);
  expect(c.areIndicatorsLoading).toBeTrue();
  expect(c.isTreeLoading).toBeFalse();
  points.error(new Error('Counters unavailable'));
  expect(c.indicatorsLoadFailed).toBeTrue();
  expect(c.treeLoadError).toBe('');
 });
 it('re-reads relationships when refreshed after a confirmation', () => {
  c.loadData(); api.getNetworkMember.and.returnValue(of({ uuid: 'configured-root', descendantsCount: 0, directos: 0 }));
  api.getNetworkAccounts.and.returnValue(of({ current_page: 1, last_page: 1, data: [] })); c.loadData();
  expect(c.data.children).toEqual([]); expect(c.usuarioTotal).toBe(2);
 });
 it('does not show a partial tree when another page fails', () => {
  api.getNetworkAccounts.and.callFake((page: number) => page === 1 ? of({ current_page: 1, last_page: 2, data: [] }) : throwError({ status: 500 })); c.loadData();
  expect(c.isChart).toBeFalse(); expect(c.treeLoadError).toBeTruthy();
 });
 it('protects the configured corporate root without hardcoded UUIDs', () => {
  c.loadData(); expect(c.canMoveBranch('configured-root')).toBeFalse(); expect(c.canMoveBranch('new-account')).toBeTrue();
 });
 it('reuses the authenticated root summary before genealogy and skips the points request', () => {
  api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'CONFIGURED-ROOT', is_admin: true,
    network_summary: { total_network: 12, total_directs: 3, total_active: 0 } } }));
  api.getNetworkAccounts.and.returnValue(new Subject());
  c.loadData();
  expect(c.isTreeLoading).toBeTrue();
  expect(c.areIndicatorsLoading).toBeFalse();
  expect([c.usuarioTotal, c.usuarioDirectos, c.usuarioActivos]).toEqual([12, 3, 0]);
  expect(api.getPointListUser).not.toHaveBeenCalled();
  expect(api.getUsersSearch).not.toHaveBeenCalled();
 });
 it('reads the official metrics of a different corporate root and retries without reloading genealogy', () => {
  api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'admin', is_admin: true,
    network_summary: { total_network: 99, total_directs: 99, total_active: 99 } } }));
  api.getUsersSearch.and.returnValue(of({ success: true, data: [{ id: 42, uuid: 'configured-root' }] }));
  const retry = new Subject();
  api.getUserById.and.returnValues(throwError({ status: 503 }), retry);
  c.loadData();
  expect(c.isChart).toBeTrue();
  expect(c.indicatorsLoadFailed).toBeTrue();
  expect(c.usuarioTotal).toBeNull();
  c.retryIndicators();
  c.retryIndicators();
  retry.next({ success: true, data: { uuid: 'configured-root',
    network_summary: { total_network: 2, total_directs: 1, total_active: 0 } } });
  expect([c.usuarioTotal, c.usuarioDirectos, c.usuarioActivos]).toEqual([2, 1, 0]);
  expect(c.areIndicatorsLoading).toBeFalse();
  expect(api.getNetworkRoot).toHaveBeenCalledTimes(1);
  expect(api.getUserById.calls.allArgs()).toEqual([[42], [42]]);
  expect(api.getPointListUser).not.toHaveBeenCalled();
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
   expect(c.areIndicatorsLoading).toBeFalse();
   expect(c.indicatorsLoadFailed).toBeTrue();
  });
  it('shows loading during a retry and finishes with the returned zero counts', () => {
   const response = new Subject();
   api.getPointListUser.and.returnValues(EMPTY, response);
   c.loadData();
   expect(c.areIndicatorsLoading).toBeFalse();
   expect(c.indicatorsLoadFailed).toBeTrue();

   c.loadData();
   expect(c.areIndicatorsLoading).toBeTrue();
   expect(c.indicatorsLoadFailed).toBeFalse();
   response.next({ success: true, data: { network_meta: { total_network: 0, total_directs: 0, total_active: 0 } } });
   response.complete();
   expect(c.areIndicatorsLoading).toBeFalse();
   expect([c.usuarioTotal, c.usuarioDirectos, c.usuarioActivos]).toEqual([0, 0, 0]);
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
  it('publishes the authenticated summary while the single points request is pending', () => {
   api.getAuthenticationUser.and.returnValue(of({ success: true, data: { uuid: 'member',
     network_summary: { total_network: 3, total_directs: 2, total_active: 0 } } }));
   const points = new Subject();
   api.getPointListUser.and.returnValue(points);
   c.loadData();
   expect([c.usuarioTotal, c.usuarioDirectos, c.usuarioActivos]).toEqual([3, 2, 0]);
   expect(c.areIndicatorsLoading).toBeFalse();
   expect(c.isTreeLoading).toBeTrue();
   points.next({ success: true, data: { network_meta: { total_network: 99 }, point_records: [] } });
   expect(c.isChart).toBeTrue();
   expect(c.usuarioTotal).toBe(3);
   expect(api.getPointListUser).toHaveBeenCalledTimes(1);
  });
 });
});
