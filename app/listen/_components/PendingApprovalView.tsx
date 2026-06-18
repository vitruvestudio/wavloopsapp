/**
 * PendingApprovalView — what an authed artist sees on
 * /listen/<slug> when their access request is still pending.
 *
 * Why this exists: server_contacts rows with status='pending'
 * are filtered out by the artist_can_read_server RLS helper —
 * the artist literally CAN'T read the server through the normal
 * loadServerView path. Before this view, `/listen/<slug>` just
 * 404'd, which made the gate flow feel broken ("I submitted my
 * request 5 minutes ago, where did it go?"). Now they land here.
 *
 * Identity (server name + producer handle / avatar) comes from
 * the public get_server_for_gate RPC, which is SECURITY DEFINER
 * and bypasses RLS for the read-only payload the public gate
 * page already uses.
 */

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";

interface PendingApprovalViewProps {
  serverName: string;
  producerHandle: string;
  producerAvatarUrl: string | null;
}

export function PendingApprovalView({
  serverName,
  producerHandle,
  producerAvatarUrl,
}: PendingApprovalViewProps) {
  const handleAt = producerHandle.startsWith("@")
    ? producerHandle
    : `@${producerHandle}`;
  return (
    <main
      className="flex-1 min-w-0 flex flex-col items-center justify-center"
      style={{ padding: "48px 24px", minHeight: "70dvh" }}
    >
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 440, gap: 14 }}
      >
        <Avatar name={handleAt} src={producerAvatarUrl} size={80} />
        <div
          className="t-mono-s inline-flex items-center"
          style={{
            gap: 8,
            color: "var(--accent-text)",
            marginTop: 14,
            letterSpacing: "0.08em",
          }}
        >
          <Icon name="lock" size={12} />
          WAITING FOR APPROVAL
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 38px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "var(--fg-1)",
            margin: 0,
          }}
        >
          {serverName}
        </h1>
        <p
          className="t-body"
          style={{
            color: "var(--fg-3)",
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 360,
          }}
        >
          Your access request is waiting on{" "}
          <strong style={{ color: "var(--fg-1)" }}>{handleAt}</strong>.
          You&apos;ll get an email the moment they approve — then this page
          will unlock with every beat in the server.
        </p>
        <Link
          href="/listen"
          className="inline-flex items-center cursor-pointer transition-colors duration-fast"
          style={{
            marginTop: 18,
            gap: 8,
            padding: "12px 22px",
            height: 46,
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border-1)",
            background: "var(--bg-1)",
            color: "var(--fg-1)",
            fontFamily: "var(--font-body)",
            fontSize: 14.5,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Icon name="chevron-left" size={15} />
          Back to your listening
        </Link>
      </div>
    </main>
  );
}
