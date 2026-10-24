import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  DashboardStats,
  RecentTransaction,
  TransactionStatus,
  TransactionType,
} from '../../core/models/dashboard.model';
import { MoneyPipe } from '../../shared/pipes/money-pipe';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, MoneyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  // SIMULATED DATA: replaced by real service calls in Phase 5.
  protected readonly stats: DashboardStats = {
    totalCustomers: 124,
    totalAccounts: 187,
    totalDepositsMinor: 482_500_000, // ₹48,25,000.00
    totalWithdrawalsMinor: 213_750_000, // ₹21,37,500.00
    activeAccounts: 160,
    frozenAccounts: 12,
    inactiveAccounts: 15,
  };

  protected readonly recentTransactions: readonly RecentTransaction[] = [
    { reference: 'TXN-20261012-0005', occurredAt: '2026-10-12T05:10:00Z', type: 'DEPOSIT', accountNumber: 'ACC1000001', amountMinor: 2_500_000, status: 'COMPLETED' },
    { reference: 'TXN-20261012-0004', occurredAt: '2026-10-12T04:42:00Z', type: 'WITHDRAWAL', accountNumber: 'ACC1000014', amountMinor: 75_000, status: 'COMPLETED' },
    { reference: 'TXN-20261011-0003', occurredAt: '2026-10-11T11:05:00Z', type: 'TRANSFER', accountNumber: 'ACC1000007', amountMinor: 1_200_000, status: 'COMPLETED' },
    { reference: 'TXN-20261011-0002', occurredAt: '2026-10-11T09:30:00Z', type: 'WITHDRAWAL', accountNumber: 'ACC1000021', amountMinor: 5_000_000, status: 'FAILED' },
    { reference: 'TXN-20261010-0001', occurredAt: '2026-10-10T14:15:00Z', type: 'DEPOSIT', accountNumber: 'ACC1000003', amountMinor: 300_000, status: 'PENDING' },
  ];

  protected readonly statusBadge: Record<TransactionStatus, string> = {
    COMPLETED: 'text-bg-success',
    PENDING: 'text-bg-warning',
    FAILED: 'text-bg-danger',
  };

  protected readonly typeLabel: Record<TransactionType, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER: 'Transfer',
  };
}