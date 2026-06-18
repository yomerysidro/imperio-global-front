import { Routes } from '@angular/router';

export const CommonLayout_ROUTES: Routes = [
    {
      path: 'profile',
      loadChildren: () => import(`../../pages/admin/administrator/profile/profile-page/profile-page.module`).then(m => m.ProfilePageModule)
    },
    {
      path: 'membership-plan',
      loadChildren: () => import(`../../pages/admin/administrator/membership-plan/membership-plan-page/membership-plan-page.module`).then(m => m.MembershipPlanPageModule)
    },
    {
      path: 'tree-users',
      loadChildren: () => import(`../../pages/admin/administrator/tree-users/tree-users-page/tree-users-page.module`).then(m => m.TreeUsersPageModule)
    },
    {
      path: 'marketplace',
      loadChildren: () => import(`../../pages/admin/administrator/marketplace/marketplace.module`).then(m => m.MarketplaceModule)
    },
    {
      path: 'tools',
      loadChildren: () => import(`../../pages/admin/administrator/tools/tools.module`).then(m => m.ToolsModule)
    },
    {
      path: 'finance',
      loadChildren: () => import(`../../pages/admin/administrator/finance/finance.module`).then(m => m.FinanceModule)
    }

];
