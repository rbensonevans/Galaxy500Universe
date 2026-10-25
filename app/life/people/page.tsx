import { createClient } from "@/lib/supabase/server";
import { isMissingTableError } from "@/lib/supabase/errors";
import ConnectButtons, { RespondButtons } from "./ConnectButtons";
import PersonRow from "./PersonRow";
import {
  loadRelationships,
  NO_RELATIONSHIP,
  profileHref,
  type Person,
} from "./relations";

const listClass =
  "mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 text-sm font-medium uppercase tracking-[0.25em] text-white/50">
      {children}
    </h2>
  );
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  // Keep only characters that are safe inside a quoted PostgREST filter value.
  const q = (rawQ ?? "")
    .replace(/[^\p{L}\p{N}_ .'-]/gu, "")
    .trim()
    .slice(0, 50);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;

  const { data: system } = await supabase.from("system_accounts").select("user_id");
  const hidden = [me, ...(system ?? []).map((s) => s.user_id)];

  // Search by name or @handle; with no query, show recently active members.
  let peopleQuery = supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("discoverable", true)
    .not("id", "in", `(${hidden.join(",")})`)
    .limit(30);
  if (q) {
    const pattern = `"%${q.replace(/^@/, "")}%"`;
    peopleQuery = peopleQuery.or(
      `username.ilike.${pattern},display_name.ilike.${pattern}`,
    );
  } else {
    peopleQuery = peopleQuery.order("updated_at", { ascending: false });
  }
  const { data: peopleRows, error } = await peopleQuery;
  const tableMissing = isMissingTableError(error) || error?.code === "42703";
  const people = (peopleRows ?? []) as Person[];

  // Pending requests addressed to me, and my accepted connections.
  const { data: connRows } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, kind, status")
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
  const conns = connRows ?? [];
  const incoming = conns.filter((c) => c.status === "pending" && c.addressee_id === me);
  const accepted = conns.filter((c) => c.status === "accepted");
  const otherOf = (c: { requester_id: string; addressee_id: string }) =>
    c.requester_id === me ? c.addressee_id : c.requester_id;

  const connectedIds = conns.map(otherOf);
  const { data: connectedRows } = connectedIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", connectedIds)
    : { data: [] };
  const personById = new Map<string, Person>(
    ((connectedRows ?? []) as Person[]).map((p) => [p.id, p]),
  );
  const personFor = (id: string): Person =>
    personById.get(id) ?? { id, username: null, display_name: null };

  const rels = await loadRelationships(supabase, me, [
    ...people.map((p) => p.id),
    ...connectedIds,
  ]);
  const relFor = (id: string) => rels.get(id) ?? NO_RELATIONSHIP;

  const friends = accepted.filter((c) => c.kind === "friend").map(otherOf);
  const family = accepted.filter((c) => c.kind === "family").map(otherOf);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium uppercase tracking-[0.35em] text-violet-300/80">
        People
      </p>
      <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
        Find your people
      </h1>
      <p className="mt-2 text-white/60">
        Search for citizens of Galaxy500Universe by name or @handle. Follow
        them to see more of their public posts, or connect as friends or
        family to share your Friends and Family feeds.
      </p>

      <form action="/life/people" className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or @handle"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:brightness-110"
        >
          Search
        </button>
      </form>

      {tableMissing && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <p className="font-semibold">Database setup needed</p>
          <p className="mt-1 text-amber-100/80">
            Run{" "}
            <code className="rounded bg-black/30 px-1">
              supabase/migrations/0020_people.sql
            </code>{" "}
            in your Supabase SQL Editor to enable People.
          </p>
        </div>
      )}

      {incoming.length > 0 && (
        <>
          <SectionTitle>Requests</SectionTitle>
          <ul className={listClass}>
            {incoming.map((c) => {
              const id = otherOf(c);
              return (
                <PersonRow key={c.id} person={personFor(id)} href={profileHref(id, me)}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-white/50">
                      wants to connect as {c.kind === "friend" ? "a friend" : "family"}
                    </span>
                    <RespondButtons
                      connectionId={c.id}
                      label="Accept"
                    />
                  </div>
                </PersonRow>
              );
            })}
          </ul>
        </>
      )}

      {!tableMissing && (
        <>
          <SectionTitle>{q ? `Results for “${q}”` : "Citizens"}</SectionTitle>
          {people.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">
              {q ? "No one matches that search." : "No other citizens yet."}
            </p>
          ) : (
            <ul className={listClass}>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} href={profileHref(p.id, me)}>
                  <ConnectButtons personId={p.id} rel={relFor(p.id)} />
                </PersonRow>
              ))}
            </ul>
          )}
        </>
      )}

      {[
        { title: "Your friends", ids: friends },
        { title: "Your family", ids: family },
      ].map(
        ({ title, ids }) =>
          ids.length > 0 && (
            <div key={title}>
              <SectionTitle>
                {title} · {ids.length}
              </SectionTitle>
              <ul className={listClass}>
                {ids.map((id) => (
                  <PersonRow key={id} person={personFor(id)} href={profileHref(id, me)}>
                    <ConnectButtons personId={id} rel={relFor(id)} />
                  </PersonRow>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}
