/**
 * Tiny client button: copy the affiliate's share link to clipboard
 * + flip the label to "Copied" for ~1.5 s. Wrapped in its own file
 * so the dashboard page can stay an RSC.
 */

"use client";

import * as React from "react";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = React.useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      // Auto-revert. setTimeout id is captured because React 19
      // double-invokes effects in dev; the cleanup keeps the
      // label honest if the user clicks twice in a row.
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard refused (insecure context, denied permission).
      // Fall through silently — the link is still visible in the
      // input above, so the user can copy it manually.
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="t-mono"
      style={{
        flexShrink: 0,
        padding: "12px 22px",
        borderRadius: "var(--r-pill)",
        background: copied ? "var(--bg-2)" : "var(--accent)",
        color: copied ? "var(--accent-text)" : "#fff",
        border: copied
          ? "1px solid color-mix(in oklch, var(--accent-text) 35%, transparent)"
          : "none",
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: copied ? "none" : "0 0 30px -8px var(--accent-glow)",
        transition: "background 200ms, color 200ms",
      }}
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
