/** Up to 9 whole-rupee digits, optional dot, 1-2 decimal digits. No signs, no commas. */
const AMOUNT_PATTERN = /^(\d{1,9})(?:\.(\d{1,2}))?$/;

/**
 * Converts text like '2500.5' into integer paise (250050) using string
 * handling only. No floating-point arithmetic is involved, so there is
 * no 0.1 + 0.2 style rounding error. Returns null for invalid input.
 */
export function parseMoneyToMinor(text: string): number | null {
  const match = AMOUNT_PATTERN.exec(text.trim());
  if (!match) {
    return null;
  }
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  return whole * 100 + fraction;
}