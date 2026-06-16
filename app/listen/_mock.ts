/**
 * Mock data for the artist-side panel (Phase 1).
 *
 * Everything here is hardcoded so we can validate the visual shell
 * — sidebar grouping, topbar, banner, beats list, filters — without
 * touching the DB or auth.
 *
 * Phase 2 swaps these out for real queries:
 *   - producers / servers comes from `contacts ⨝ server_contacts ⨝
 *     servers ⨝ profiles` scoped to the artist's `contact.id`s
 *   - beats per server comes from `server_beats ⨝ beats_with_stats`
 *   - liked / listened state comes from `likes` and `listens` rows
 *     tied to the artist's `contact.id`
 */

export interface MockBeat {
  id: string;
  title: string;
  /** Composition (a complete beat) vs Loop (a short cyclable section).
   *  Same semantic as the producer-side BeatRow's COMP / LOOP tag. */
  type: "comp" | "loop";
  bpm: number;
  key: string;
  mood: string[];
  duration: string;
  /** Optional co-producer credits — same shape as
   *  beats.co_producers on the producer side. Rendered inline after
   *  the title in caps mono. */
  coProducers?: string[];
  /** Display string for when the beat landed in this server, same
   *  column as the producer library's ADDED column. Phase 1 uses
   *  hardcoded strings ("YESTERDAY", "2D AGO", "3W AGO"); Phase 3
   *  derives this from server_beats.added_at via fmtAgo(). */
  addedAt: string;
  liked: boolean;
  listened: boolean;
  commentCount: number;
  /** Used to seed the generative CoverArt fallback. */
  artSeed: string;
  /** Optional uploaded artwork URL. When set, the row's CoverArt
   *  renders this image instead of the seeded gradient — used by
   *  Phase 1 to feel out real-cover density on the mockup. */
  coverUrl?: string;
  /** Optional audio source used by the PlayerDock when this beat
   *  is selected. Phase 1 round-robins a small pool of demo MP3s
   *  so the dock UX (play/pause/seek/progress) is testable end-to-
   *  end before the real `beats.audio_url` signed-URL pipeline lands
   *  in Phase 3. */
  audioUrl?: string;
  /** When true the beat shows up in the NEW filter. */
  isNew?: boolean;
}

export interface MockServer {
  slug: string;
  name: string;
  styleText: string;
  unread: number;
  /** First 4 cover seeds for the banner mosaic. */
  artSeeds: string[];
  /** Optional 4 uploaded cover URLs for the banner mosaic. When
   *  set, the banner renders these images instead of seeded
   *  gradients — Phase 1 mockup only. */
  artUrls?: string[];
  /** How the banner background renders — exactly mirrors the
   *  producer's choice in the Create Server form
   *  (servers.artwork_mode in the DB):
   *    "auto"  → derive from the beat covers (blurred mosaic backdrop)
   *    "color" → single-hue mesh built from `accentHue`
   *    "image" → full-bleed blur of the producer's uploaded artwork
   *  Phase 3 reads this straight off the row. */
  artworkMode: "auto" | "color" | "image";
  /** 0..360 OKLCH hue used when artworkMode === "color". Same shape
   *  as servers.accent_hue. */
  accentHue?: number;
  /** Producer-uploaded artwork URL used when artworkMode === "image".
   *  Same shape as servers.artwork_image_url. */
  artworkImageUrl?: string;
  beats: MockBeat[];
}

/**
 * Real cover URLs uploaded to the `beat-covers` Supabase bucket
 * by Theo's producer account. Used in Phase 1 to populate the
 * mockup with actual artwork (vs the seeded gradients) so we can
 * judge how the page reads at real density. Phase 3 derives this
 * from `beats.cover_url` per row instead.
 */
const SUPA_PUBLIC =
  "https://sgowrqzkdugbarfbvlqk.supabase.co/storage/v1/object/public/beat-covers/a067e12a-3dc4-4899-b09e-5252bb534f75";
const COVER_POOL = [
  `${SUPA_PUBLIC}/7fdcbdf8-cdbd-4a78-b7ae-a585545e06d9.jpg`,
  `${SUPA_PUBLIC}/3769e218-62f2-4673-9465-c5d4bd09381b.jpg`,
  `${SUPA_PUBLIC}/0de55c9b-b930-402c-a196-a76fa97b11a0.jpg`,
  `${SUPA_PUBLIC}/60691d19-c8b3-448c-a4a3-be0945d2cbeb.jpg`,
];
/** Round-robin pick from the cover pool — keeps each row visually
 *  distinct without us hand-mapping 15 beats to 4 images. */
