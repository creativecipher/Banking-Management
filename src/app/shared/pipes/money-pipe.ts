import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats an integer amount in minor units (paise) as currency.
 * Division by 100 happens ONLY here, for display. All arithmetic
 * elsewhere in the app stays on integers.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(minorUnits: number | null | undefined, currency = 'INR'): string {
    if (minorUnits === null || minorUnits === undefined) {
      return '—';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
    }).format(minorUnits / 100);
  }
}