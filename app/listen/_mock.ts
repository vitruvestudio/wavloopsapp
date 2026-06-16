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
  email: string;
  notifications: number;
}

export const ARTIST: ArtistAccount = {
  handle: "juno215",
  email: "juno215@icloud.com",
  notifications: 3,
};

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
