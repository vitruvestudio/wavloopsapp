/**
 * AnnouncementBar — Wavloops Release OS landing
 *
 * Thin (36px) opaque dark strip pinned to the very top of the page above
 * the Topbar. Surfaces the live founding-access offer as a persistent
 * scarcity signal: accent dot pulse + mono uppercase fact-row separated by
 * middots.
 *
 * Stacking:
 *   - z-[55] sits above the Topbar (z-50) — though they don't visually
 *     overlap (Topbar is offset to top-[36px] in its own file).
 *   - Opaque bg-bg-deep + border-b → readable regardless of what's behind.
 *
 * Responsive: text scales down on small phones via a 9px → 10.5px clamp.
 * "20 spots" + its surrounding separator are hidden < 480px to keep the
 * line readable on the narrowest screens.
 *
 * Wire-up: render this BEFORE <Topbar /> in `app/release-os/page.tsx`.
 */

export function AnnouncementBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[55] border-b border-line bg-bg-deep">
      <div className="mx-auto flex h-[36px] max-w-[1200px] items-center justify-center gap-[10px] px-5 sm:px-8">
        {/* live dot — accent core + accent-soft halo */}
        <span
          aria-hidden
          className="h-[5px] w-[5px] shrink-0 rounded-full bg-accent"
          style={{ boxShadow: "0 0 0 3px var(--accent-soft)" }}
        />

        {/* fact row — mono uppercase, middots separators, accent on the lead */}
        <p className="m-0 truncate font-mono text-[9px] uppercase tracking-[0.13em] text-text-2 sm:text-[10.5px]">
          <span className="font-medium text-accent">
            Founding access available
          </span>
          <span aria-hidden className="mx-[8px] text-line-strong">
            ·
          </span>
          <span className="text-text-1">$4.99/mo</span>
          <span
            aria-hidden
            className="mx-[8px] text-line-strong max-[480px]:hidden"
          >
            ·
          </span>
          <span className="max-[480px]:hidden">20 spots</span>
          <span aria-hidden className="mx-[8px] text-line-strong">
            ·
          </span>
          <span>Launches Sept 1</span>
        </p>
      </div>
    </div>
  );
}
