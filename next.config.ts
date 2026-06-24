import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  /**
   * MDX wiring — required so `.mdx` files in /content can be
   * imported by the dynamic blog/compare routes. We don't route
   * MDX files directly under /app (we keep the App Router pages
   * as .tsx), but `pageExtensions` still must list `mdx` so the
   * @next/mdx loader is registered.
   */
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    serverActions: {
      /**
       * Avatar / server-cover / beat-cover uploads go through server
       * actions as base64 data URLs. A 4 MB photo becomes ~5.3 MB
       * once base64-encoded, so the framework default of 1 MB
       * silently kills the upload while the rest of the action's
       * tiny payload (name, bio, …) writes fine.
       *
       * 10 MB covers the 5 MB client-side image cap we enforce on
       * the Settings + Server-Create forms with a comfortable
       * encoding-overhead margin. Anything bigger is rejected
       * upstream by the picker's size check.
       */
      bodySizeLimit: "10mb",
    },
  },
  /**
   * Defense-in-depth response headers — applied to every route by
   * Next's middleware before render. Vercel adds a baseline set
   * but doesn't ship X-Frame-Options or a Referrer-Policy by
   * default, so the framing + referrer leaks are on us.
   *
   * Headers chosen:
   *   - X-Frame-Options: DENY — kill clickjacking. We never embed
   *     this app in an iframe; if that ever changes, switch to
   *     SAMEORIGIN or a frame-ancestors CSP directive.
   *   - X-Content-Type-Options: nosniff — stop the browser from
   *     re-interpreting a served asset's MIME type (e.g. an
   *     uploaded "image" rendered as HTML).
   *   - Referrer-Policy: strict-origin-when-cross-origin —
   *     don't leak the producer's dashboard path to third parties
   *     they click through to (Spotify, social embeds).
   *   - Permissions-Policy — explicitly disable APIs we don't
   *     use (camera, mic, geolocation, payment); blunts the blast
   *     radius of an XSS that tries to upgrade to one of them.
   *
   * A full CSP is intentionally deferred — Supabase Storage URLs,
   * Resend tracking pixels, and Vercel analytics make a
   * conservative `default-src 'self'` non-trivial. Worth doing
   * before scaling, but a too-strict CSP now would break uploads
   * silently.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

/**
 * createMDX wraps next.config so .mdx files compile through the
 * @next/mdx loader. remark-gfm is passed by NAME (string) — the
 * Turbopack pipeline can't serialise JS function references, so
 * the @next/mdx Turbopack path expects the plugin to be a string
 * it can require at compile time. See
 * node_modules/next/dist/docs/01-app/02-guides/mdx.md → "Using
 * Plugins with Turbopack".
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
