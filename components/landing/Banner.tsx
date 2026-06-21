/**
 * Landing — top-of-page promo banner.
 *
 * Renders the singleton public.landing_banner row read by
 * app/page.tsx on every visit. When is_active is false or the
 * message is empty, the component returns null so nothing
 * ships to the DOM (no wasted layout, no a11y noise).
 *
 * The bar sits ABOVE the fixed LandingHeader so it doesn't
 * fight the header's frosted-on-scroll treatment. The header
 * still floats over the hero — only the banner takes its top
 * row.
 */

import * as React from "react";

export interface LandingBannerProps {
  message: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  variant: "info" | "promo" | "warning";
  isActive: boolean;
}

export function LandingBanner({
  message,
  ctaLabel,
  ctaHref,
  variant,
  isActive,
}: LandingBannerProps) {
  if (!isActive || !message.trim()) return null;

  const tone =
    variant === "promo"
      ? {
          bg: "linear-gradient(90deg, var(--accent) 0%, oklch(0.42 0.16 268) 100%)",
          fg: "var(--accent-fg)",
          border: "color-mix(in oklch, var(--accent-text) 50%, transparent)",
        }
      : variant === "warning"
        ? {
            bg: "var(--danger-surface)",
            fg: "var(--danger)",
            border: "color-mix(in oklch, var(--danger) 35%, transparent)",
          }
        : {
            bg: "var(--bg-2)",
            fg: "var(--fg-1)",
            border: "var(--border-1)",
          };

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="relative w-full"
      style={{
        background: tone.bg,
        color: tone.fg,
        borderBottom: `1px solid ${tone.border}`,
        // Sit ABOVE the fixed header (which is z-50) so the
        // banner stays in flow but visually rests at the top.
        zIndex: 60,
      }}
    >
      <div
        className="mx-auto flex items-center justify-center text-center flex-wrap"
        style={{
          maxWidth: 1280,
          padding: "10px 24px",
          gap: 12,
          fontSize: 13,
          fontFamily: "var(--font-body)",
          fontWeight: 500,
        }}
      >
        <span>{message}</span>
        {ctaLabel && ctaHref && (
          <a
            href={ctaHref}
            className="inline-flex items-center"
            style={{
              gap: 4,
              padding: "4px 12px",
              borderRadius: "var(--r-pill)",
              border: "1px solid currentColor",
              textDecoration: "none",
              color: tone.fg,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
          >
            {ctaLabel} →
          </a>
        )}
      </div>
    </div>
  );
}
