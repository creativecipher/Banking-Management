/** Display form of a customer id, e.g. 7 becomes 'CUS-000007'. */
export function formatCustomerId(id: number): string {
  return `CUS-${String(id).padStart(6, '0')}`;
}