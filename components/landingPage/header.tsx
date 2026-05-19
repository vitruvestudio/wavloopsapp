import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg/60 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-s-4 py-s-3 sm:px-s-5 sm:py-s-4 md:px-[24px] md:py-[20px]">
        <Link
          href="/"
          aria-label="Wavloops home"
          className="flex items-center gap-s-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Photos/wavloops-icon.png"
            alt=""
            className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px] md:h-[20px] md:w-[20px]"
          />
          <span className="font-display text-[16px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 sm:text-[18px] md:text-[20px]">
            Wavloops
          </span>
        </Link>

        <div className="flex items-center gap-s-2 sm:gap-s-3">
          <span className="hidden h-[22px] items-center rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent md:inline-flex">
            <span aria-hidden className="mr-[6px]">●</span>
            20 founding spots
          </span>

          <a
            href="/onboarding_early"
            className="inline-flex items-center justify-center rounded-r-1 bg-accent px-s-3 py-s-3 text-[12px] font-semibold uppercase leading-none tracking-button text-accent-ink transition-colors duration-wav ease-wav hover:bg-accent-hover active:translate-y-px sm:px-s-4 sm:py-[12px] sm:text-[13px] md:px-[22px] md:py-[14px] md:text-[14px]"
          >
            <span className="sm:hidden">Early access</span>
            <span className="hidden sm:inline">Get early access</span>
          </a>
        </div>
      </div>
    </header>
  );
}
