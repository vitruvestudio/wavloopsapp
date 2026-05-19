import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const iconBuffer = readFileSync(
    path.join(process.cwd(), "public", "Photos", "wavloops-icon.png"),
  );
  const iconBase64 = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2B25FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={iconBase64} width={120} height={120} />
      </div>
    ),
    { ...size },
  );
}
