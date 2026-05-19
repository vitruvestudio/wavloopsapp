export type IconComponent = () => React.ReactElement;

const BASE = "h-[14px] w-[14px]";
const STROKE_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "square" as const,
};

export function EnvelopeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <rect x="2" y="4" width="12" height="8" />
      <path d="M2 4l6 5 6-5" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <circle cx="8" cy="5.5" r="2.4" />
      <path d="M3 14c0-2.7 2.2-4.4 5-4.4s5 1.7 5 4.4" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M3 13V9M8 13V4M13 13V10" />
      <path d="M2 14h12" />
    </svg>
  );
}

export function CardIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <rect x="2" y="4" width="12" height="8" />
      <path d="M2 7h12" />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M8 2v8" />
      <path d="M5 7l3 3 3-3" />
      <path d="M2 13.5h12" />
    </svg>
  );
}

export function TrendUpIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M2 12l4-4 3 3 5-7" />
      <path d="M11 4h3v3" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M3 8.5l3.5 3.5L13 5" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <rect x="3.5" y="7" width="9" height="7" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function InstagramIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <rect x="2" y="2" width="12" height="12" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="11.5" cy="4.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <rect x="1.5" y="4" width="13" height="8" />
      <path
        d="M6.5 6.5l3 1.5-3 1.5z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export function DiscordIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M3 3h10v8l-2-1H7l-4 2z" />
      <circle cx="6" cy="7" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={BASE} {...STROKE_PROPS}>
      <path d="M9.5 2v8a2.5 2.5 0 1 1-2.5-2.5" />
      <path d="M9.5 2c0 1.7 1.3 3 3 3" />
    </svg>
  );
}
