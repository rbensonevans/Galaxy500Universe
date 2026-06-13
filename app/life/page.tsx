import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import Cosmos from "@/app/components/Cosmos";

export default async function LifePage() {
  // Middleware already guards /life, but we re-check here so the page never
  // renders without a user (and so we can greet them by email).
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
        <header className="flex items-center justify-between px-6 py-5 sm:px-10">
          <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Galaxy500Universe
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
            Life
          </p>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">
            Welcome to Life
          </h1>
          <p className="mt-4 max-w-md text-white/60">
            Signed in as{" "}
            <span className="text-white/90">{user.email}</span>. This is your
            home in the universe — your feed and connections will live here.
          </p>
        </main>
      </div>
    </>
  );
}
