import Link from "next/link";
import Cosmos from "@/app/components/Cosmos";

// Centered card on the cosmic background, for the public password pages.
export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Cosmos />
      <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-sm text-white/50 transition hover:text-white">
            ← Galaxy500Universe
          </Link>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
