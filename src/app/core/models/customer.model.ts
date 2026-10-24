export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  /** 10-digit fictional mobile number. */
  readonly phone: string;
  readonly address: string;
  /** Calendar date, 'YYYY-MM-DD'. Not a timestamp, so there is no time zone. */
  readonly dateOfBirth: string;
  readonly status: CustomerStatus;
  /** ISO 8601 UTC timestamp. */
  readonly createdAt: string;
}

/**
 * What the user may supply. `id`, `status` and `createdAt` are owned by
 * the system, so the form can never set them.
 */
export type CustomerInput = Omit<Customer, 'id' | 'status' | 'createdAt'>;

export type CustomerStatusFilter = 'ALL' | CustomerStatus;

export interface CustomerListQuery {
  readonly search: string;
  readonly status: CustomerStatusFilter;
  readonly page: number;
  readonly pageSize: number;
}