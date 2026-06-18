/**
 * Constants + types for the role-switcher cookie.
 *
 * Lives in its own module because a "use server" file (which
 * mode-switch.ts is) is only allowed to export async functions —
 * exporting a constant or a type from there is a build-time error
 * in Next.js. So we keep mode-switch.ts pure-actions and import
 * these shared bits from here.
 */

export const LAST_MODE_COOKIE = "wlp_last_mode";
export type LastMode = "producer" | "artist";
