import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import Cosmos from "@/app/components/Cosmos";
import LifeNav from "@/app/components/LifeNav";
import ConnectWallet from "@/app/components/ConnectWallet";

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

  return (
    <>
      <Cosmos />
      <div className="flex min-h-svh flex-col">
        <header className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex items-center gap-6">
            <Link
              href="/life"
              className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent"
            >
              Galaxy500Universe
            </Link>
            <LifeNav />
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-white/40 lg:inline">
              {user.email}
            </span>
            <ConnectWallet />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
          {children}
        </main>
      </div>
    </>
  );
}
