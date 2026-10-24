import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import {
  ACCOUNT_TYPE_LABELS,
  AccountStatusFilter,
  AccountTypeFilter,
  BankAccountView,
} from '../../../core/models/bank-account.model';
import { Customer } from '../../../core/models/customer.model';
import { AccountService } from '../../../core/services/account.service';
import { CustomerService } from '../../../core/services/customer.service';
import { AccountStatusBadge } from '../../../shared/components/account-status-badge/account-status-badge';
import { MoneyPipe } from '../../../shared/pipes/money-pipe';
import { describeHttpError } from '../../../shared/utilities/http-error';

@Component({
  selector: 'app-account-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, MoneyPipe, AccountStatusBadge],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css',
})
export class AccountList {
  /** Optional query parameter: /accounts?customerId=3 */
  readonly customerId = input<string>();

  private readonly accountService = inject(AccountService);
  private readonly customerService = inject(CustomerService);

  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly pageSize = 10;

  // Filter inputs
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusControl = new FormControl<AccountStatusFilter>('ALL', {
    nonNullable: true,
  });
  protected readonly typeControl = new FormControl<AccountTypeFilter>('ALL', {
    nonNullable: true,
  });
  private readonly searchTerm = signal('');
  private readonly statusFilter = signal<AccountStatusFilter>('ALL');
  private readonly typeFilter = signal<AccountTypeFilter>('ALL');

  /**
   * Starts from the ?customerId query parameter, follows it whenever the
   * URL changes, and can still be set by the dropdown. That two-way
   * behaviour is what linkedSignal is for.
   */
  protected readonly customerFilter = linkedSignal<number | null>(() => {
    const raw = this.customerId();
    const parsed = raw ? Number(raw) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly customerOptions = toSignal(
    this.customerService.listAll().pipe(catchError(() => of([] as Customer[]))),
    { initialValue: [] as Customer[] },
  );

  protected readonly page = signal(1);
  private readonly reloadTick = signal(0);

  // Results
  protected readonly accounts = signal<readonly BankAccountView[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize)),
  );
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize, this.total()),
  );

  private readonly query = computed(() => ({
    search: this.searchTerm(),
    status: this.statusFilter(),
    accountType: this.typeFilter(),
    customerId: this.customerFilter(),
    page: this.page(),
    pageSize: this.pageSize,
    tick: this.reloadTick(),
  }));

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.page.set(1);
      });

    this.statusControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.statusFilter.set(value);
      this.page.set(1);
    });

    this.typeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.typeFilter.set(value);
      this.page.set(1);
    });

    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((q) =>
          this.accountService.list(q).pipe(
            catchError((err) => {
              this.error.set(describeHttpError(err, 'Could not load accounts.'));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (!result) {
          return;
        }
        if (result.items.length === 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          return;
        }
        this.accounts.set(result.items);
        this.total.set(result.total);
      });
  }

  protected onCustomerChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.customerFilter.set(value ? Number(value) : null);
    this.page.set(1);
  }

  protected retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected previousPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }
}