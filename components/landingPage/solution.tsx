import { GrowthGateFlowCard } from "@/components/landingPage/growthGateFlowCard";
import {
  CardIcon,
  ChartIcon,
  EnvelopeIcon,
  type IconComponent,
  UserIcon,
} from "@/components/landingPage/icons";

const ASSET_TYPES = [
  "Drum kits",
  "Loop kits",
  "Presets",
  "MIDI",
  "Stems",
  "Sample packs",
  "Templates",
  "Project files",
];

const BENEFITS: { icon: IconComponent; title: string; body: string }[] = [
  {
    icon: EnvelopeIcon,
    title: "Capture emails",
    body: "Build a list you own before giving access to your pack.",
  },
  {
    icon: UserIcon,
    title: "Grow your audience",
    body: "Ask visitors to follow, subscribe or join before unlocking.",
  },
  {
    icon: ChartIcon,
    title: "Track performance",
    body: "See views, downloads, leads and conversion rate.",
  },
  {
    icon: CardIcon,
    title: "Create future buyers",
    body: "Turn free attention into a path toward paid kits, services or community.",
  },
];

export function Solution() {
  return (
    <section id="solution" className="relative overflow-hidden bg-bg-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(43,37,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-s-4 py-s-8 sm:px-s-5 sm:py-s-9">
        <div className="grid gap-s-7 lg:grid-cols-2 lg:gap-s-8">
          {/* LEFT — Growth Gate Flow animated card */}
          <div className="relative">
            <GrowthGateFlowCard />
          </div>

          {/* RIGHT — text + benefits */}
          <div className="flex flex-col gap-s-5 sm:gap-s-6">
            <span className="inline-flex h-[22px] items-center gap-s-2 self-start rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
              <span aria-hidden>●</span>
              The Solution
            </span>

            <h2 className="font-display text-[30px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[40px] md:text-[44px] lg:text-[48px] lg:leading-[0.88] lg:tracking-[-0.045em]">
              Turn every free kit into a growth gate.
            </h2>

            <p className="max-w-xl text-[15px] leading-[1.55] text-text-2 sm:text-lead">
              Create a clean download page, choose what people must do before
              unlocking the file, and start turning free downloads into
              followers, emails and future buyers.
            </p>

            <div className="grid gap-s-3 sm:grid-cols-2">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="flex items-start gap-s-3 rounded-r-1 border border-line bg-surface-1 p-s-4"
                  >
                    <div className="flex h-[36px] w-[36px] flex-shrink-0 items-center justify-center rounded-r-1 border border-line bg-bg-deep text-accent">
                      <Icon />
                    </div>
                    <div className="flex flex-col gap-s-1">
                      <span className="text-[14px] font-semibold leading-snug text-text-1">
                        {b.title}
                      </span>
                      <span className="text-[12px] leading-[1.5] text-text-2">
                        {b.body}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Asset types — broadens perceived use cases + fills column height */}
            <div className="mt-s-2 border-t border-line pt-s-5">
              <div className="flex items-center justify-between gap-s-3">
                <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
                  Works with any free asset
                </span>
                <span className="hidden font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3 sm:inline">
                  No size limit
                </span>
              </div>
              <div className="mt-s-3 flex flex-wrap gap-s-2">
                {ASSET_TYPES.map((type) => (
                  <span
                    key={type}
                    className="inline-flex h-[22px] items-center rounded-r-1 border border-line-strong px-s-3 font-mono text-[10px] uppercase tracking-mono-data text-text-2"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section closing — Outcome + bridge */}
        <div className="mt-s-7 border-t border-line-strong pt-s-5 sm:mt-s-8 sm:pt-s-6">
          <div className="flex flex-col gap-s-4 sm:flex-row sm:items-end sm:justify-between sm:gap-s-6">
            <div className="flex flex-col gap-s-2">
              <div className="flex items-center gap-s-2">
                <span aria-hidden className="h-[12px] w-[3px] bg-accent" />
                <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-3">
                  Outcome
                </span>
              </div>
              <p className="text-[18px] font-semibold leading-snug text-text-1 sm:text-[20px] md:text-title md:font-medium">
                Every download builds audience.{" "}
                <span className="text-accent">Every kit pays you back.</span>
              </p>
            </div>
            <a
              href="#waitlist"
              className="group inline-flex items-center gap-s-2 self-start whitespace-nowrap font-mono text-mono-eyebrow uppercase tracking-mono-button text-text-2 transition-colors duration-wav ease-wav hover:text-text-1 sm:self-end"
            >
              Build your first gate
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
