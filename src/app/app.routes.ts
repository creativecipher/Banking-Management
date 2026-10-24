import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell/shell';

const placeholder = () =>
  import('./shared/components/page-placeholder/page-placeholder').then(
    (m) => m.PagePlaceholder,
  );

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'customers',
        loadChildren: () =>
          import('./features/customers/customers.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'accounts',
        loadChildren: () =>
          import('./features/accounts/accounts.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      { path: 'deposit', title: 'Deposit', loadComponent: placeholder, data: { heading: 'Deposit', phase: 5 } },
      { path: 'withdraw', title: 'Withdraw', loadComponent: placeholder, data: { heading: 'Withdraw', phase: 5 } },
      { path: 'transfer', title: 'Fund Transfer', loadComponent: placeholder, data: { heading: 'Fund Transfer', phase: 6 } },
      { path: 'transactions', title: 'Transactions', loadComponent: placeholder, data: { heading: 'Transaction History', phase: 5 } },
      { path: 'beneficiaries', title: 'Beneficiaries', loadComponent: placeholder, data: { heading: 'Beneficiaries', phase: 7 } },
      { path: 'statements', title: 'Statements', loadComponent: placeholder, data: { heading: 'Account Statements', phase: 7 } },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
