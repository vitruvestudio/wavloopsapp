import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
