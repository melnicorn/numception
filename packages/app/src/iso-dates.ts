/** The `YYYY-MM-DD` dates of `nowMs` (AD-22's `localDate` and `utcDate`). A non-finite time falls back to the epoch. */
export function isoDates(nowMs: number): { readonly localDate: string; readonly utcDate: string } {
  const d = new Date(Number.isFinite(nowMs) ? nowMs : 0);
  const pad = (x: number, w = 2) => String(x).padStart(w, '0');
  return {
    localDate: `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    utcDate: d.toISOString().slice(0, 10),
  };
}
