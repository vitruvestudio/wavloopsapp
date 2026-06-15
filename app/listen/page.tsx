/**
 * /listen — landing for the artist panel.
 *
 * Phase 1: redirects to the first server in the mock data so the
 * shell always shows something useful. Phase 3 will swap this for
 * a real "pick which producer to listen to" landing OR an auto-
 * redirect to the most recently active server.
 */

import { redirect } from "next/navigation";
import { PRODUCERS } from "./_mock";

export default function ListenLanding() {
  const firstServer = PRODUCERS[0]?.servers[0];
  if (firstServer) {
    redirect(`/listen/${firstServer.slug}`);
  }
  return null;
}
