/**
 * Dashboard — placeholder smoke test for the App shell.
 *
 * Renders the page-level title block + an empty grid area inside the
 * (app) layout's content slot. Validates that:
 *   - Sidebar / TopBar / content scroll all line up correctly
 *   - DS tokens (`.t-h1`, `.t-mono-s`, bg-bg-0, fg-*) all resolve
 *   - Layout doesn't break when the PlayerDock is hidden (current = null)
 *
 * Replaced by the real ServerCard grid in a later commit.
 */

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function DashboardPage() {
  return (
    <div className="px-sp-8 py-sp-8">
      {/* Page header */}
      <header className="mb-sp-8 flex items-end justify-between gap-sp-4">
        <div>
          <div className="t-mono-s mb-sp-2 text-accent-text">SERVERS</div>
          <h1 className="t-h1">Your living beat servers.</h1>
          <p className="t-body-l mt-sp-2 max-w-[52ch]">
            Drop beats into a server, share one link, and let it stay alive —
            no more sending packs one artist at a time.
          </p>
        </div>
        <Button icon="plus" size="lg">
          Create a server
        </Button>
      </header>

      {/* Empty state — replaced by ServerCard grid later */}
      <div className="rounded-lg border border-dashed border-border-strong bg-bg-1 p-sp-12 text-center">
        <div
          className="mx-auto mb-sp-5 flex items-center justify-center rounded-xl bg-accent-surface text-accent-text"
          style={{ width: 72, height: 72 }}
        >
          <Icon name="server" size={32} />
        </div>
        <h2 className="t-h2 mb-sp-2">No servers yet.</h2>
        <p className="t-body-l mx-auto mb-sp-6 max-w-[44ch]">
          A server is a living folder of beats. Share its link, capture
          artists&rsquo; emails, and watch the plays roll in.
        </p>
        <Button icon="plus" size="lg">
          Create your first server
        </Button>
      </div>
    </div>
  );
}
