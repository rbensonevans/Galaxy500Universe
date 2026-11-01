import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Email link return URL (password reset today; any Supabase email template can
// link here): verify the one-time token_hash, which signs the member in, then
// continue to `next`. Unlike /auth/callback this works when the link is opened
// on a different device or browser from the one that asked for it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/life";
  // Only same-site paths, so the link can't bounce members to another site.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/life";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await supabase.rpc("ensure_grants");
      return NextResponse.redirect(`${origin}${next}`);
    }
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/forgot-password?expired=1`);
    }
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/?auth_error=${encodeURIComponent("That email link is invalid or has expired")}`,
  );
}
