/**
 * Dashboard — placeholder smoke test for the App shell (responsive).
 *
 * Right slot:
 *   - "Show demo" ghost button hidden < sm (640px) — keeps the topbar tight
 *     on small phones where the primary CTA already says everything.
 *   - "Create a server" primary CTA always visible.
 *
 * Empty state: 8vh margin top, max-w 460, accent-surface tile + h2 + body.
 */

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/app/PageHeader";

export default function DashboardPage() {
  const activeCount = 0;
  const artistsCount = 0;

  return (
    <>
      <PageHeader
        title="Servers"
        sub={`${activeCount} ACTIVE · ${artistsCount} ARTISTS REACHED`}
        right={
          <div className="flex shrink-0 items-center gap-[8px] lg:gap-[10px]">
            <span className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Show demo
              </Button>
            </span>
            <Button icon="plus" size="sm" className="lg:!h-[38px] lg:!text-[14px]">
              <span className="hidden sm:inline">Create a server</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        }
      />

      <div className="px-[18px] py-[24px] lg:px-[30px] lg:pb-[48px] lg:pt-[28px]">
        {/* Empty state — proto-faithful, centered text without dashed card */}
        <div
          className="mx-auto flex flex-col items-center text-center"
          style={{ maxWidth: 460, marginTop: "8vh" }}
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
