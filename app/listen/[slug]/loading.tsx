/**
 * /listen/[slug] loading skeleton.
 *
 * Streamed immediately while the server-component fetch runs so
 * the user sees a laid-out server page during the navigation
 * instead of a blank flash. Shape mirrors ServerView: 2x2 cover
 * mosaic + title block + play cluster + a list of beat rows.
 */

export default function ServerLoading() {
  return (
    <main className="flex-1 min-w-0">
      {/* Banner skeleton */}
      <section
        className="flex flex-col items-center gap-4 lg:flex-row lg:items-center"
        style={{
          padding: "24px 18px 32px",
          gap: 22,
        }}
      >
        <Pulse height={180} width={180} style={{ borderRadius: 12 }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <Pulse height={14} width={140} />
          <Pulse height={32} width="80%" />
          <Pulse height={14} width={200} />
        </div>
        <div
          className="flex items-center"
          style={{ gap: 14 }}
        >
          <Pulse
            height={44}
            width={44}
            style={{ borderRadius: 999 }}
          />
          <Pulse
            height={56}
            width={56}
            style={{ borderRadius: 999 }}
          />
        </div>
      </section>

      {/* Toolbar skeleton */}
      <div
        className="flex items-center"
        style={{
          padding: "18px 18px 10px",
          gap: 10,
        }}
      >
        <Pulse height={28} width={70} style={{ borderRadius: 999 }} />
        <Pulse height={28} width={80} style={{ borderRadius: 999 }} />
        <Pulse height={28} width={90} style={{ borderRadius: 999 }} />
      </div>

      {/* Beat rows skeleton */}
      <div className="flex flex-col" style={{ gap: 4, padding: "0 12px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center"
            style={{ gap: 12, padding: "10px 12px" }}
          >
            <Pulse height={44} width={44} />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <Pulse height={14} width="50%" />
              <Pulse height={11} width="25%" />
            </div>
            <div className="flex" style={{ gap: 4 }}>
              <Pulse height={28} width={28} />
              <Pulse height={28} width={28} />
              <Pulse height={28} width={28} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Pulse({
  height,
  width,
  style,
}: {
  height: number;
  width: number | string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "var(--r-sm)",
        background: "var(--bg-2)",
        animation: "pulse 1.4s var(--ease) infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
