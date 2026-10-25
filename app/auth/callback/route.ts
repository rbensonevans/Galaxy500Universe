// Made during the XRP LEDGER HACKATHON

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth return URL (Google / LinkedIn / Facebook): exchange the one-time code
// for a session, pay any monthly grants owed (a first sign-in is "birth"),
// then enter Life. Errors go back to the landing page.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await supabase.rpc("ensure_grants");
      return NextResponse.redirect(`${origin}/life`);
    }
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/?auth_error=${encodeURIComponent(providerError ?? "Sign-in was cancelled")}`,
  );
}
