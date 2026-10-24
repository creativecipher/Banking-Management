import { HttpErrorResponse } from '@angular/common/http';
import { BusinessRuleError } from '../../core/errors/business-rule-error';

/** Turns an unknown error into a message that is safe and useful to show. */
export function describeHttpError(err: unknown, fallback: string): string {
  if (err instanceof BusinessRuleError) {
    return err.message;
  }
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the API. Is JSON Server running? (npm run api)';
    }
    if (err.status === 404) {
      return 'The requested record was not found.';
    }
  }
  return fallback;
}