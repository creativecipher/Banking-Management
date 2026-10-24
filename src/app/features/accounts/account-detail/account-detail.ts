import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  ACCOUNT_TYPE_LABELS,
  AccountStatus,
  BankAccountView,
} from '../../../core/models/bank-account.model';
import { AccountService } from '../../../core/services/account.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AccountStatusBadge } from '../../../shared/components/account-status-badge/account-status-badge';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MoneyPipe } from '../../../shared/pipes/money-pipe';
import { ALLOWED_TRANSITIONS, checkStatusChange } from '../../../shared/utilities/account-rules';
import { describeHttpError } from '../../../shared/utilities/http-error';
import { formatCustomerId } from '../../../shared/utilities/id-format';

interface StatusAction {
  readonly target: AccountStatus;
  readonly label: string;
  readonly icon: string;
  readonly buttonClass: string;
  readonly dialogClass: string;
  readonly title: string;
  readonly message: string;
}

const STATUS_ACTIONS: readonly StatusAction[] = [
  {
    target: 'FROZEN',
    label: 'Freeze',
    icon: 'bi-snow',
    buttonClass: 'btn-outline-warning',
    dialogClass: 'btn-warning',
    title: 'Freeze account?',
    message: 'Money movements on this account will be blocked until it is unfrozen.',
  },
  {
    target: 'ACTIVE',
    label: 'Unfreeze',
    icon: 'bi-sun',
    buttonClass: 'btn-outline-success',
    dialogClass: 'btn-success',
    title: 'Unfreeze account?',
    message: 'The account will return to normal operation.',
  },
  {
    target: 'INACTIVE',
    label: 'Close account',
    icon: 'bi-x-octagon',
    buttonClass: 'btn-outline-danger',
    dialogClass: 'btn-danger',
    title: 'Close account?',
    message: 'Closing is permanent in this demo: a closed account cannot be reopened or edited.',
  },
];

@Component({
  selector: 'app-account-detail',
  imports: [DatePipe, RouterLink, MoneyPipe, AccountStatusBadge, ConfirmDialog],
  templateUrl: './account-detail.html',
  styleUrl: './account-detail.css',
})
export class AccountDetail {
  /** Bound from the route ':id'. */
  readonly id = input.required<string>();

  private readonly accountService = inject(AccountService);
  private readonly notify = inject(NotificationService);

  protected readonly formatId = formatCustomerId;
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;

  protected readonly account = signal<BankAccountView | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingAction = signal<StatusAction | null>(null);
  protected readonly working = signal(false);

  private readonly reloadTick = signal(0);

  /** Only the actions the lifecycle allows from the current status. */
  protected readonly visibleActions = computed(() => {
    const account = this.account();
    return account
      ? STATUS_ACTIONS.filter((a) => ALLOWED_TRANSITIONS[account.status].includes(a.target))
      : [];
  });

  constructor() {
    toObservable(computed(() => ({ id: this.id(), tick: this.reloadTick() })))
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ id }) =>
          this.accountService.get(Number(id)).pipe(
            catchError((err) => {
              this.error.set(describeHttpError(err, 'Could not load the account.'));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((account) => {
        this.account.set(account);
        this.loading.set(false);
      });
  }

  protected retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  /** Why an action is currently unavailable, or null if it is available. */
  protected blockReason(target: AccountStatus): string | null {
    const account = this.account();
    return account ? checkStatusChange(account, target) : null;
  }

  protected confirmAction(): void {
    const account = this.account();
    const action = this.pendingAction();
    if (!account || !action) {
      return;
    }
    this.working.set(true);
    this.accountService.setStatus(account.id, action.target).subscribe({
      next: (updated) => {
        // Keep the embedded customer; the PATCH response does not include it.
        this.account.set({ ...account, ...updated });
        this.working.set(false);
        this.pendingAction.set(null);
        this.notify.success(`Account is now ${action.target.toLowerCase()}.`);
      },
      error: (err) => {
        this.working.set(false);
        this.pendingAction.set(null);
        this.notify.error(describeHttpError(err, 'Could not update the account.'));
      },
    });
  }
}