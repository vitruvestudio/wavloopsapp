/**
 * Admin authorization — single source of truth.
 *
 * Solo-founder operation: the admin list is hard-coded here as
 * a small const. When the team grows, swap this to an
 * `is_admin` boolean column on profiles and a SQL check; the
 * `isAdminEmail()` signature is the only call site, so the
 * refactor stays small.
 *
 * Used by:
 *   - app/admin/page.tsx           — gates the entire admin
 *                                     surface (server redirect
 *                                     to / when missing).
 *   - app/admin/actions.ts         — every mutating action
 *                                     re-asserts the caller's
 *                                     admin status before
 *                                     touching the DB.
 */

export const ADMIN_EMAILS: ReadonlyArray<string> = [
  "40minsglory@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}
