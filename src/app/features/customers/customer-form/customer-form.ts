import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { CustomerInput } from '../../../core/models/customer.model';
import { CustomerService } from '../../../core/services/customer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { describeHttpError } from '../../../shared/utilities/http-error';
import {
  EMAIL_PATTERN,
  minAgeValidator,
  NAME_PATTERN,
  PHONE_PATTERN,
} from '../../../shared/utilities/validators';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css',
})
export class CustomerForm implements OnInit {
  /** Bound from the route ':id/edit'. Undefined on '/customers/new'. */
  readonly id = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly customers = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(NAME_PATTERN)]],
    email: [
      '',
      {
        validators: [Validators.required, Validators.maxLength(100), Validators.pattern(EMAIL_PATTERN)],
        asyncValidators: [this.uniqueEmailValidator()],
      },
    ],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    dateOfBirth: ['', [Validators.required, minAgeValidator(18)]],
    address: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) {
      return;
    }
    this.loading.set(true);
    this.customers.get(Number(id)).subscribe({
      next: (c) => {
        this.form.patchValue({
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          dateOfBirth: c.dateOfBirth,
          address: c.address,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(describeHttpError(err, 'Could not load the customer.'));
      },
    });
  }

  protected showErrors(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected submit(): void {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const input: CustomerInput = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: raw.email.trim().toLowerCase(),
      phone: raw.phone,
      dateOfBirth: raw.dateOfBirth,
      address: raw.address.trim(),
    };

    const id = this.id();
    const request$ =
      id === undefined
        ? this.customers.create(input)
        : this.customers.update(Number(id), input);

    this.saving.set(true);
    request$.subscribe({
      next: (customer) => {
        this.notify.success(id === undefined ? 'Customer created.' : 'Customer updated.');
        this.router.navigate(['/customers', customer.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.notify.error(describeHttpError(err, 'Could not save the customer.'));
      },
    });
  }

  /**
   * Async validators run only after all sync validators pass. timer() adds
   * a 400 ms debounce: Angular unsubscribes from the previous run whenever
   * the value changes, which cancels the timer before any request is made.
   */
  private uniqueEmailValidator(): AsyncValidatorFn {
    return (control) => {
      const value = control.value as string;
      if (!value) {
        return of(null);
      }
      const editingId = this.id() === undefined ? undefined : Number(this.id());
      return timer(400).pipe(
        switchMap(() => this.customers.emailExists(value, editingId)),
        map((exists) => (exists ? { emailTaken: true } : null)),
        catchError(() => of(null)), // network trouble must not block the form
      );
    };
  }
}