import { Customer } from './customer.model';

export type AccountType = 'SAVINGS' | 'CURRENT';
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'INACTIVE';
export type CurrencyCode = 'INR';

export const ACCOUNT_TYPE_LABELS: Readonly<Record<AccountType, string>> = {
  SAVINGS: 'Savings',
  CURRENT: 'Current',
};

/** All monetary fields are integer paise (minor units), never floats. */
export interface BankAccount {
  readonly id: number;
  readonly customerId: number;
  /** Fictional, 'ACC' + 7 digits. */
  readonly accountNumber: string;
  readonly accountType: AccountType;
  /** Optional label chosen by the holder; the only editable field. */
  readonly nickname?: string;
  readonly openingBalanceMinor: number;
  readonly currentBalanceMinor: number;
  readonly currency: CurrencyCode;
  readonly status: AccountStatus;
  /** ISO 8601 UTC timestamp. */
  readonly openedAt: string;
}

/** An account with its owner embedded (JSON Server's `_expand=customer`). */
export interface BankAccountView extends BankAccount {
  readonly customer?: Customer;
}

/**
 * What the user may supply when opening an account. Number, status,
 * current balance and dates are owned by the system.
 */
export interface OpenAccountInput {
  readonly customerId: number;
  readonly accountType: AccountType;
  readonly openingBalanceMinor: number;
  readonly nickname?: string;
}

/** The only fields a user may change on an existing account. */
export interface AccountUpdateInput {
  readonly nickname: string;
}

export type AccountStatusFilter = 'ALL' | AccountStatus;
export type AccountTypeFilter = 'ALL' | AccountType;

export interface AccountListQuery {
  readonly search: string;
  readonly status: AccountStatusFilter;
  readonly accountType: AccountTypeFilter;
  /** null means all customers. */
  readonly customerId: number | null;
  readonly page: number;
  readonly pageSize: number;
}