const cover = (i: number) => COVER_POOL[i % COVER_POOL.length];

/**
 * Demo MP3 pool used as `audioUrl` on the mock beats. SoundHelix's
 * permissively-licensed examples have been the de-facto "demo audio"
 * for browser players for over a decade — reliable, CORS-friendly,
 * no auth. Phase 3 swaps these for signed URLs minted off
 * `beats.audio_url` (private `beat-audio` Supabase bucket); the
 * PlayerContext contract already supports any HTTPS source.
 */
const AUDIO_POOL = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
];
const audio = (i: number) => AUDIO_POOL[i % AUDIO_POOL.length];

export interface MockProducer {
  handle: string;
  name: string;
  /** Seed used by the Avatar component when no `src` is set. */
  avatarSeed: string;
  /** Optional public photo — for now everyone's an initials avatar. */
  avatarUrl: string | null;
  socials: Record<string, string>;
  servers: MockServer[];
}

export interface ArtistAccount {
  handle: string;
  /** Display name shown in the account-menu header (the bolded
   *  line above the email). Phase 3 sources this from
   *  `profiles.display_name` keyed to the artist's auth user id. */
  name: string;
  email: string;
  notifications: number;
}

export const ARTIST: ArtistAccount = {
  handle: "juno215",
  name: "juno",
  email: "juno215@icloud.com",
  notifications: 3,
};

/* ============================================================
   Notifications — bell dropdown payload.
   Phase 3 sources these from a `notifications` table scoped to
   the artist's contact ids; shape mirrors what the renderer
   needs so the component contract survives the swap.
   ============================================================ */

export type ArtistNotificationKind =
  | "upload"            // producer added beats to a server you follow
  | "added-to-server"   // producer added you as a contact on a new server
  | "drop"              // producer dropped a featured beat
  | "comment-like"      // producer liked your comment
  | "trending";         // server you follow is trending

export interface ArtistNotification {
  id: string;
  kind: ArtistNotificationKind;
  /** Bolded subject of the sentence (producer or server name). */
  actorName: string;
  /** Used to seed the avatar circle in the notification row. */
  actorSeed: string;
  /** Sentence fragment after the actor name — keeps the renderer
   *  dumb, no per-kind copy logic in the component. */
  body: string;
  /** Display-string for the time delta ("12 MIN AGO", "3 H AGO",
   *  "1 D AGO"…). Phase 3 derives via fmtAgo(created_at). */
  ago: string;
  unread: boolean;
}

export const NOTIFICATIONS: ArtistNotification[] = [
  {
    id: "n-tyler-upload",
    kind: "upload",
    actorName: "Tyler Mills",
    actorSeed: "tyler-mills",
    body: "added 2 new beats to Atlanta Nights.",
    ago: "12 MIN AGO",
    unread: true,
  },
  {
    id: "n-kane-invite",
    kind: "added-to-server",
    actorName: "Kane",
    actorSeed: "kane",
    body: "added you to UK Drill Pack.",
    ago: "3 H AGO",
    unread: true,
  },
  {
    id: "n-yuki-drop",
    kind: "drop",
    actorName: "Yuki",
    actorSeed: "yuki",
    body: "dropped “Tokyo Drift” in Neon Tokyo.",
    ago: "1 D AGO",
    unread: true,
  },
  {
    id: "n-tyler-like",
    kind: "comment-like",
    actorName: "Tyler Mills",
    actorSeed: "tyler-mills",
    body: "liked your comment on Golden Hour.",
    ago: "2 D AGO",
    unread: false,
  },
  {
    id: "n-velour-trend",
    kind: "trending",
    actorName: "Velour",
    actorSeed: "velour",
    body: "is trending — 3 new artists joined this week.",
    ago: "4 D AGO",
    unread: false,
  },
];

