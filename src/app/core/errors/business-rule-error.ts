/**
 * A rule violation (e.g. "balance must be zero to close"), as opposed to a
 * network/HTTP failure. Its message is written for end users.
 */
export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}