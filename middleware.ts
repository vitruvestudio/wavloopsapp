/**
 * Root Next middleware — refresh Supabase session on every request,
 * gate /listen/* on auth (see lib/supabase/middleware.ts for the
 * full logic).
 *
 * The matcher excludes static asset paths (_next/static, image
 * optimisation, favicon, common image extensions) so we don't pay
 * the cost of an Auth server roundtrip on every CSS / image fetch.
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
