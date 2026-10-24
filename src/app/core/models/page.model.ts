export interface Page<T> {
  readonly items: readonly T[];
  /** Total matching records across all pages. */
  readonly total: number;
}