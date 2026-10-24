import { Routes } from '@angular/router';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    title: 'Accounts',
    loadComponent: () => import('./account-list/account-list').then((m) => m.AccountList),
  },
  // 'new' MUST come before ':id'.
  {
    path: 'new',
    title: 'Open Account',
    loadComponent: () => import('./account-form/account-form').then((m) => m.AccountForm),
  },
  {
    path: ':id',
    title: 'Account Details',
    loadComponent: () => import('./account-detail/account-detail').then((m) => m.AccountDetail),
  },
  {
    path: ':id/edit',
    title: 'Edit Account',
    loadComponent: () => import('./account-form/account-form').then((m) => m.AccountForm),
  },
];