export const PRODUCERS: MockProducer[] = [
  {
    handle: "mrtlman",
    name: "Tyler Mills",
    avatarSeed: "tyler-mills",
    avatarUrl: null,
    socials: {
      instagram: "https://instagram.com/mrtlman",
      x: "https://x.com/mrtlman",
      youtube: "https://youtube.com/@mrtlman",
      genius: "https://genius.com/mrtlman",
    },
    servers: [
      {
        slug: "velour",
        name: "Velour",
        styleText: "R&B · Soul",
        unread: 0,
        artSeeds: ["v1", "v2", "v3", "v4"],
        artUrls: COVER_POOL,
        // Producer picked COLOR (warm rose ≈ 20°) for the R&B vibe.
        artworkMode: "color",
        accentHue: 20,
        beats: [
          {
            id: "v-golden-hour",
            title: "Golden Hour",
            bpm: 78,
            key: "C MIN",
            mood: ["R&B", "Soul"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:10",
            liked: true,
            listened: true,
            commentCount: 0,
            artSeed: "golden-hour",
            coverUrl: cover(0),
            audioUrl: audio(0),
          },
          {
            id: "v-afterglow",
            title: "Afterglow",
            bpm: 96,
            key: "F# MAJ",
            mood: ["R&B", "Vocal"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:24",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "afterglow",
            coverUrl: cover(1),
            audioUrl: audio(1),
          },
          {
            id: "v-velvet-room",
            title: "Velvet Room",
            bpm: 90,
            key: "D MIN",
            mood: ["R&B"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:02",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "velvet-room",
            coverUrl: cover(2),
            audioUrl: audio(2),
          },
          {
            id: "v-cold-water",
            title: "Cold Water",
            type: "comp",
            bpm: 84,
            key: "BB MIN",
            mood: ["Soul", "Keys"],
            coProducers: ["Metro"],
            addedAt: "YESTERDAY",
            duration: "2:58",
            liked: false,
            listened: false,
            commentCount: 1,
            artSeed: "cold-water",
            coverUrl: cover(3),
            audioUrl: audio(3),
          },
          {
            id: "v-saint",
            title: "Saint",
            bpm: 75,
            key: "G MAJ",
            mood: ["Soul"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:33",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "saint",
            coverUrl: cover(4),
            audioUrl: audio(4),
          },
        ],
      },
      {
        slug: "atlanta-nights",
        name: "Atlanta Nights",
        styleText: "Trap · Dark",
        unread: 2,
        artSeeds: ["an1", "an2", "an3", "an4"],
        artUrls: [COVER_POOL[1], COVER_POOL[2], COVER_POOL[3], COVER_POOL[0]],
        // Producer left AUTO — banner pulls colour from the covers.
        artworkMode: "auto",
        beats: [
          {
            id: "an-midnight-drive",
            title: "Midnight Drive",
            bpm: 142,
            key: "F MIN",
            mood: ["Trap", "Dark"],
            type: "comp",
            addedAt: "TODAY",
            duration: "2:48",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "midnight-drive",
            coverUrl: cover(5),
            audioUrl: audio(5),
            isNew: true,
          },
          {
            id: "an-paper-planes",
            title: "Paper Planes",
            type: "loop",
            bpm: 144,
            key: "A MIN",
            mood: ["Trap"],
            coProducers: ["Wheezy"],
            addedAt: "TODAY",
            duration: "2:35",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "paper-planes",
            coverUrl: cover(6),
            audioUrl: audio(6),
            isNew: true,
          },
          {
            id: "an-neon-rain",
            title: "Neon Rain",
            bpm: 138,
            key: "E MIN",
            mood: ["Trap", "Dark"],
            type: "comp",
            addedAt: "1W AGO",
            duration: "2:44",
            liked: false,
            listened: true,
            commentCount: 0,
            artSeed: "neon-rain",
            coverUrl: cover(7),
            audioUrl: audio(7),
          },
          {
            id: "an-no-ceilings",
            title: "No Ceilings",
            type: "loop",
            bpm: 130,
            key: "G# MIN",
            mood: ["Drill"],
            addedAt: "3D AGO",
            duration: "2:22",
            liked: false,
            listened: true,
            commentCount: 0,
            artSeed: "no-ceilings",
            coverUrl: cover(8),
            audioUrl: audio(8),
          },
        ],
      },
    ],
  },
  {
    handle: "kanemadeit",
    name: "Kane",
    avatarSeed: "kane",
    avatarUrl: null,
    socials: {
      instagram: "https://instagram.com/kanemadeit",
    },
    servers: [
      {
        slug: "uk-drill-pack",
        name: "UK Drill Pack",
        styleText: "Drill · UK",
        unread: 1,
        artSeeds: ["uk1", "uk2", "uk3", "uk4"],
        artUrls: [COVER_POOL[2], COVER_POOL[3], COVER_POOL[0], COVER_POOL[1]],
        // Producer picked COLOR — deep red (≈ 0°) for the drill energy.
        artworkMode: "color",
        accentHue: 0,
        beats: [
          {
            id: "uk-london-bridge",
            title: "London Bridge",
            bpm: 144,
            key: "G MIN",
            mood: ["Drill"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "2:18",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "london-bridge",
            coverUrl: cover(9),
            audioUrl: audio(9),
            isNew: true,
          },
          {
            id: "uk-roadman-anthem",
            title: "Roadman Anthem",
            bpm: 142,
            key: "C MIN",
            mood: ["Drill", "UK"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "2:33",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "roadman",
            coverUrl: cover(10),
            audioUrl: audio(10),
          },
        ],
      },
    ],
  },
  {
    handle: "yukisound",
    name: "Yuki",
    avatarSeed: "yuki",
    avatarUrl: null,
    socials: {
      instagram: "https://instagram.com/yukisound",
      youtube: "https://youtube.com/@yukisound",
    },
    servers: [
      {
        slug: "neon-tokyo",
        name: "Neon Tokyo",
        styleText: "Lo-fi · Ambient",
        unread: 0,
        artSeeds: ["nt1", "nt2", "nt3", "nt4"],
        artUrls: [COVER_POOL[3], COVER_POOL[0], COVER_POOL[1], COVER_POOL[2]],
        // Producer uploaded a custom artwork — IMAGE mode uses it
        // full-bleed (heavily blurred) as the banner backdrop.
        artworkMode: "image",
        artworkImageUrl: COVER_POOL[3],
        beats: [
          {
            id: "nt-sakura-nights",
            title: "Sakura Nights",
            bpm: 88,
            key: "A MIN",
            mood: ["Lo-fi", "Ambient"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:45",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "sakura",
            coverUrl: cover(11),
            audioUrl: audio(11),
          },
          {
            id: "nt-crystal-sky",
            title: "Crystal Sky",
            bpm: 72,
            key: "D MAJ",
            mood: ["Lo-fi"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "4:02",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "crystal",
            coverUrl: cover(12),
            audioUrl: audio(12),
          },
          {
            id: "nt-digital-dreams",
            title: "Digital Dreams",
            bpm: 90,
            key: "F MIN",
            mood: ["Ambient"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:33",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "digital",
            coverUrl: cover(13),
            audioUrl: audio(13),
          },
          {
            id: "nt-skyline",
            title: "Skyline",
            bpm: 80,
            key: "C MAJ",
            mood: ["Lo-fi", "Vapor"],
            type: "comp",
            addedAt: "YESTERDAY",
            duration: "3:28",
            liked: false,
            listened: false,
            commentCount: 0,
            artSeed: "skyline",
            coverUrl: cover(14),
            audioUrl: audio(14),
          },
        ],
      },
    ],
  },
];

/** Flatten lookup — get the producer that owns a server slug. */
export function findServer(slug: string): {
  producer: MockProducer;
  server: MockServer;
} | null {
  for (const producer of PRODUCERS) {
    const server = producer.servers.find((s) => s.slug === slug);
    if (server) return { producer, server };
  }
  return null;
}

/** All beats the artist has liked across every producer + server. */
export function likedBeats(): Array<{
  producer: MockProducer;
  server: MockServer;
  beat: MockBeat;
}> {
  const out: Array<{
    producer: MockProducer;
    server: MockServer;
    beat: MockBeat;
  }> = [];
  for (const producer of PRODUCERS) {
    for (const server of producer.servers) {
      for (const beat of server.beats) {
        if (beat.liked) out.push({ producer, server, beat });
      }
    }
  }
  return out;
}

/** Count of distinct producers and total servers — sidebar header. */
export const PRODUCER_COUNT = PRODUCERS.length;
export const SERVER_COUNT = PRODUCERS.reduce(
  (n, p) => n + p.servers.length,
  0,
);
