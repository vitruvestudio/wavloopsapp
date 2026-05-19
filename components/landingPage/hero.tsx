import { VideoLoop } from "@/components/landingPage/videoLoop";

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      className="h-[14px] w-[14px] transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="h-[10px] w-[10px] text-text-3"
    >
      <rect x="3" y="6" width="6" height="4" />
      <path d="M4.5 6V4.5a1.5 1.5 0 0 1 3 0V6" />
    </svg>
  );
}

const CAPABILITY_CHIPS = ["Email", "Instagram", "Youtube", "Tiktok", "Discord"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative">
        <div className="mx-auto max-w-5xl px-s-4 pb-s-6 pt-s-6 text-center sm:px-s-5 sm:pb-s-7 sm:pt-s-9">
          <div className="inline-flex items-center gap-s-2 sm:gap-s-3">
            <span aria-hidden className="h-px w-s-4 bg-line-strong sm:w-s-6" />
            <span className="font-mono text-[10px] uppercase tracking-mono-eyebrow text-text-2 sm:text-mono-eyebrow">
              For music producers
            </span>
            <span aria-hidden className="h-px w-s-4 bg-line-strong sm:w-s-6" />
          </div>

          <h1 className="mx-auto mt-s-5 max-w-4xl font-display text-[32px] font-extrabold uppercase leading-[0.88] tracking-[-0.045em] text-text-1 sm:mt-s-6 sm:text-[48px] sm:leading-[0.85] sm:tracking-[-0.05em] md:text-[64px] lg:text-[80px]">
            <span className="relative inline-block rounded-r-1 bg-accent px-[0.18em] pb-[0.04em] text-accent-ink">
              Turn
            </span>{" "}
            your free kits into followers, emails and future buyers.
          </h1>

          <p className="mx-auto mt-s-5 max-w-2xl text-[15px] leading-[1.55] text-text-2 sm:mt-s-6 sm:text-lead">
            Wavloops helps music producers create gated download pages that turn
            every drum kit, loop kit, preset or template into measurable
            audience growth.
          </p>

          <div className="mt-s-5 flex flex-wrap items-center justify-center gap-s-2 sm:mt-s-6">
            {CAPABILITY_CHIPS.map((c) => (
              <span
                key={c}
                className="inline-flex h-[22px] items-center rounded-r-1 border border-line-strong px-s-2 font-mono text-[10px] uppercase tracking-mono-data text-text-2 sm:px-s-3"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Offer card */}
          <div className="wav-grain mx-auto mt-s-6 max-w-2xl overflow-hidden rounded-r-1 border border-line bg-surface-1 text-left sm:mt-s-7">
            <div className="flex items-center justify-between gap-s-2 border-b border-line px-s-3 py-s-2 sm:px-s-4 sm:py-[10px]">
              <div className="flex min-w-0 items-center gap-s-2">
                <span className="h-[6px] w-[6px] flex-shrink-0 bg-accent" />
                <span className="truncate font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-accent">
                  Founding Access
                </span>
              </div>
              <span className="flex-shrink-0 font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                <span className="sm:hidden">13 / 20 left</span>
                <span className="hidden sm:inline">13 of 20 spots remaining</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-s-4 p-s-4 sm:grid-cols-[auto_1fr] sm:gap-s-6 sm:p-s-5">
              <div className="flex flex-col items-start gap-s-1">
                <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                  From
                </span>
                <div className="flex items-baseline gap-s-2">
                  <span className="font-display text-[36px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 sm:text-[40px] md:text-[44px]">
                    $4.99
                  </span>
                  <span className="font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
                    /mo
                  </span>
                </div>
                <span className="font-mono text-mono-caption uppercase tracking-mono-eyebrow text-text-3 line-through">
                  $19/mo regular
                </span>
                <span className="mt-s-1 inline-flex h-[20px] items-center rounded-r-1 bg-accent px-s-2 font-mono text-[9px] uppercase tracking-mono-eyebrow text-accent-ink">
                  Save 74%
                </span>
              </div>

              <div className="flex flex-col gap-s-3 border-l-0 border-t border-line pl-0 pt-s-4 sm:border-l sm:border-t-0 sm:pl-s-6 sm:pt-0">
                <p className="text-[15px] font-semibold leading-snug text-text-1 sm:text-lead-sm">
                  Join the first 20 producers testing Wavloops before
                  private launch.
                </p>
                <ul className="space-y-s-2 text-[13px] text-text-2 sm:text-body">
                  <li className="flex items-start gap-s-2">
                    <span
                      aria-hidden
                      className="mt-[7px] block h-[1px] w-s-3 flex-shrink-0 bg-accent"
                    />
                    <span>Lock founding price for life</span>
                  </li>
                  <li className="flex items-start gap-s-2">
                    <span
                      aria-hidden
                      className="mt-[7px] block h-[1px] w-s-3 flex-shrink-0 bg-accent"
                    />
                    <span>Priority onboarding · we ship your first gate</span>
                  </li>
                  <li className="flex items-start gap-s-2">
                    <span
                      aria-hidden
                      className="mt-[7px] block h-[1px] w-s-3 flex-shrink-0 bg-accent"
                    />
                    <span>Cancel anytime · no credit card today</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-s-6 flex flex-col items-center sm:mt-s-7">
            <a
              href="#waitlist"
              className="group inline-flex w-full max-w-sm items-center justify-center gap-s-3 rounded-r-1 bg-accent px-s-5 py-s-4 text-[14px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px sm:w-auto sm:px-[28px] sm:py-[18px] sm:text-[15px] md:px-[32px] md:py-[20px]"
            >
              Claim Early Access
              <ArrowIcon />
            </a>
            <p className="mt-s-3 px-s-4 text-center font-mono text-mono-caption uppercase tracking-mono-eyebrow text-text-3 sm:mt-s-4 sm:px-0">
              <span className="text-text-1">Private launch June 20</span>{" "}
              <span aria-hidden className="mx-s-1 text-line-strong">·</span>{" "}
              Only 20 founding spots
            </p>
          </div>
        </div>

        {/* Video preview block */}
        <div className="mx-auto max-w-6xl px-s-4 pb-s-7 sm:px-s-5 sm:pb-s-9">
          <div className="relative overflow-hidden rounded-r-2 border border-line-strong bg-bg-deep">
            <div className="flex items-center gap-s-2 border-b border-line px-s-3 py-s-2 sm:gap-s-3 sm:px-s-4 sm:py-s-3">
              <div className="flex items-center gap-s-2">
                <span className="h-[8px] w-[8px] rounded-full bg-line-strong sm:h-[10px] sm:w-[10px]" />
                <span className="h-[8px] w-[8px] rounded-full bg-line-strong sm:h-[10px] sm:w-[10px]" />
                <span className="h-[8px] w-[8px] rounded-full bg-line-strong sm:h-[10px] sm:w-[10px]" />
              </div>
              <div className="ml-s-1 flex min-w-0 flex-1 items-center gap-s-2 rounded-r-1 border border-line bg-surface-1 px-s-2 py-[6px] sm:ml-s-2 sm:px-s-3">
                <LockIcon />
                <span className="truncate font-mono text-[9px] uppercase tracking-mono-data text-text-2 sm:text-mono-tiny">
                  wavloops.app/kits/hardcore-808
                </span>
              </div>
            </div>

            <VideoLoop
              src="/Videos/0519.mp4"
              className="block aspect-video w-full bg-black"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
