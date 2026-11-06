/** `2025-11-07` → `2025. 11. 7.`, `2025-11` → `2025. 11.`, `2025` → `2025` */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!m) return y;
  if (!d) return `${y}. ${Number(m)}.`;
  return `${y}. ${Number(m)}. ${Number(d)}.`;
}
