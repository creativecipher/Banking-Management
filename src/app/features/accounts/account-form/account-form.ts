import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ACCOUNT_TYPE_LABELS,
  AccountType,
  BankAccount,
} from '../../../core/models/bank-account.model';
import { Customer } from '../../../core/models/customer.model';
import { AccountService } from '../../../core/services/account.service';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MAX_OPENING_BALANCE_MINOR } from '../../../shared/utilities/account-rules';
import { describeHttpError } from '../../../shared/utilities/http-error';
import { formatCustomerId } from '../../../shared/utilities/id-format';
import { parseMoneyToMinor } from '../../../shared/utilities/money';
import { moneyValidator, NICKNAME_PATTERN } from '../../../shared/utilities/validators';

@Component({
  selector: 'app-account-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './account-form.html',
  styleUrl: './account-form.css',
})
export class AccountForm implements OnInit {
  /** Route parameter of ':id/edit'. Undefined on '/accounts/new'. */
  readonly id = input<string>();
  /** Optional query parameter: /accounts/new?customerId=3 */
  readonly customerId = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly accounts = inject(AccountService);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly formatId = formatCustomerId;
  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly accountTypes: readonly AccountType[] = ['SAVINGS', 'CURRENT'];

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly customers = signal<readonly Customer[]>([]); // open mode
  protected readonly account = signal<BankAccount | null>(null); // edit mode
  protected readonly locked = computed(() => this.account()?.status === 'INACTIVE');

  protected readonly form = this.fb.group({
    // <select> values are strings, so the id is kept as text until submit.
    customerId: ['', [Validators.required]],
    accountType: this.fb.control<AccountType>('SAVINGS', Validators.required),
    openingBalance: ['0', [Validators.required, moneyValidator(MAX_OPENING_BALANCE_MINOR)]],
    nickname: ['', [Validators.maxLength(30), Validators.pattern(NICKNAME_PATTERN)]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      this.loadCustomers();
      return;
    }

    // Edit mode: only the nickname is editable. Disabled controls are
    // skipped by validation, so they cannot block the form.
    this.form.controls.customerId.disable();
    this.form.controls.accountType.disable();
    this.form.controls.openingBalance.disable();

    this.loading.set(true);
    this.accounts.get(Number(id)).subscribe({
      next: (account) => {
        this.account.set(account);
        this.form.patchValue({ nickname: account.nickname ?? '' });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(describeHttpError(err, 'Could not load the account.'));
      },
    });
  }

  protected showErrors(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const nickname = raw.nickname.trim();
    const id = this.id();

    if (id !== undefined) {
      this.saving.set(true);
      this.accounts.update(Number(id), { nickname }).subscribe({
        next: (account) => {
          this.notify.success('Account updated.');
          this.router.navigate(['/accounts', account.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.error(describeHttpError(err, 'Could not update the account.'));
        },
      });
      return;
    }

    const openingBalanceMinor = parseMoneyToMinor(raw.openingBalance);
    if (openingBalanceMinor === null) {
      return; // the validator already blocks this; narrows the type for TypeScript
    }

    this.saving.set(true);
    this.accounts
      .open({
        customerId: Number(raw.customerId),
        accountType: raw.accountType,
        openingBalanceMinor,
        nickname: nickname || undefined,
      })
      .subscribe({
        next: (account) => {
          this.notify.success(`Account ${account.accountNumber} opened.`);
          this.router.navigate(['/accounts', account.id]);
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.error(describeHttpError(err, 'Could not open the account.'));
        },
      });
  }

  private loadCustomers(): void {
    this.loading.set(true);
    this.customerService.listAll('ACTIVE').subscribe({
      next: (list) => {
        this.customers.set(list);
        // Preselect only if the customer is in the (active-only) list;
        // otherwise the select would look empty while holding a value.
        const preset = this.customerId();
        if (preset && list.some((c) => String(c.id) === preset)) {
          this.form.controls.customerId.setValue(preset);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(describeHttpError(err, 'Could not load customers.'));
      },
    });
  }
}