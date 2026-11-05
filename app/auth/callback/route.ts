// Made during the XRP LEDGER HACKATHON

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LINK_COOKIE } from "@/lib/verification";

// OAuth return URL (Google / LinkedIn / Facebook): exchange the one-time code
// for a session, pay any monthly grants owed (a first sign-in is "birth"),
// then enter Life. Errors go back to the landing page. When linking a
// provider from Settings (LINK_COOKIE set), both outcomes return to Settings.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  const jar = await cookies();
  const linking = jar.get(LINK_COOKIE)?.value === "1";
  if (linking) jar.delete({ name: LINK_COOKIE, path: "/auth/callback" });
  const fail = (message: string) =>
    NextResponse.redirect(
      linking
        ? `${origin}/life/profile/settings?link_error=${encodeURIComponent(message)}`
        : `${origin}/?auth_error=${encodeURIComponent(message)}`,
    );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.rpc("ensure_grants");
      return NextResponse.redirect(
        linking ? `${origin}/life/profile/settings?linked=1` : `${origin}/life`,
      );
    }
    return fail(error.message);
  }

  return fail(providerError ?? (linking ? "Linking was cancelled" : "Sign-in was cancelled"));
}
