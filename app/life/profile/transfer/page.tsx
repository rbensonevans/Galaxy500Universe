import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TransferCard from "../TransferCard";

export default async function TransferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user!.id)
    .maybeSingle();
  const balance = wallet ? Number(wallet.balance) : null;

  return (
    <div className="max-w-2xl">
      <Link
        href="/life/profile"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        Back to profile
      </Link>

      <p className="mt-3 text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        Profile
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Send Galaxy Credits
      </h1>
      <p className="mt-3 max-w-xl text-white/60">
        Transfer GLXY to another member by their @handle.
      </p>

      <div className="mt-8">
        <TransferCard balance={balance} />
      </div>
    </div>
  );
}
