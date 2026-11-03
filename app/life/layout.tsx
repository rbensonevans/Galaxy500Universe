import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Cosmos from "@/app/components/Cosmos";
import LifeNav from "@/app/components/LifeNav";
import ConnectWallet from "@/app/components/ConnectWallet";
import NotificationBell from "@/app/components/NotificationBell";
import MessagesLink from "@/app/components/MessagesLink";
import Avatar from "@/app/components/Avatar";

// Shared shell for the entire authenticated Life area: cosmic background,
// header with section navigation, and sign-out. The proxy middleware already
// guards /life, but we re-check here so nothing renders without a user.
export default async function LifeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  // Made during the XRP LEDGER HACKATHON
  // Catch up any monthly grants owed (e.g. a new month began while the member
  // stayed signed in). Cheap no-op when nothing is due; never blocks render.
  await supabase.rpc("ensure_grants");

  // Made during the XRP LEDGER HACKATHON
  const [{ count: unread }, { data: me }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("profiles")
      .select("display_name, username, avatar_path")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const myName = me?.display_name || me?.username || user.email || "?";

  return (
    <>
      <Cosmos />
      <div className="flex min-h-svh flex-col">
        <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-center gap-6">
            {/* Made during the XRP LEDGER HACKATHON */}
            <Link
              href="/life/universe"
              title="Universal Feed"
              className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent"
            >
              Galaxy500Universe
            </Link>
            <LifeNav />
          </div>
          <div className="flex items-center gap-4">
            {/* Made during the XRP LEDGER HACKATHON */}
            <MessagesLink />
            <NotificationBell unread={unread ?? 0} />
            <ConnectWallet />
            {/* Profile photo: opens the profile (Settings and Sign out live there). */}
            <Link
              href="/life/profile"
              title="Your profile"
              aria-label="Your profile"
              className="rounded-full ring-2 ring-white/15 transition hover:ring-white/40"
            >
              <Avatar path={me?.avatar_path} name={myName} className="h-9 w-9 text-sm" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
          {children}
        </main>
      </div>
    </>
  );
}
