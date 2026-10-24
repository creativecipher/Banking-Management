import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap, throwError } from 'rxjs';
import { BusinessRuleError } from '../errors/business-rule-error';
import { API_BASE_URL } from '../config/api.config';
import {
  Customer,
  CustomerInput,
  CustomerListQuery,
  CustomerStatus,
} from '../models/customer.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly url = `${this.baseUrl}/customers`;

  list(query: CustomerListQuery): Observable<Page<Customer>> {
    let params = new HttpParams()
      .set('_sort', 'id')
      .set('_order', 'desc')
      .set('_page', query.page)
      .set('_limit', query.pageSize);

    const search = query.search.trim();
    if (search) {
      params = params.set('q', search); // JSON Server full-text search
    }
    if (query.status !== 'ALL') {
      params = params.set('status', query.status);
    }

    // observe: 'response' gives us the headers, which carry the total count.
    return this.http
      .get<Customer[]>(this.url, { params, observe: 'response' })
      .pipe(
        map((res) => ({
          items: res.body ?? [],
          total: Number(res.headers.get('X-Total-Count') ?? 0),
        })),
      );
  }

  /** Unpaginated list for dropdowns. Fine for a demo; a real app would use a typeahead. */
  listAll(status?: CustomerStatus): Observable<Customer[]> {
    let params = new HttpParams().set('_sort', 'firstName').set('_order', 'asc');
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Customer[]>(this.url, { params });
  }

  get(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }

  create(input: CustomerInput): Observable<Customer> {
    // In a real backend the SERVER assigns id, status and createdAt.
    const body: Omit<Customer, 'id'> = {
      ...input,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    return this.http.post<Customer>(this.url, body);
  }

  update(id: number, input: CustomerInput): Observable<Customer> {
    return this.http.patch<Customer>(`${this.url}/${id}`, input);
  }

  /**
   * Reactivation is always allowed. Deactivation is refused while the
   * customer still has any account that is not closed.
   */
  setStatus(id: number, status: CustomerStatus): Observable<Customer> {
    const patch$ = this.http.patch<Customer>(`${this.url}/${id}`, { status });
    if (status === 'ACTIVE') {
      return patch$;
    }
    return this.countOpenAccounts(id).pipe(
      switchMap((open) =>
        open > 0
          ? throwError(
              () =>
                new BusinessRuleError(
                  `This customer still has ${open} open account${open === 1 ? '' : 's'}. ` +
                    `Close ${open === 1 ? 'it' : 'them'} before deactivating the customer.`,
                ),
            )
          : patch$,
      ),
    );
  }

  /** True if another customer already uses this email. */
  emailExists(email: string, excludeId?: number): Observable<boolean> {
    const params = new HttpParams().set('email', email.trim().toLowerCase());
    return this.http
      .get<Customer[]>(this.url, { params })
      .pipe(map((rows) => rows.some((row) => row.id !== excludeId)));
  }

  private countOpenAccounts(customerId: number): Observable<number> {
    const params = new HttpParams()
      .set('customerId', customerId)
      .set('status_ne', 'INACTIVE') // JSON Server "not equal" operator
      .set('_page', 1)
      .set('_limit', 1); // we only need the count header, not the rows
    return this.http
      .get<unknown[]>(`${this.baseUrl}/accounts`, { params, observe: 'response' })
      .pipe(map((res) => Number(res.headers.get('X-Total-Count') ?? 0)));
  }
}