/**
 * Instagram post 1:1 — "STOP sending beats. Start sharing one link."
 *
 * Renders at exactly 1080×1080 pixels (Instagram feed square).
 * How to export:
 *   1. Save the app dashboard screenshot to
 *      /public/marketing/dashboard-servers.png (any size).
 *   2. Open this page in Chrome at wavloops.co/marketing/
 *      ig-post-stop-sending-beats.
 *   3. DevTools → Cmd+Shift+P → "Capture full size screenshot".
 *      The PNG comes out 1080×1080 pixel-perfect.
 *
 * Uses real Unbounded / Hanken Grotesk / JetBrains Mono from
 * Google Fonts, real accent #2b25ff, real product screenshot.
 * No responsive — the whole point is to lock the composition
 * to Instagram's square feed dimensions.
 *
 * `robots: noindex` because this URL is for asset export, not
 * public traffic. */

export const metadata = {
  title: "IG post — Stop sending beats",
  robots: { index: false, follow: false },
};

const POSTER_SIZE = 1080;
const SCREENSHOT_SRC = "/marketing/dashboard-servers.png";

export default function IgPostStopSendingBeats() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800&family=Hanken+Grotesk:wght@500;600&family=JetBrains+Mono:wght@500&display=swap"
      />
      <div
        style={{
          minHeight: "100vh",
          padding: 40,
          background: "#1a1a1c",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          id="poster"
          style={{
            width: POSTER_SIZE,
            height: POSTER_SIZE,
            background:
              "radial-gradient(ellipse at 25% 15%, rgba(43,37,255,0.18), transparent 55%), #0c0c0e",
            position: "relative",
            overflow: "hidden",
            fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 44,
              left: 52,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "-0.02em",
            }}
          >
            wavloops
          </div>

          <div
            style={{
              position: "absolute",
              top: 130,
              left: 52,
              right: 52,
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              fontSize: 78,
            }}
          >
            <div style={{ display: "block" }}>
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                }}
              >
                STOP
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "48%",
                    left: "-4%",
                    right: "-4%",
                    height: 8,
                    background: "#ff3b30",
                    transform: "rotate(-4deg)",
                    borderRadius: 4,
                  }}
                />
              </span>
              {" sending beats."}
            </div>
            <div style={{ marginTop: 14 }}>
              Start sharing{" "}
              <span
                style={{
                  color: "#2b25ff",
                  textDecoration: "underline",
                  textDecorationColor: "#2b25ff",
                  textDecorationThickness: 8,
                  textUnderlineOffset: 12,
                }}
              >
                one link.
              </span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 110,
              left: 52,
              right: 52,
              height: 420,
              background: "#101013",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7)",
            }}
          >
            <div
              style={{
                height: 42,
                background: "#16161a",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                gap: 8,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ff5f57",
                }}
              />
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ffbd2e",
                }}
              />
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#28c93f",
                }}
              />
              <span
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "#6e6e78",
                  letterSpacing: "0.05em",
                }}
              >
                wavloops.co/dashboard
              </span>
            </div>
            <img
              src={SCREENSHOT_SRC}
              alt="Wavloops dashboard"
              style={{
                display: "block",
                width: "100%",
                height: "calc(100% - 42px)",
                objectFit: "cover",
                objectPosition: "top left",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              fontSize: 15,
              letterSpacing: "0.2em",
              color: "#6e6e78",
              textTransform: "uppercase",
            }}
          >
            WAVLOOPS.CO
          </div>
        </div>
      </div>
    </>
  );
}
