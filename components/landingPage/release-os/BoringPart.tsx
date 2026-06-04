/**
 * BoringPart — Section 02 of the Release OS landing
 *
 * Two-column "problem" section that names the pain before any feature is
 * mentioned:
 *   - Left  : eyebrow `// 002`, H2, three paragraphs ending on "consistency"
 *             (the keyword is underlined in accent-blue via `.wv-kw`)
 *   - Right : a "drive" mockup showing 4 beats stuck on a hard drive, each
 *             with an "Unreleased" amber tag and an empty 0/6 prep checklist.
 *             Two faint stacked cards behind suggest more drives buried below.
 *             A row of "by hand" chore chips (Cover · Title · Tags · YouTube
 *             · BeatStars · SoundCloud × every time) sits just under.
 *
 * Layout flips to a single column under 980px. Waveform + dashed step
 * checklist collapse below 560px to keep mobile rows compact.
 *
 * Cover assets live at /Photos/release-os/cover-5..8.jpg.
 *
 * Source of truth: `Wavloops - OS Release 2026/Pages/Wavloops Landing.html`.
 */

import { Icon, type IconName } from "./Icon";

/** Stuck beats sitting on the producer's drive. */
const STUCK: ReadonlyArray<{ cover: string; title: string; meta: string }> = [
  {
    cover: "/Photos/release-os/cover-5.jpg",
    title: "Heatwave",
    meta: "Trap Soul · 140 BPM",
  },
  {
    cover: "/Photos/release-os/cover-6.jpg",
    title: "Loverboy",
    meta: "Dark R&B · 82 BPM",
  },
  {
    cover: "/Photos/release-os/cover-7.jpg",
    title: "Pull Up",
    meta: "Drill · 144 BPM",
  },
  {
    cover: "/Photos/release-os/cover-8.jpg",
    title: "Static",
    meta: "Ambient Trap · 70 BPM",
  },
];

/** Manual chore chips under the drive — the things a producer does "by hand". */
const CHORES: ReadonlyArray<{ icon: IconName; label: string }> = [
  { icon: "image", label: "Cover" },
  { icon: "type", label: "Title" },
  { icon: "tag", label: "Tags" },
  { icon: "youtube", label: "YouTube" },
  { icon: "cart", label: "BeatStars" },
  { icon: "cloud", label: "SoundCloud" },
];

/** Pure waveform generator — mirrors the HTML reference's dbars() formula. */
function makeStuckWaveform(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.abs(Math.sin(i * 0.6) * Math.cos(i * 0.29));
    return 3 + t * 15;
  });
}

