/**
 * /dashboard loading skeleton.
 *
 * Renders immediately during the server fetch so users see a
 * laid-out page instead of a blank flash. Shape mirrors the live
 * dashboard: PageHeader + 4 stat strip + a grid of server cards.
 */

export default function DashboardLoading() {
  return (
    <div className="flex flex-col" style={{ gap: 26, padding: "24px 32px" }}>
      {/* PageHeader skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Pulse height={14} width={120} />
        <Pulse height={32} width={240} />
      </div>

      {/* Server grid skeleton — 6 cards on desktop, 1 col on mobile. */}
      <div
        className="grid"
        style={{
          gap: 18,
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <ServerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function Pulse({ height, width }: { height: number; width: number | string }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "var(--r-sm)",
        background: "var(--bg-2)",
        animation: "pulse 1.4s var(--ease) infinite",
      }}
    />
  );
}

function ServerCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border-1)",
        borderRadius: "var(--r-lg)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 260,
      }}
    >
      <Pulse height={140} width="100%" />
      <Pulse height={18} width="60%" />
      <Pulse height={12} width="40%" />
    </div>
  );
}
