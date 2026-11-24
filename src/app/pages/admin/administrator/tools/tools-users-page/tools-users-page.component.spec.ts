import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ArrowLeftOutline, EllipsisOutline, EyeOutline, FilterOutline, SearchOutline, UserAddOutline } from '@ant-design/icons-angular/icons';
import { ApiService } from '@shared/services/api.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { of, Subject } from 'rxjs';
import { ToolsUsersPageComponent } from './tools-users-page.component';
import { ToolsUsersPageModule } from './tools-users-page.module';

describe('ToolsUsersPageComponent', () => {
  it('renders the user table with server-provided rows', async () => {
    await TestBed.configureTestingModule({
      imports: [
        ToolsUsersPageModule,
        NoopAnimationsModule,
        NzIconModule.forRoot([ArrowLeftOutline, EllipsisOutline, EyeOutline, FilterOutline, SearchOutline, UserAddOutline])
      ],
      providers: [provideRouter([]), {
        provide: ApiService,
        useValue: {
          getUsersFindAll: () => of({
            success: true,
            data: { pagination: { total: 1 }, items: [{ uuid: 'member', name: 'Ana' }] }
          }),
          getPlansSearch: () => of({ data: [] }),
          getAuthenticationUser: () => of({ data: { uuid: 'admin' } })
        }
      }]
    }).compileComponents();
    const fixture = TestBed.createComponent(ToolsUsersPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.user-name')?.textContent.trim()).toBe('Ana');
  });
});

describe('ToolsUsersPageComponent list requests', () => {
  let page: ToolsUsersPageComponent;
  let api: jasmine.SpyObj<any>;

  beforeEach(() => {
    api = jasmine.createSpyObj('ApiService', [
      'getUsersFindAll', 'getPointListUser', 'getPlansSearch', 'getAuthenticationUser'
    ]);
    api.getPlansSearch.and.returnValue(of({ data: [] }));
    api.getAuthenticationUser.and.returnValue(of({ data: { uuid: 'admin' } }));
    page = new ToolsUsersPageComponent(api, {} as any, {} as any, {} as any);
  });

  afterEach(() => page.ngOnDestroy());

  it('loads the first page once and waits to request the network until opening details', () => {
    api.getUsersFindAll.and.returnValue(of({ success: true, data: { pagination: { total: 0 }, items: [] } }));
    page.ngOnInit();
    page.onQueryParamsChange({ pageIndex: 1, pageSize: page.pageSize, sort: [], filter: [] });
    page.onFilterSearch();
    expect(api.getUsersFindAll).toHaveBeenCalledTimes(1);
    expect(api.getPointListUser).not.toHaveBeenCalled();
  });

  it('restarts filtered searches on page one and ignores obsolete results', () => {
    const previous = new Subject();
    const current = new Subject();
    api.getUsersFindAll.and.returnValues(previous, current);
    page.pageIndex = 3;
    page.onSearch();
    page.nameUser = '  Ana ';
    page.onFilterSearch();
    expect(api.getUsersFindAll).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Ana', page: 1 }));
    current.next({ success: true, data: { pagination: { total: 1 }, items: [{ uuid: 'member' }] } });
    previous.next({ success: true, data: { pagination: { total: 99 }, items: [] } });
    expect(page.totalRecord).toBe(1);
    expect(page.tableProducts.map(row => row.user.uuid)).toEqual(['member']);
  });
});
