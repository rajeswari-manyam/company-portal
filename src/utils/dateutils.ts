export function countLeaveDays(start: string, end: string): number {
  if (!start || !end) return 0;

  const s = new Date(start);
  const e = new Date(end);

  const diff = e.getTime() - s.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}
export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}