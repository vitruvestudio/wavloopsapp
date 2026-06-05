/**
 * Chaos — Section 03 of the /organized variant landing.
 *
 * Names the pain before any feature: scattered contacts, no idea who got
 * what beat, no follow-up trail. Same layout as the root landing's
 * BoringPart (2 cols + chore chip row), different visual + copy.
 *
 *   LEFT  : eyebrow `// 003`, H2 "It's not the beats. It's the mess around them.",
 *           three paragraphs ending on "[clarity]" (.wv-kw)
 *   RIGHT : a "scattered DMs" stack — 4 contact notes with missing replies
 *           and ambiguous status, fading down + amber "Lost track" tags.
 *           Two ghost stacked cards behind hint at "and 47 more like this".
 *           Below: chore chips "Scroll Instagram · Search WhatsApp · Check
 *           Gmail · Find that note · Lost again · × every time".
 */

import { Icon, type IconName } from "../Icon";

interface ScatteredNote {
  initials: string;
  name: string;
  meta: string;
  status: string;
}

const SCATTERED: ReadonlyArray<ScatteredNote> = [
  {
    initials: "AK",
    name: "Ari Kova",
    meta: "Reached out · last March?",
    status: "No reply trail",
  },
  {
    initials: "DJ",
    name: "Dae Jones",
    meta: "DM sent · which beat?",
    status: "Can't remember",
  },
  {
    initials: "NV",
    name: "Nova V.",
    meta: "Replied somewhere · Insta? Mail?",
    status: "Lost reply",
  },
  {
    initials: "MC",
    name: "Marcus Cole",
    meta: "Sent beat · 6 weeks ago",
    status: "Followed up?",
  },
];

const CHORES: ReadonlyArray<{ icon: IconName; label: string }> = [
  { icon: "image", label: "Scroll Instagram" },
  { icon: "send", label: "Search WhatsApp" },
  { icon: "type", label: "Check Gmail" },
  { icon: "drive", label: "Find that note" },
  { icon: "clock", label: "Lost again" },
];

export function Chaos() {
  return (
    <section
      id="chaos"
      className="relative overflow-hidden border-t border-line bg-bg-deep py-[clamp(84px,11vw,132px)]"
    >
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
            <span className="slash">//</span> 003 — the chaos
          </div>
          <h2 className="mt-[20px] max-w-[16ch] text-balance font-display text-[clamp(31px,4.2vw,58px)] font-bold uppercase leading-[0.98] tracking-[-0.045em] text-text-1 max-[980px]:max-w-none">
            It&rsquo;s not the beats. It&rsquo;s the mess around them.
          </h2>
          <div className="mt-[30px] flex max-w-[47ch] flex-col gap-[18px] max-[980px]:max-w-[60ch]">
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              You make the beats. But who got the last one? Did Ari Kova reply
              to your DM? Did you already send Heatwave to Dae Jones?
            </p>
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              Your contacts live in{" "}
              <b className="font-semibold text-text-1">
                Instagram DMs, WhatsApp, Gmail, sticky notes, screenshots
              </b>{" "}
              — five places at once, none of them the right one. Every reach-out
              is a treasure hunt, and the trail goes cold in a week.
            </p>
            <p className="m-0 text-pretty text-[clamp(15px,1.1vw,17.5px)] leading-[1.64] text-text-2">
              Your beats deserve to land in the right ears. Not be sent at
              random, lost in feeds, or never sent at all because you{" "}
              <span className="wv-kw font-semibold">lost track</span>.
            </p>
          </div>
        </div>

        {/* ===== right: scattered notes pile ===== */}
        <div className="relative">
          <div className="relative">
            {/* stacked ghost cards suggesting more behind */}
            <div
              aria-hidden
              className="absolute -top-[18px] left-[34px] right-[34px] z-0 h-[30px] rounded-t-[15px] border border-line border-b-0 bg-[#0e0e0f]"
            />
            <div
              aria-hidden
              className="absolute -top-[9px] left-[18px] right-[18px] z-[1] h-[30px] rounded-t-[15px] border border-line-strong border-b-0 bg-surface-1"
            />

            {/* main card — scattered notes drive */}
            <div
              className="relative z-[2] overflow-hidden rounded-card border border-line-strong bg-surface-1"
              style={{ boxShadow: "var(--shadow-pop)" }}
            >
              {/* header */}
              <div className="flex items-end justify-between border-b border-line px-[22px] pb-[16px] pt-[20px]">
                <div className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
                  <span className="text-accent">//</span> scattered across 5 apps
                </div>
                <div className="text-right leading-none">
                  <b className="font-display text-[30px] font-semibold tracking-[-0.03em] text-text-1">
                    312
                  </b>
                  <span className="mt-[7px] block font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-3">
                    contacts · 0 organized
                  </span>
                </div>
              </div>

              {/* rows */}
              <div className="flex flex-col gap-[8px] p-[14px]">
                {SCATTERED.map((row, ix) => (
                  <div
                    key={row.name}
                    className="flex items-center gap-[13px] rounded-[12px] border border-line bg-bg px-[13px] py-[11px]"
                    style={{ opacity: 1 - ix * 0.13 }}
                  >
                    {/* avatar initials desaturated */}
                    <span
                      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-2 font-mono text-[11px] text-text-3"
                      style={{ filter: "grayscale(0.5)" }}
                    >
                      {row.initials}
                    </span>

                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span className="truncate text-[12.5px] font-semibold tracking-[-0.01em] text-text-1">
                        {row.name}
                      </span>
                      <span className="truncate font-mono text-[8.5px] uppercase tracking-[0.06em] text-text-3">
                        {row.meta}
                      </span>
                    </div>

                    {/* amber "lost" tag — same pattern as root BoringPart Unreleased */}
                    <span
                      className="inline-flex shrink-0 items-center gap-[5px] whitespace-nowrap rounded-pill border border-dashed py-[4px] pl-[8px] pr-[9px] font-mono text-[8.5px] uppercase tracking-[0.08em]"
                      style={{
                        color: "#caa36a",
                        borderColor: "rgba(202,163,106,0.42)",
                        background: "rgba(202,163,106,0.06)",
                      }}
                    >
                      <Icon name="clock" size={11} />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* footer */}
              <div className="flex items-center justify-center gap-[8px] border-t border-line px-[22px] pb-[16px] pt-[13px] text-center font-mono text-[9.5px] uppercase tracking-[0.1em] text-text-3">
                <Icon name="drive" size={13} />+ 308 more scattered around
              </div>
            </div>
          </div>

          {/* chore chips */}
          <div className="mt-[22px] px-[2px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-text-3">
              <span className="text-accent">//</span> each follow-up needs — by hand
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
