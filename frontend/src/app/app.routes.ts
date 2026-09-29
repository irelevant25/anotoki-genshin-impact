import { Routes } from '@angular/router';
import { adminAccessGuard } from './sites/admin/admin-access.guard';

export const routes: Routes = [
  {
    path: 'admin',
    canMatch: [adminAccessGuard],
    loadChildren: () => import('./sites/admin/admin.routes').then((m) => m.routes),
  },
  {
    // Whoever the guard above turned away, at the address they asked for: a
    // player is told the panel is not theirs, and somebody not signed in sees
    // this for the moment before the IAM's sign-in page loads.
    path: 'admin',
    children: [
      {
        path: '**',
        loadComponent: () => import('./sites/admin/no-access/no-access.component').then((m) => m.AdminNoAccessComponent),
      },
    ],
  },
  {
    path: '',
    loadChildren: () => import('./sites/main/main.routes').then((m) => m.routes),
  },
];
