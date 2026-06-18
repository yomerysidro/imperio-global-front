import { SideNavInterface } from '../../interfaces/side-nav.type';
export const ROUTES: SideNavInterface[] = [
    {
        path: '/admin/profile',
        title: 'Mis Datos',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'usergroup-add',
        submenu: [],
        show: true
    },
    {
      path: '/admin/membership-plan',
      title: 'Planes de afiliación',
      iconType: 'nzIcon',
      iconTheme: 'outline',
      icon: 'credit-card',
      submenu: [],
      show: true
    },
    {
      path: '/admin/tree-users',
      title: 'Árbol de afiliados',
      iconType: 'nzIcon',
      iconTheme: 'outline',
      icon: 'pie-chart',
      submenu: [],
      show: true
    },
    {
      path: '/admin/marketplace',
      title: 'Tienda de productos',
      iconType: 'nzIcon',
      iconTheme: 'outline',
      icon: 'home',
      submenu: [],
      show: true
    },
    {
      path: '/admin/tools',
      title: 'Herramientas',
      iconType: 'nzIcon',
      iconTheme: 'outline',
      icon: 'tool',
      submenu: [],
      show: true
    },
    {
      path: '/admin/finance',
      title: 'Finanzas Imperio',
      iconType: 'nzIcon',
      iconTheme: 'outline',
      icon: 'account-book',
      submenu: [],
      show: true
    }
]
