import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={iconBase64} width={42} height={42} />
      </div>
    ),
    { ...size },
  );
}
