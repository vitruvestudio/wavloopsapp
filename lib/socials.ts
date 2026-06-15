/**
 * Social-link parser — turns a pasted URL into:
 *   - the platform it belongs to
 *   - a cleaned-up handle / channel id
 *   - a normalised canonical profile URL
 *   - a public avatar URL (via unavatar.io for major platforms,
 *     domain favicon fallback for everything else)
 *
 * No network calls — pure string work. Used by the Add Contact
 * modal's "paste a social link → auto-fill" field.
 *
 * Why unavatar.io: free, zero-auth, handles instagram / x / youtube
 * / tiktok / soundcloud / github / dribbble / telegram avatars by
 * URL convention (https://unavatar.io/<platform>/<handle>). Browser
 * renders it via plain <img src> — we don't proxy bytes.
 */

export type SocialPlatform =
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "soundcloud"
  | "genius"
  | "website";

export interface ParsedSocialLink {
  platform: SocialPlatform;
  /** Just the @username / channel id portion, no @ prefix. For
   *  "website" this is the hostname. */
  handle: string;
  /** Canonical profile URL — what we store in `contacts.socials[platform]`. */
  url: string;
  /** Public avatar URL (unavatar.io for known platforms, domain
   *  favicon for website fallback). */
  avatarUrl: string;
}

/** Strip leading "@" and any trailing slashes/query. */
function cleanSegment(s: string): string {
  return s.replace(/^@/, "").replace(/[?#].*$/, "");
}

export function parseSocialLink(raw: string): ParsedSocialLink | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let u: URL;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    u = new URL(withScheme);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  const segments = u.pathname
    .split("/")
    .map(cleanSegment)
    .filter(Boolean);

  // Instagram
  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const handle = segments[0];
    if (!handle) return null;
    return {
      platform: "instagram",
      handle,
      url: `https://instagram.com/${handle}`,
      avatarUrl: `https://unavatar.io/instagram/${handle}`,
    };
  }

  // X / Twitter
  if (
    host === "x.com" ||
    host === "twitter.com" ||
    host.endsWith(".twitter.com")
  ) {
    const handle = segments[0];
    if (!handle) return null;
    return {
      platform: "x",
      handle,
      url: `https://x.com/${handle}`,
      // unavatar.io aliases "twitter" → same source; works for x.com handles.
      avatarUrl: `https://unavatar.io/twitter/${handle}`,
    };
  }

  // YouTube — supports @handle, /channel/UCxxx, /c/name, /user/name
  if (host === "youtube.com" || host === "youtu.be") {
    const first = segments[0];
    if (!first) return null;
    let handle = first;
    let unavatarKey = first;
    if (first === "channel" && segments[1]) {
      handle = segments[1];
      unavatarKey = segments[1];
    } else if ((first === "c" || first === "user") && segments[1]) {
      handle = segments[1];
      unavatarKey = segments[1];
    }
    return {
      platform: "youtube",
      handle,
      url: `https://youtube.com/@${handle.replace(/^@/, "")}`,
      avatarUrl: `https://unavatar.io/youtube/${unavatarKey}`,
    };
  }

  // TikTok
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const handle = segments[0];
    if (!handle) return null;
    return {
      platform: "tiktok",
      handle,
      url: `https://tiktok.com/@${handle.replace(/^@/, "")}`,
      avatarUrl: `https://unavatar.io/tiktok/${handle}`,
    };
  }

  // SoundCloud
  if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
    const handle = segments[0];
    if (!handle) return null;
    return {
      platform: "soundcloud",
      handle,
      url: `https://soundcloud.com/${handle}`,
      avatarUrl: `https://unavatar.io/soundcloud/${handle}`,
    };
  }

  // Genius
  if (host === "genius.com" || host.endsWith(".genius.com")) {
    const handle = segments[0] ?? host;
    return {
      platform: "genius",
      handle,
      url: `https://genius.com/${handle}`,
      avatarUrl: `https://unavatar.io/genius.com`,
    };
  }

  // Generic website fallback — favicon as avatar.
  return {
    platform: "website",
    handle: host,
    url: u.toString(),
    avatarUrl: `https://unavatar.io/${host}`,
  };
}

/** Icon name (from the registry) for each platform — used wherever a
 *  contact's socials are listed (table rows, detail page, modal preview).
 *  Platforms without a dedicated SVG yet use the closest stand-in
 *  glyph. */
export const PLATFORM_ICON: Record<string, string> = {
  instagram: "instagram",
  x: "x-logo",
  youtube: "youtube",
  tiktok: "youtube", // closest stand-in until a TikTok glyph ships
  soundcloud: "library", // closest stand-in until a SoundCloud glyph ships
  genius: "mic",
  website: "globe",
};

/** Pretty label for the "Detected:" hint under the paste field. */
export function platformLabel(p: SocialPlatform): string {
  switch (p) {
    case "instagram":
      return "Instagram";
    case "x":
      return "X";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "soundcloud":
      return "SoundCloud";
    case "genius":
      return "Genius";
    case "website":
      return "Website";
  }
}
