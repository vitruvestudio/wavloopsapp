/**
 * /library loading skeleton — beat list shape.
 */

export default function LibraryLoading() {
  return (
    <div className="flex flex-col" style={{ gap: 22, padding: "24px 32px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Pulse height={14} width={120} />
        <Pulse height={32} width={200} />
      </div>

      {/* Toolbar row */}
      <div style={{ display: "flex", gap: 10 }}>
        <Pulse height={36} width={260} />
        <Pulse height={36} width={120} />
        <Pulse height={36} width={120} />
      </div>

      {/* Beat rows */}
      <div className="flex flex-col" style={{ gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              background: "var(--bg-1)",
              border: "1px solid var(--border-1)",
              borderRadius: "var(--r-md)",
            }}
          >
            <Pulse height={44} width={44} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <Pulse height={14} width="40%" />
              <Pulse height={11} width="20%" />
            </div>
            <Pulse height={11} width={60} />
            <Pulse height={11} width={40} />
          </div>
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
