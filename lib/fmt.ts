/**
 * String formatters — port of the prototype's `fmtDate` / `fmtAgo`
 * (data.jsx). Pure, no React, no Date.now (we accept `now` so the
 * functions remain testable + SSR-safe).
 */

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/** "JUN 10, 2026" mono-friendly absolute date. */
export function fmtDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * "TODAY" / "YESTERDAY" / "3D AGO" / "2W AGO" / "5MO AGO" / "1Y AGO"
 * Pass `now` explicitly so the result is stable across SSR + hydrate.
 */
export function fmtAgo(iso: string | Date, now: Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const days = Math.round(
    (now.getTime() - d.getTime()) / 86_400_000,
  );

  if (days <= 0) return "TODAY";
  if (days === 1) return "YESTERDAY";
  if (days < 7) return `${days}D AGO`;
  if (days < 31) return `${Math.floor(days / 7)}W AGO`;
  if (days < 365) return `${Math.floor(days / 30)}MO AGO`;
  return `${Math.floor(days / 365)}Y AGO`;
}

/** "2:48" — seconds → MM:SS. */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
