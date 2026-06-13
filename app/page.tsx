import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Cosmos from "@/app/components/Cosmos";
import AuthForm from "@/app/components/AuthForm";

export default async function LandingPage() {
  // Already signed in? Skip the landing page and go straight to Life.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/life");
  }

  return (
    <>
      <Cosmos />
      <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:gap-20">
        {/* Branding */}
        <div className="max-w-md text-center md:text-left">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
            Welcome to
          </p>
          <h1 className="bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl">
            Galaxy500
            <br />
            Universe
          </h1>
          <p className="mt-5 text-lg text-white/70">
            A social universe without horizons. Connect, share, and orbit the
            people and worlds you love.
          </p>
          <p className="mt-3 text-sm text-white/40">
            Sign in to enter <span className="text-white/70">Life</span>.
          </p>
        </div>

        {/* Auth */}
        <AuthForm />
      </main>
    </>
  );
}
