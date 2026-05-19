import type { IconComponent } from "@/components/landingPage/icons";
import {
  DiscordIcon,
  EnvelopeIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/landingPage/icons";
import { TimedDropTimer } from "@/components/landingPage/timedDropTimer";

const SOCIALS: { Icon: IconComponent; label: string }[] = [
  { Icon: InstagramIcon, label: "Instagram" },
  { Icon: YoutubeIcon, label: "Youtube" },
  { Icon: TiktokIcon, label: "Tiktok" },
  { Icon: DiscordIcon, label: "Discord" },
  { Icon: EnvelopeIcon, label: "Email" },
];

const SECONDARY_LINKS = [
  "Latest Cookup",
  "Join Discord",
  "Get Premium Kit",
  "BeatStars Store",
];

function VisualAtmosphere({
  origin = "top-left",
}: {
  origin?: "top-left" | "bottom-right";
}) {
  const gradient =
    origin === "top-left"
      ? "radial-gradient(ellipse 60% 60% at 0% 0%, rgba(43,37,255,0.08), transparent 70%)"
      : "radial-gradient(ellipse 60% 60% at 100% 100%, rgba(43,37,255,0.08), transparent 70%)";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: gradient }}
    />
  );
}

function ProducerBioHubVisual() {
  return (
    <div className="relative flex h-full flex-col bg-bg-deep p-s-5 sm:p-s-6">
      <VisualAtmosphere />

      <div className="relative flex items-center justify-between gap-s-2">
        <div className="flex items-center gap-s-2">
          <span className="h-[6px] w-[6px] bg-accent" />
          <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
            Producer bio hub
          </span>
        </div>
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          wvloops.app/40minsmusic
        </span>
      </div>

      <div className="relative mt-s-5 flex flex-col items-center gap-s-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Photos/40mins_img.jpeg"
          alt=""
          loading="lazy"
          className="h-[52px] w-[52px] rounded-r-2 border border-line-strong object-cover"
        />
        <span className="text-[16px] font-semibold leading-none text-text-1">
          40minsmusic
        </span>
        <span className="font-mono text-[10px] uppercase tracking-mono-data text-text-2">
          @40minsmusic
        </span>
      </div>

      <div className="relative mt-s-4 flex items-center justify-center gap-s-2">
        {SOCIALS.map(({ Icon, label }) => (
          <span
            key={label}
            aria-label={label}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-r-1 border border-line-strong bg-surface-2 text-text-1 transition-colors duration-wav ease-wav hover:border-accent hover:text-accent"
          >
            <Icon />
          </span>
        ))}
      </div>

      <div className="relative mt-s-5 rounded-r-1 border border-line border-l-2 border-l-accent bg-surface-1 p-s-4">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-accent">
          Featured kit
        </span>
        <p className="mt-s-1 font-display text-[18px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1">
          Night / Shift 03
        </p>
        <p className="mt-[4px] text-[12px] leading-snug text-text-2">
          Free Dark Trap Drum Kit
        </p>
        <div className="mt-s-3 flex w-full items-center justify-center gap-s-2 rounded-r-1 bg-accent px-s-3 py-s-3 text-[12px] font-semibold uppercase leading-none tracking-button text-accent-ink">
          Unlock free kit
          <span aria-hidden>→</span>
        </div>
      </div>

      <div className="relative mt-s-4 flex flex-col">
        {SECONDARY_LINKS.map((link, i) => (
          <div
            key={link}
            className={`flex items-center justify-between gap-s-2 py-s-2 text-text-2 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="text-[12px]">{link}</span>
            <span aria-hidden className="text-[12px] text-text-3">
              →
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-auto pt-s-4 text-center">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Powered by Wavloops
        </span>
      </div>
    </div>
  );
}

function TimedDropVisual() {
  return (
    <div className="relative flex h-full flex-col bg-bg-deep p-s-5 sm:p-s-6">
      <VisualAtmosphere origin="bottom-right" />

      <div className="relative flex items-start justify-between gap-s-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-s-2">
            <span className="h-[6px] w-[6px] bg-accent" />
            <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-1">
              Timed drop
            </span>
          </div>
          <span className="mt-[4px] font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            Night / Shift 03
          </span>
        </div>
        <span className="inline-flex h-[22px] items-center gap-s-1 rounded-r-1 border border-accent px-s-2 font-mono text-[10px] uppercase tracking-mono-data text-accent">
          <span aria-hidden className="animate-pulse">●</span>
          Live
        </span>
      </div>

      <div className="relative mt-s-7 flex flex-col items-center text-center sm:mt-s-8">
        <TimedDropTimer className="font-display text-[48px] font-extrabold uppercase leading-none tracking-[-0.045em] text-text-1 tabular-nums sm:text-[60px] md:text-[68px]" />
        <div className="mt-s-3 flex items-center gap-s-3 font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          <span>Hours</span>
          <span aria-hidden>·</span>
          <span>Mins</span>
          <span aria-hidden>·</span>
          <span>Secs</span>
        </div>
        <p className="mt-s-3 text-[13px] text-text-2">
          Free access expires soon
        </p>
      </div>

      <div className="relative mt-s-6">
        <div className="flex items-center justify-between gap-s-2">
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
            Access window
          </span>
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-1">
            61% remaining
          </span>
        </div>
        <div className="mt-s-2 h-[3px] w-full overflow-hidden bg-line-strong">
          <div
            aria-hidden
            className="h-full bg-accent"
            style={{ width: "61%" }}
          />
        </div>
      </div>

      <div className="relative mt-s-4 grid grid-cols-2 overflow-hidden rounded-r-1 border border-line">
        <div className="flex flex-col gap-[2px] border-r border-line bg-surface-1 p-s-3">
          <span className="font-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 tabular-nums sm:text-[28px]">
            451
          </span>
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-2">
            Unlocks today
          </span>
        </div>
        <div className="flex flex-col gap-[2px] bg-surface-1 p-s-3">
          <span className="font-display text-[24px] font-extrabold uppercase leading-none tracking-[-0.04em] text-text-1 tabular-nums sm:text-[28px]">
            291
          </span>
          <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-2">
            Emails captured
          </span>
        </div>
      </div>

      <div className="relative mt-auto pt-s-4 text-center">
        <span className="font-mono text-mono-tiny uppercase tracking-mono-eyebrow text-text-3">
          Limited access window
        </span>
      </div>
    </div>
  );
}

type FeaturePanelProps = {
  badge: string;
  title: string;
  description: string;
  visual: React.ReactNode;
};

function FeaturePanel({ badge, title, description, visual }: FeaturePanelProps) {
  return (
    <div className="flex flex-col">
      <div className="border-b border-line">{visual}</div>
      <div className="flex flex-col gap-s-3 p-s-5 sm:p-s-6">
        <span className="inline-flex h-[22px] items-center gap-s-2 self-start rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
          <span aria-hidden>●</span>
          {badge}
        </span>
        <h3 className="text-[20px] font-semibold leading-tight text-text-1 sm:text-[22px]">
          {title}
        </h3>
        <p className="text-[14px] leading-[1.55] text-text-2">{description}</p>
      </div>
    </div>
  );
}

export function FeatureSpotlight() {
  return (
    <section id="features" className="relative overflow-hidden bg-bg-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-s-4 py-s-8 sm:px-s-5 sm:py-s-9">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-s-5 text-center sm:gap-s-6">
          <span className="inline-flex h-[22px] items-center gap-s-2 rounded-r-1 border border-accent px-s-2 font-mono text-mono-eyebrow uppercase tracking-mono-data text-accent">
            <span aria-hidden>●</span>
            More than a download gate
          </span>
          <h2 className="font-display text-[30px] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-text-1 sm:text-[42px] md:text-[48px] lg:text-[56px] lg:leading-[0.88] lg:tracking-[-0.045em]">
            Give every free kit a real launch system.
          </h2>
          <p className="max-w-2xl text-[15px] leading-[1.55] text-text-2 sm:text-lead">
            Create a clean producer hub, launch time-limited drops, and turn
            your free packs into moments people actually act on.
          </p>
        </div>

        <div className="mt-s-8 overflow-hidden rounded-r-2 border border-line-strong bg-surface-1 sm:mt-s-9">
          <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <FeaturePanel
              badge="Producer Bio Hub"
              title="A bio link built for free kits."
              description="Share your gated kits, socials, videos and paid offers from one clean producer page — instead of sending fans through random links."
              visual={<ProducerBioHubVisual />}
            />
            <FeaturePanel
              badge="Timed Drops"
              title="Add urgency to every free kit drop."
              description="Set a countdown, limit access, and turn your free kit into a real drop — so fans unlock now instead of forgetting later."
              visual={<TimedDropVisual />}
            />
          </div>
        </div>

        <div className="mt-s-8 border-t border-line-strong pt-s-5 sm:mt-s-9 sm:pt-s-6">
          <div className="flex flex-col gap-s-4 sm:flex-row sm:items-end sm:justify-between sm:gap-s-6">
            <div className="flex flex-col gap-s-2">
              <div className="flex items-center gap-s-2">
                <span aria-hidden className="h-[12px] w-[3px] bg-accent" />
                <span className="font-mono text-mono-eyebrow uppercase tracking-mono-eyebrow text-text-3">
                  Vision
                </span>
              </div>
              <p className="text-[18px] font-semibold leading-snug text-text-1 sm:text-[20px] md:text-title md:font-medium">
                Your free kit is not just a file.{" "}
                <span className="text-accent">
                  It can become a launch moment.
                </span>
              </p>
            </div>
            <a
              href="#waitlist"
              className="group inline-flex items-center gap-s-2 self-start whitespace-nowrap font-mono text-mono-eyebrow uppercase tracking-mono-button text-text-2 transition-colors duration-wav ease-wav hover:text-text-1 sm:self-end"
            >
              Claim early access
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
