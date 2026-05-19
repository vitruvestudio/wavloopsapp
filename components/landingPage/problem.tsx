import {
  CardIcon,
  ChartIcon,
  EnvelopeIcon,
  type IconComponent,
  UserIcon,
} from "@/components/landingPage/icons";

const PAIN_POINTS: { icon: IconComponent; title: string; body: string }[] = [
  {
    icon: EnvelopeIcon,
    title: "No emails collected",
    body: "You lose the chance to build an audience you actually own.",
  },
  {
    icon: UserIcon,
    title: "No follower growth",
    body: "People download your pack and disappear without connecting to your brand.",
  },
  {
    icon: ChartIcon,
    title: "No performance data",
    body: "You don't know who downloaded, what worked, or what to improve.",
  },
  {
    icon: CardIcon,
    title: "No path to future buyers",
    body: "Your free value never turns into paid kits, services or community.",
  },
];

const ZERO_METRICS: { icon: IconComponent; value: string; label: string }[] = [
  { icon: EnvelopeIcon, value: "00", label: "Emails" },
  { icon: UserIcon, value: "00", label: "Followers" },
  { icon: ChartIcon, value: "00", label: "Data" },
  { icon: CardIcon, value: "00", label: "Future buyers" },
];

const STAGNANT_BARS = [8, 12, 6, 14, 10, 16, 9, 12, 7, 15, 11, 13, 8, 14, 10, 12, 9, 13];

export function Problem() {
  return (
    <section id="problem" className="relative overflow-hidden bg-bg-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-s-4 py-s-8 sm:px-s-5 sm:py-s-9">
        <div className="grid gap-s-7 lg:grid-cols-2 lg:gap-s-8">
          {/* LEFT — text + pain points */}
          <div className="flex flex-col gap-s-5 sm:gap-s-6">
            <span className="inline-flex h-[22px] items-center gap-s-2 self-start rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
              <span aria-hidden>●</span>
              Broken Free Downloads
            </span>

            <h2 className="font-display text-[30px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[40px] md:text-[44px] lg:text-[48px] lg:leading-[0.88] lg:tracking-[-0.045em]">
              Free downloads without a system don&apos;t grow your brand.
            </h2>

            <p className="max-w-xl text-[15px] leading-[1.55] text-text-2 sm:text-lead">
              A free kit can create attention. But without a gate, you lose the
              chance to turn that attention into emails, followers, data and
              future buyers.
            </p>

            <div className="grid gap-s-3 sm:grid-cols-2">
              {PAIN_POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="flex items-start gap-s-3 rounded-r-1 border border-line bg-surface-1 p-s-4"
                  >
                    <div className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-r-1 border border-line bg-bg-deep text-text-2">
                      <Icon />
                    </div>
                    <div className="flex flex-col gap-s-1">
                      <span className="text-[14px] font-semibold leading-snug text-text-1">
                        {p.title}
                      </span>
                      <span className="text-[12px] leading-[1.5] text-text-2">
                        {p.body}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — dashboard mockup */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-r-2 border border-line-strong bg-surface-1">
              <div className="flex items-center justify-between gap-s-2 border-b border-line px-s-3 py-s-3 sm:px-s-4">
                <div className="flex min-w-0 items-center gap-s-2">
                  <span className="h-[6px] w-[6px] flex-shrink-0 bg-accent" />
                  <span className="truncate font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
                    Old way performance
                  </span>
                </div>
                <span className="flex-shrink-0 font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                  Last 30 days
                </span>
              </div>

              <div className="flex flex-col gap-s-5 p-s-4 sm:p-s-5">
                {/* URL block */}
                <div>
                  <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                    Free kit link
                  </span>
                  <div className="mt-s-2 flex items-center gap-s-2 rounded-r-1 border border-line bg-bg-deep px-s-3 py-s-3">
                    <span
                      aria-hidden
                      className="font-mono text-mono-eyebrow text-text-3"
                    >
                      ↗
                    </span>
                    <span className="truncate font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
                      drive.google.com/free-kit.zip
                    </span>
                  </div>
                </div>

                {/* Big metric block */}
                <div className="rounded-r-1 border border-line bg-bg-deep p-s-4">
                  <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                    Total downloads
                  </span>
                  <div className="mt-s-2 flex items-baseline gap-s-3">
                    <span className="font-display text-[48px] font-extrabold uppercase leading-none tracking-[-0.045em] text-text-1 sm:text-[60px] md:text-[72px]">
                      1,247
                    </span>
                    <span className="font-mono text-mono-eyebrow uppercase tracking-mono-data text-text-2">
                      kits sent
                    </span>
                  </div>
                  <div className="mt-s-4 flex h-[20px] items-end gap-[3px]">
                    {STAGNANT_BARS.map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 bg-text-1 opacity-25"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Zero metrics grid */}
                <div>
                  <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                    Conversions
                  </span>
                  <div className="mt-s-2 grid grid-cols-2 overflow-hidden rounded-r-1 border border-line">
                    {ZERO_METRICS.map((m, i) => {
                      const Icon = m.icon;
                      return (
                        <div
                          key={m.label}
                          className={`flex items-center justify-between gap-s-2 bg-bg-deep p-s-3 ${
                            i % 2 === 0 ? "border-r border-line" : ""
                          } ${i < 2 ? "border-b border-line" : ""}`}
                        >
                          <span className="font-display text-[26px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-3 sm:text-[32px]">
                            {m.value}
                          </span>
                          <div className="flex items-center gap-s-2 text-text-2">
                            <Icon />
                            <span className="text-right font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow">
                              {m.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Closing line — Hanken sentence-case breaks the mono pattern */}
                <div className="border-t border-line pt-s-4">
                  <p className="text-[14px] leading-snug text-text-2 sm:text-body">
                    Downloads happened.{" "}
                    <span className="font-semibold text-text-1">
                      Growth did not.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section closing — Diagnosis verdict + bridge to solution */}
        <div className="mt-s-7 border-t border-line-strong pt-s-5 sm:mt-s-8 sm:pt-s-6">
          <div className="flex flex-col gap-s-4 sm:flex-row sm:items-end sm:justify-between sm:gap-s-6">
            <div className="flex flex-col gap-s-2">
              <div className="flex items-center gap-s-2">
                <span aria-hidden className="h-[12px] w-[3px] bg-accent" />
                <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-3">
                  Diagnosis
                </span>
              </div>
              <p className="text-[18px] font-semibold leading-snug text-text-1 sm:text-[20px] md:text-title md:font-medium">
                Same kit. Different system.{" "}
                <span className="text-accent">Different outcome.</span>
              </p>
            </div>
            <a
              href="#solution"
              className="group inline-flex items-center gap-s-2 self-start whitespace-nowrap font-mono text-mono-eyebrow uppercase tracking-mono-button text-text-2 transition-colors duration-wav ease-wav hover:text-text-1 sm:self-end"
            >
              The fix
              <span
                aria-hidden
                className="transition-transform duration-wav ease-wav group-hover:translate-x-[2px]"
              >
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
