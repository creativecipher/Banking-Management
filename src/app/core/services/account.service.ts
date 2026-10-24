import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { BusinessRuleError } from '../errors/business-rule-error';
import {
  AccountListQuery,
  AccountStatus,
  AccountUpdateInput,
  BankAccount,
  BankAccountView,
  OpenAccountInput,
} from '../models/bank-account.model';
import { Page } from '../models/page.model';
import { checkStatusChange } from '../../shared/utilities/account-rules';
import { CustomerService } from './customer.service';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly customers = inject(CustomerService);
  private readonly url = `${inject(API_BASE_URL)}/accounts`;

  list(query: AccountListQuery): Observable<Page<BankAccountView>> {
    let params = new HttpParams()
      .set('_expand', 'customer') // embeds the owner as `customer`
      .set('_sort', 'id')
      .set('_order', 'desc')
      .set('_page', query.page)
      .set('_limit', query.pageSize);

    // Account numbers are alphanumeric, so strip everything else. That also
    // removes any chance of a regex-special character reaching `_like`.
    const search = query.search.replace(/[^A-Za-z0-9]/g, '');
    if (search) {
      params = params.set('accountNumber_like', search);
    }
    if (query.status !== 'ALL') {
      params = params.set('status', query.status);
    }
    if (query.accountType !== 'ALL') {
      params = params.set('accountType', query.accountType);
    }
    if (query.customerId !== null) {
      params = params.set('customerId', query.customerId);
    }

    return this.http
      .get<BankAccountView[]>(this.url, { params, observe: 'response' })
      .pipe(
        map((res) => ({
          items: res.body ?? [],
          total: Number(res.headers.get('X-Total-Count') ?? 0),
        })),
      );
  }

  get(id: number): Observable<BankAccountView> {
    const params = new HttpParams().set('_expand', 'customer');
    return this.http.get<BankAccountView>(`${this.url}/${id}`, { params });
  }

  listForCustomer(customerId: number): Observable<BankAccount[]> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('_sort', 'id')
      .set('_order', 'asc');
    return this.http.get<BankAccount[]>(this.url, { params });
  }

  /**
   * MOCK ONLY. Steps: check the customer, pick the next number, insert.
   * The steps are separate requests, so two users opening accounts at the
   * same moment could receive the same number. A real backend uses a
   * database sequence plus a UNIQUE constraint.
   */
  open(input: OpenAccountInput): Observable<BankAccount> {
    return this.customers.get(input.customerId).pipe(
      switchMap((customer) =>
        customer.status === 'ACTIVE'
          ? this.nextAccountNumber()
          : throwError(
              () => new BusinessRuleError('Accounts can only be opened for active customers.'),
            ),
      ),
      switchMap((accountNumber) => {
        const body: Omit<BankAccount, 'id'> = {
          customerId: input.customerId,
          accountNumber,
          accountType: input.accountType,
          ...(input.nickname ? { nickname: input.nickname } : {}),
          openingBalanceMinor: input.openingBalanceMinor,
          currentBalanceMinor: input.openingBalanceMinor,
          currency: 'INR',
          status: 'ACTIVE',
          openedAt: new Date().toISOString(),
        };
        return this.http.post<BankAccount>(this.url, body);
      }),
    );
  }

  /** Only the nickname may change. Balance and status have their own paths. */
  update(id: number, input: AccountUpdateInput): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.url}/${id}`).pipe(
      switchMap((account) =>
        account.status === 'INACTIVE'
          ? throwError(() => new BusinessRuleError('Closed accounts cannot be edited.'))
          : this.http.patch<BankAccount>(`${this.url}/${id}`, { nickname: input.nickname }),
      ),
    );
  }

  /**
   * MOCK ONLY: read, validate, then write as separate requests. Between
   * the read and the write another request could change the account. A
   * real backend does this in one database transaction (row lock or a
   * conditional UPDATE).
   */
  setStatus(id: number, next: AccountStatus): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.url}/${id}`).pipe(
      switchMap((account) => {
        const problem = checkStatusChange(account, next);
        return problem
          ? throwError(() => new BusinessRuleError(problem))
          : this.http.patch<BankAccount>(`${this.url}/${id}`, { status: next });
      }),
    );
  }

  private nextAccountNumber(): Observable<string> {
    const params = new HttpParams()
      .set('_sort', 'accountNumber')
      .set('_order', 'desc')
      .set('_limit', 1);
    return this.http.get<BankAccount[]>(this.url, { params }).pipe(
      map((rows) => {
        const last = rows[0]?.accountNumber; // e.g. 'ACC1000011'
        const lastSequence = last ? Number(last.slice(3)) : 1_000_000;
        return `ACC${lastSequence + 1}`;
      }),
    );
  }
}