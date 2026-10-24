import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    title: 'Customers',
    loadComponent: () =>
      import('./customer-list/customer-list').then((m) => m.CustomerList),
  },
  // 'new' MUST come before ':id', otherwise "new" is treated as an id.
  {
    path: 'new',
    title: 'New Customer',
    loadComponent: () =>
      import('./customer-form/customer-form').then((m) => m.CustomerForm),
  },
  {
    path: ':id',
    title: 'Customer Details',
    loadComponent: () =>
      import('./customer-detail/customer-detail').then((m) => m.CustomerDetail),
  },
  {
    path: ':id/edit',
    title: 'Edit Customer',
    loadComponent: () =>
      import('./customer-form/customer-form').then((m) => m.CustomerForm),
  },
];