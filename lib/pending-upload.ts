/**
 * Module-level singleton for the "file the user just picked, about to
 * be uploaded" — the only sane way to thread a `File` object between
 * the Upload modal (on /library) and the setup page (/library/upload)
 * without serialising to disk or losing the binary content.
 *
 * Lifecycle:
 *   1. UploadModal calls `setPendingFile(file)` then router.push to the
 *      setup page.
 *   2. UploadBeatPage on mount calls `consumePendingFile()` once — the
 *      singleton clears itself in the same tick to prevent the same
 *      file being picked up by a second mount (strict-mode double-
 *      invoke is guarded inside the component via a ref).
 *   3. If consume returns null, the setup page redirects to /library
 *      (the user hit /library/upload directly or reloaded mid-flow).
 *
 * NOT persisted to sessionStorage: a File object can't be serialised
 * usefully (only its filename + size + type), so the binary content
 * would be lost. Refresh = restart the flow from /library is the V1
 * trade-off.
 */

let pending: File | null = null;

export function setPendingFile(file: File | null) {
  pending = file;
}

export function consumePendingFile(): File | null {
  const f = pending;
  pending = null;
  return f;
}
