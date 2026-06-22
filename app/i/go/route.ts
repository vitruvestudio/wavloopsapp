/**
 * POST /i/go
 *
 * Consumes the click-through form on /i and redirects (303) to the
 * Supabase action_link. Hosted under /i/go so mail scanners that
 * auto-fetch the email URL (always GET) never touch this endpoint
 * — only the recipient's deliberate Continue click does.
 *
 * Open-redirector defence: validates that the submitted URL points
 * at our Supabase project (host ends with .supabase.co AND its
 * project subdomain matches NEXT_PUBLIC_SUPABASE_URL). Anything
 * else is rejected with a 400 instead of silently bouncing.
 */

import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const form = await req.formData();
  const raw = form.get("u");
  if (typeof raw !== "string" || raw.length === 0) {
    return new NextResponse("Missing target URL.", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Malformed target URL.", { status: 400 });
  }

  // Lock to our Supabase project. Any other host = reject.
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) {
    return new NextResponse(
      "NEXT_PUBLIC_SUPABASE_URL not configured.",
      { status: 500 },
    );
  }
  let allowed: URL;
  try {
    allowed = new URL(projectUrl);
  } catch {
    return new NextResponse("Misconfigured Supabase URL.", { status: 500 });
  }
  if (target.host !== allowed.host) {
    return new NextResponse(
      "Refusing to redirect outside the Supabase project.",
      { status: 400 },
    );
  }

  // 303 so the browser converts the form POST into a clean GET
  // against Supabase — which is what the verify endpoint expects.
  return NextResponse.redirect(target.toString(), 303);
}

// Defence in depth — any direct GET to /i/go (incl. scanner
// prefetch) shouldn't return content or interact with tokens.
export function GET(): NextResponse {
  return new NextResponse("Use the Continue button on /i.", { status: 405 });
}
