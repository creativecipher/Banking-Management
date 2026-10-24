export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

/** All monetary fields are integer paise (minor units), never floats. */
export interface DashboardStats {
  readonly totalCustomers: number;
  readonly totalAccounts: number;
  readonly totalDepositsMinor: number;
  readonly totalWithdrawalsMinor: number;
  readonly activeAccounts: number;
  readonly frozenAccounts: number;
  readonly inactiveAccounts: number;
}

export interface RecentTransaction {
  readonly reference: string;
  /** ISO 8601 UTC timestamp */
  readonly occurredAt: string;
  readonly type: TransactionType;
  readonly accountNumber: string;
  readonly amountMinor: number;
  readonly status: TransactionStatus;
}