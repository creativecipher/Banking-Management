import { AccountStatus, BankAccount } from '../../core/models/bank-account.model';

/** Demo limit: ₹1,00,00,000 in paise. */
export const MAX_OPENING_BALANCE_MINOR = 1_000_000_000;

/**
 * The account lifecycle as data. INACTIVE (closed) is terminal in this demo.
 *   ACTIVE <-> FROZEN, and either can become INACTIVE.
 */
export const ALLOWED_TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  ACTIVE: ['FROZEN', 'INACTIVE'],
  FROZEN: ['ACTIVE', 'INACTIVE'],
  INACTIVE: [],
};

/**
 * Returns a human-readable reason why the change is not allowed, or null if
 * it is allowed. The UI uses it to disable buttons; the service uses it to
 * refuse the request. A real backend must run the same rule server-side.
 */
export function checkStatusChange(
  account: Pick<BankAccount, 'status' | 'currentBalanceMinor'>,
  next: AccountStatus,
): string | null {
  if (!ALLOWED_TRANSITIONS[account.status].includes(next)) {
    return account.status === 'INACTIVE'
      ? 'This account is closed and cannot be changed.'
      : `An account cannot move from ${account.status} to ${next}.`;
  }
  if (next === 'INACTIVE' && account.currentBalanceMinor !== 0) {
    return 'An account can only be closed when its balance is zero.';
  }
  return null;
}