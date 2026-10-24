import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import {
  Customer,
  CustomerStatus,
  CustomerStatusFilter,
} from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { describeHttpError } from '../../../shared/utilities/http-error';
import { formatCustomerId } from '../../../shared/utilities/id-format';

@Component({
  selector: 'app-customer-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, ConfirmDialog],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerList {
  private readonly customerService = inject(CustomerService);
  private readonly notify = inject(NotificationService);

  protected readonly formatId = formatCustomerId;
  protected readonly pageSize = 10;

  // Filter inputs
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusControl = new FormControl<CustomerStatusFilter>('ALL', {
    nonNullable: true,
  });
  private readonly searchTerm = signal('');
  private readonly statusFilter = signal<CustomerStatusFilter>('ALL');
  protected readonly page = signal(1);
  private readonly reloadTick = signal(0);

  // Results
  protected readonly customers = signal<readonly Customer[]>([]);
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

  // Activate / deactivate confirmation
  protected readonly pendingToggle = signal<Customer | null>(null);
  protected readonly toggling = signal(false);

  private readonly query = computed(() => ({
    search: this.searchTerm(),
    status: this.statusFilter(),
    page: this.page(),
    pageSize: this.pageSize,
    tick: this.reloadTick(),
  }));

  constructor() {
    // Wait 300 ms after the last keystroke before searching.
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.page.set(1);
      });

    this.statusControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        this.statusFilter.set(value);
        this.page.set(1);
      });

    // Every change to `query` triggers a request. switchMap cancels the
    // previous in-flight request, so a slow old response can never overwrite
    // a newer one.
    toObservable(this.query)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((q) =>
          this.customerService.list(q).pipe(
            catchError((err) => {
              this.error.set(describeHttpError(err, 'Could not load customers.'));
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
        // Landed on a page that no longer exists (e.g. last row deactivated).
        if (result.items.length === 0 && this.page() > 1) {
          this.page.update((p) => p - 1);
          return;
        }
        this.customers.set(result.items);
        this.total.set(result.total);
      });
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

  protected askToggle(customer: Customer): void {
    this.pendingToggle.set(customer);
  }

  protected cancelToggle(): void {
    this.pendingToggle.set(null);
  }

  protected confirmToggle(): void {
    const customer = this.pendingToggle();
    if (!customer) {
      return;
    }
    const next: CustomerStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.toggling.set(true);
    this.customerService.setStatus(customer.id, next).subscribe({
      next: () => {
        this.toggling.set(false);
        this.pendingToggle.set(null);
        this.notify.success(
          `${customer.firstName} ${customer.lastName} is now ${next.toLowerCase()}.`,
        );
        this.reloadTick.update((n) => n + 1);
      },
      error: (err) => {
        this.toggling.set(false);
        this.notify.error(describeHttpError(err, 'Could not update the customer.'));
      },
    });
  }
}