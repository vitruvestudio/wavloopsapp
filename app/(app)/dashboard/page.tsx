/**
 * Dashboard — placeholder smoke test for the App shell.
 *
 * Two parts (matches the proto's DashboardScreen):
 *   1. PageHeader  — title + mono sub (count summary) + right buttons
 *   2. Content     — empty state: accent-surface tile + h2 + body-l + CTA,
 *                    centred at 8vh from the top
 *
 * Server grid lands in the next commit (ServerCard primitive + real data).
 */

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/app/PageHeader";

export default function DashboardPage() {
  // Placeholder summary numbers. Real values land with Supabase data.
  const activeCount = 0;
  const artistsCount = 0;

  return (
    <>
      <PageHeader
        title="Servers"
        sub={`${activeCount} ACTIVE · ${artistsCount} ARTISTS REACHED`}
        right={
          <div className="flex items-center" style={{ gap: 10 }}>
            <Button variant="ghost" size="sm">
              Show demo
            </Button>
            <Button icon="plus">Create a server</Button>
          </div>
        }
      />

      <div style={{ padding: "28px 30px 48px" }}>
        {/* Empty state — proto-faithful: no dashed border, just centered text */}
        <div
          className="mx-auto flex flex-col items-center text-center"
          style={{
            maxWidth: 460,
            marginTop: "8vh",
          }}
        >
          <div
            className="flex items-center justify-center text-accent-text"
            style={{
              width: 72,
              height: 72,
              borderRadius: "var(--r-xl)",
              background: "var(--accent-surface)",
              marginBottom: 22,
            }}
          >
            <Icon name="server" size={34} />
          </div>
          <h2 className="t-h2" style={{ marginBottom: 10 }}>
            Create your first server
          </h2>
          <p className="t-body-l" style={{ marginBottom: 24 }}>
            A server is a living folder of beats. Share its link, capture
            artists&rsquo; emails, and watch the plays roll in.
          </p>
          <Button size="lg" icon="plus">
            Create a server
          </Button>
        </div>
      </div>
    </>
  );
}
