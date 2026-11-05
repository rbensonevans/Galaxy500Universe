"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LINKABLE_PROVIDERS, LINK_COOKIE } from "@/lib/verification";

export type AuthState = {
  error?: string;
  message?: string;
};

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Made during the XRP LEDGER HACKATHON
  // "Born" on entering the universe: create the wallet and pay any monthly
  // grants owed (idempotent; skips system/reserve accounts). Ignore errors so
  // login is never blocked.
  await supabase.rpc("ensure_grants");

  revalidatePath("/", "layout");
  redirect("/life");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  // Made during the XRP LEDGER HACKATHON
  // Birth: the first 2,000 GLXY monthly grant (errors never block signup).
  await supabase.rpc("ensure_grants");

  revalidatePath("/", "layout");
  redirect("/life");
}

// Single entry point used by the landing-page form. Dispatches to login or
// signup based on the hidden `mode` field so one <form> can serve both.
export async function authenticate(
  prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "login");
  return mode === "signup"
    ? signup(prevState, formData)
    : login(prevState, formData);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// Made during the XRP LEDGER HACKATHON
// Sign in (or sign up) with Google, LinkedIn, or Facebook via Supabase Auth.
// Supabase sends the member to the provider and back to /auth/callback, which
// finishes the session. Providers must be enabled in the Supabase dashboard.
const OAUTH_PROVIDERS = ["google", "linkedin_oidc", "facebook"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export async function signInWithProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "") as OAuthProvider;
  if (!OAUTH_PROVIDERS.includes(provider)) redirect("/?auth_error=Unknown%20sign-in%20provider");

  // Return to whichever host the member is on (localhost, LAN IP, or Vercel).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) {
    redirect(`/?auth_error=${encodeURIComponent(error?.message ?? "Sign-in failed")}`);
  }
  redirect(data.url);
}

const SETTINGS = "/life/profile/settings";

// Link Google or LinkedIn to the signed-in account (Supabase manual identity
// linking). The provider returns to /auth/callback like a sign-in; the cookie
// tells the callback to come back to Settings instead of entering Life.
export async function linkProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  if (!LINKABLE_PROVIDERS.includes(provider)) {
    redirect(`${SETTINGS}?link_error=${encodeURIComponent("Unknown provider")}`);
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.linkIdentity({
    provider: provider as OAuthProvider,
    options: { redirectTo: `${proto}://${host}/auth/callback` },
  });
  if (error || !data.url) {
    redirect(`${SETTINGS}?link_error=${encodeURIComponent(error?.message ?? "Linking failed")}`);
  }
  (await cookies()).set(LINK_COOKIE, "1", {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    path: "/auth/callback",
    maxAge: 600,
  });
  redirect(data.url);
}

// Unlink a provider. Supabase refuses to remove an account's only sign-in
// method, so the citizen can always still sign in.
export async function unlinkProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUserIdentities();
  const identities = data?.identities ?? [];
  const identity = identities.find((i) => i.provider === provider);
  if (!identity || identities.length < 2) {
    redirect(`${SETTINGS}?link_error=${encodeURIComponent("That account can't be unlinked.")}`);
  }
  const { error } = await supabase.auth.unlinkIdentity(identity);
  if (error) {
    redirect(`${SETTINGS}?link_error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/life", "layout");
  redirect(`${SETTINGS}?unlinked=${encodeURIComponent(provider)}`);
}

// Forgot password: email a reset link. The Reset password email template
// links to /auth/confirm (type=recovery), which signs the member in and opens
// /reset-password. The reply is the same whether or not the email has an
// account, so the form can't be used to discover who is a member.
export async function requestPasswordReset(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error && error.status === 429) {
    return { error: "Too many requests. Please wait a minute and try again." };
  }

  return {
    message:
      "If an account uses that email, a reset link is on its way. Check your inbox (and spam).",
  };
}

// Set a new password for the member signed in by the reset link.
export async function updatePassword(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirm) {
    return { error: "The passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/life");
}
