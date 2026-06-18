/**
 * (app) — route group layout for every producer-side screen.
 *
 * Server component: fetches the topbar viewer (display name +
 * avatar URL + email) once per request, hands it to every client
 * component inside the shell via ProducerContextProvider, then
 * renders the client AppShell.
 *
 * Visual chrome (sidebar + topbar + playerdock + mobile drawer)
 * lives in AppShell.tsx so this file stays a thin
 * fetch-and-provide.
 *
 * Architecture mirrors the prototype's `ProducerShell`:
 *
 *   ┌──────────────── outer flex column ────────────────┐
 *   │  ┌── inner flex row (flex-1 min-h-0 overflow-hidden)──┐
 *   │  │   Sidebar │ TopBar (full-width) ──────────────┐    │
 *   │  │           │ ┌──── constrained 1440px ────┐    │    │
 *   │  │           │ │  PageHeader + page content   │    │    │
 *   │  │           │ └──────────────────────────────┘    │    │
 *   │  └──────────────────────────────────────────────────┘
 *   │  PlayerDock — full-bleed across sidebar + content    │
 *   └──────────────────────────────────────────────────────┘
 */

import { AppShell } from "./_components/AppShell";
import { ProducerContextProvider } from "./_components/ProducerContext";
import {
  loadProducerNotifications,
  loadProducerViewer,
} from "./_data";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewer, notifications] = await Promise.all([
    loadProducerViewer(),
    loadProducerNotifications(),
  ]);
  return (
    <ProducerContextProvider value={{ viewer, notifications }}>
      <AppShell>{children}</AppShell>
    </ProducerContextProvider>
  );
}
