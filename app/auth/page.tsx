/**
 * /auth route — full-page producer authentication.
 *
 * Lives at the top level of the App Router, NOT inside the `(app)` route
 * group, so it intentionally inherits only the root layout (fonts + theme)
 * and renders without the producer App shell (Sidebar/TopBar/PlayerDock).
 *
 * The interactive form is split into AuthScreen.tsx (client component) so
 * we can keep this file as a server component and export metadata cleanly.
 */

import type { Metadata } from "next";
import { AuthScreen } from "./AuthScreen";

export const metadata: Metadata = {
  title: "Log in to Wavloops",
  description: "Drop beats into shareable servers. One link, every contact.",
};

export default function AuthPage() {
  return <AuthScreen />;
}
