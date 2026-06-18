/**
 * /contacts loading skeleton — table shape.
 */

export default function ContactsLoading() {
  return (
    <div className="flex flex-col" style={{ gap: 22, padding: "24px 32px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Pulse height={14} width={120} />
        <Pulse height={32} width={200} />
      </div>
      <div className="flex flex-col" style={{ gap: 6 }}>
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
            <Pulse height={32} width={32} />
            <Pulse height={14} width="32%" />
            <div style={{ flex: 1 }} />
            <Pulse height={11} width={80} />
            <Pulse height={11} width={40} />
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
