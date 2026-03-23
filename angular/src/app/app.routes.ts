import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./sites/admin/admin.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('./sites/main/main.routes').then((m) => m.routes),
  },
];
