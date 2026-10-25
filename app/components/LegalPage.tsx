// Made during the XRP LEDGER HACKATHON

import Link from "next/link";
import Cosmos from "@/app/components/Cosmos";

// Shared shell for the public Privacy and Terms pages (linked from the
// sign-in providers' consent screens and the landing page).
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Cosmos />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-white/50 transition hover:text-white">
          ← Galaxy500Universe
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/40">Last updated {updated}</p>
        <div className="mt-8 flex flex-col gap-5 leading-relaxed text-white/75 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
    </>
  );
}
