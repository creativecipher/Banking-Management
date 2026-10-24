import { ValidatorFn } from '@angular/forms';
import { parseMoneyToMinor } from './money';

export const NAME_PATTERN = /^[A-Za-z][A-Za-z '\-]*$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 10-digit Indian mobile number starting with 6-9. */
export const PHONE_PATTERN = /^[6-9]\d{9}$/;
/** Optional account label: letters, digits, spaces, hyphens, apostrophes. */
export const NICKNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 '\-]*$/;

/**
 * Validates a 'YYYY-MM-DD' string: real date, not in the future, and at
 * least `minYears` old. The date is split manually instead of using
 * `new Date('YYYY-MM-DD')`, which is parsed as UTC and can shift the day.
 */
export function minAgeValidator(minYears: number): ValidatorFn {
  return (control) => {
    const value = control.value as string;
    if (!value) {
      return null; // `required` handles empty values
    }
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day || year < 1900) {
      return { invalidDate: true };
    }
    const dob = new Date(year, month - 1, day);
    const today = new Date();
    if (dob > today) {
      return { futureDate: true };
    }
    let age = today.getFullYear() - year;
    const birthdayPassed =
      today.getMonth() > month - 1 ||
      (today.getMonth() === month - 1 && today.getDate() >= day);
    if (!birthdayPassed) {
      age--;
    }
    return age >= minYears ? null : { underAge: { requiredAge: minYears } };
  };
}

/**
 * Validates a rupee amount typed as text ('2500.50'). Money fields are
 * text inputs, not type="number", because a number input hands us a
 * JavaScript float.
 */
export function moneyValidator(maxMinor: number): ValidatorFn {
  return (control) => {
    const value = String(control.value ?? '').trim();
    if (!value) {
      return null; // `required` handles empty values
    }
    const minor = parseMoneyToMinor(value);
    if (minor === null) {
      return { invalidAmount: true };
    }
    return minor > maxMinor ? { maxAmount: { max: maxMinor } } : null;
  };
}