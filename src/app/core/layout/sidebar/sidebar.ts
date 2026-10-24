import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavSection } from '../../models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  /** Controls the off-canvas drawer on small screens. */
  readonly open = input(false);
  readonly navigated = output<void>();

  protected readonly sections: readonly NavSection[] = [
    {
      heading: 'Overview',
      items: [{ label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' }],
    },
    {
      heading: 'Banking',
      items: [
        { label: 'Customers', path: '/customers', icon: 'bi-people' },
        { label: 'Accounts', path: '/accounts', icon: 'bi-bank' },
        { label: 'Beneficiaries', path: '/beneficiaries', icon: 'bi-person-lines-fill' },
      ],
    },
    {
      heading: 'Transactions',
      items: [
        { label: 'Deposit', path: '/deposit', icon: 'bi-box-arrow-in-down' },
        { label: 'Withdraw', path: '/withdraw', icon: 'bi-box-arrow-up' },
        { label: 'Transfer', path: '/transfer', icon: 'bi-arrow-left-right' },
        { label: 'History', path: '/transactions', icon: 'bi-clock-history' },
        { label: 'Statements', path: '/statements', icon: 'bi-file-earmark-text' },
      ],
    },
  ];
}