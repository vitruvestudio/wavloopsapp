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
};

export default nextConfig;
