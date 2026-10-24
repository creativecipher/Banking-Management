import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { ACCOUNT_TYPE_LABELS, BankAccount } from '../../../core/models/bank-account.model';
import { Customer, CustomerStatus } from '../../../core/models/customer.model';
import { AccountService } from '../../../core/services/account.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AccountStatusBadge } from '../../../shared/components/account-status-badge/account-status-badge';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MoneyPipe } from '../../../shared/pipes/money-pipe';
import { describeHttpError } from '../../../shared/utilities/http-error';
import { formatCustomerId } from '../../../shared/utilities/id-format';

@Component({
  selector: 'app-customer-detail',
  imports: [DatePipe, RouterLink, ConfirmDialog, MoneyPipe, AccountStatusBadge],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail {
  /** Bound from the route ':id'. */
  readonly id = input.required<string>();

  private readonly customerService = inject(CustomerService);
  private readonly accountService = inject(AccountService);
  private readonly notify = inject(NotificationService);

  protected readonly formatId = formatCustomerId;
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly customer = signal<Customer | null>(null);
  protected readonly accounts = signal<readonly BankAccount[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly confirming = signal(false);
  protected readonly toggling = signal(false);

  private readonly reloadTick = signal(0);

  constructor() {
    toObservable(computed(() => ({ id: this.id(), tick: this.reloadTick() })))
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(({ id }) =>
          // Two requests in parallel; emits once both have finished.
          forkJoin({
            customer: this.customerService.get(Number(id)),
            accounts: this.accountService.listForCustomer(Number(id)),
          }).pipe(
            catchError((err) => {
              this.error.set(describeHttpError(err, 'Could not load the customer.'));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.customer.set(result?.customer ?? null);
        this.accounts.set(result?.accounts ?? []);
        this.loading.set(false);
      });
  }

  protected retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected confirmToggle(): void {
    const customer = this.customer();
    if (!customer) {
      return;
    }
    const next: CustomerStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.toggling.set(true);
    this.customerService.setStatus(customer.id, next).subscribe({
      next: (updated) => {
        this.customer.set(updated);
        this.toggling.set(false);
        this.confirming.set(false);
        this.notify.success(`Customer is now ${next.toLowerCase()}.`);
      },
      error: (err) => {
        this.toggling.set(false);
        this.confirming.set(false);
        this.notify.error(describeHttpError(err, 'Could not update the customer.'));
      },
    });
  }
}