export function BoringPart() {
  return (
    <section
      id="boring-part"
      className="relative overflow-hidden border-t border-line bg-bg-deep py-[clamp(84px,11vw,132px)]"
    >
      {/* soft right-side blue glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-[-260px] z-0 h-[820px] w-[820px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(43,37,255,0.10), transparent 60%)",
        }}
      />

      <div className="relative z-[2] mx-auto grid max-w-[1200px] grid-cols-[0.92fr_1.08fr] items-center gap-[clamp(48px,6vw,90px)] px-5 sm:px-8 max-[980px]:grid-cols-1 max-[980px]:gap-[52px]">
        {/* ===== left: text ===== */}
        <div>
          <div className="wv-eyebrow">
            <span className="slash">//</span> 002 — the boring part
          </div>
          <h2 className="mt-[20px] max-w-[15ch] text-balance font-display text-[clamp(31px,4.2vw,58px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1 max-[980px]:max-w-none">
            Making the beat was the easy part.
          </h2>
          <div className="mt-[30px] flex max-w-[47ch] flex-col gap-[18px] max-[980px]:max-w-[60ch]">
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              Your beats aren&rsquo;t made to live on your phone. They&rsquo;re
              not made to sit on your hard drive either.
            </p>
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              You make them. You know they&rsquo;re good. But actually getting
              them out there —{" "}
              <b className="font-semibold text-text-1">
                cover, title, tags, uploading to YouTube, BeatStars, SoundCloud
              </b>
              , one by one, every time — that&rsquo;s the part that kills your{" "}
              <span className="wv-kw font-semibold">consistency</span>.
            </p>
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              So the beats pile up. And the ones that could&rsquo;ve landed
              somewhere{" "}
              <b className="font-semibold text-text-1">
                never get the chance.
              </b>
            </p>
          </div>
        </div>

        {/* ===== right: drive visual + chore chips ===== */}
        <div className="relative">
          {/* the stacked card backgrounds (suggest more drives behind) */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -top-[18px] left-[34px] right-[34px] z-0 h-[30px] rounded-t-[15px] border border-line border-b-0 bg-[#0e0e0f]"
            />
            <div
              aria-hidden
              className="absolute -top-[9px] left-[18px] right-[18px] z-[1] h-[30px] rounded-t-[15px] border border-line-strong border-b-0 bg-surface-1"
            />

            {/* the main drive card */}
            <div
              className="relative z-[2] overflow-hidden rounded-card border border-line-strong bg-surface-1"
              style={{ boxShadow: "var(--shadow-pop)" }}
            >
              {/* header */}
              <div className="flex items-end justify-between border-b border-line px-[22px] pb-[16px] pt-[20px]">
                <div className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
                  <span className="text-accent">//</span> on your drive
                </div>
                <div className="text-right leading-none">
                  <b className="font-display text-[30px] font-semibold tracking-[-0.03em] text-text-1">
                    47
                  </b>
                  <span className="mt-[7px] block font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-3">
                    beats · 0 released
                  </span>
                </div>
              </div>

              {/* rows */}
              <div className="flex flex-col gap-[8px] p-[14px]">
                {STUCK.map((row, ix) => (
                  <div
                    key={row.title}
                    className="flex items-center gap-[13px] rounded-[12px] border border-line bg-bg px-[13px] py-[11px]"
                    style={{ opacity: 1 - ix * 0.13 }}
                  >
                    {/* desaturated cover */}
                    <span
                      className="block h-[38px] w-[38px] shrink-0 overflow-hidden rounded-[8px]"
                      style={{ filter: "grayscale(0.45) brightness(0.8)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.cover}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>

                    {/* title + meta */}
                    <div className="flex w-[116px] shrink-0 flex-col gap-[4px] max-[560px]:w-auto max-[560px]:flex-1">
                      <span className="truncate text-[12.5px] font-semibold tracking-[-0.01em] text-text-1">
                        {row.title}
                      </span>
                      <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.06em] text-text-3">
                        {row.meta}
                      </span>
                    </div>

                    {/* greyed-out waveform (collapses on mobile) */}
                    <div className="flex h-[18px] min-w-0 flex-1 items-center gap-[2px] max-[560px]:hidden">
                      {makeStuckWaveform(30).map((h, i) => (
                        <i
                          key={i}
                          className="w-[2.5px] shrink-0 rounded-[2px] bg-[#34343a]"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>

                    {/* empty 6-step prep checklist (dashed boxes, collapses on mobile) */}
                    <div className="flex shrink-0 gap-[4px] max-[560px]:hidden">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <i
                          key={i}
                          className="h-[11px] w-[11px] shrink-0 rounded-[3px] border border-dashed border-line-strong"
                        />
                      ))}
                    </div>

                    {/* progress counter (0 of 6 done) */}
                    <span className="w-[20px] shrink-0 text-right font-mono text-[9px] tracking-[0.04em] text-text-3">
                      0/6
                    </span>

                    {/* amber "Unreleased" tag */}
                    <span
                      className="inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-pill border border-dashed py-[4px] pl-[8px] pr-[9px] font-mono text-[8.5px] uppercase tracking-[0.08em]"
                      style={{
                        color: "#caa36a",
                        borderColor: "rgba(202,163,106,0.42)",
                        background: "rgba(202,163,106,0.06)",
                      }}
                    >
                      <Icon name="clock" size={11} />
                      Unreleased
                    </span>
                  </div>
                ))}
              </div>

              {/* footer */}
              <div className="flex items-center justify-center gap-[8px] border-t border-line px-[22px] pb-[16px] pt-[13px] text-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-3">
                <Icon name="drive" size={13} />+ 43 more sitting here
              </div>
            </div>
          </div>

          {/* the "by hand" chore chips */}
          <div className="mt-[22px] px-[2px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
              <span className="text-accent">//</span> each one needs — by hand
            </div>
            <div className="mt-[13px] flex flex-wrap gap-[7px]">
              {CHORES.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-[6px] rounded-pill border border-line-strong px-[12px] py-[6px] font-mono text-[9px] uppercase tracking-[0.07em] text-text-2"
                >
                  <Icon name={chip.icon} size={12} className="text-text-3" />
                  {chip.label}
                </span>
              ))}
              <span className="inline-flex items-center pl-[4px] font-mono text-[9px] uppercase tracking-[0.07em] text-text-3">
                × every time
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
