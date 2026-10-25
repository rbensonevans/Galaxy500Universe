// Made during the XRP LEDGER HACKATHON

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Feed from "../../Feed";
import ConnectButtons from "../ConnectButtons";
import BlockButton from "../../messages/BlockButton";
import { loadRelationships, NO_RELATIONSHIP, personName, UUID_RE } from "../relations";

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const me = user!.id;
  if (id === me) redirect("/life/profile");

  const count = { count: "exact" as const, head: true };
  const [
    { data: profile },
    { count: followers },
    { count: following },
    { count: friends },
    { count: family },
    rels,
    { data: block },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, bio, location, website")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("follows").select("follower_id", count).eq("followee_id", id),
    supabase.from("follows").select("followee_id", count).eq("follower_id", id),
    supabase
      .from("connections")
      .select("id", count)
      .eq("kind", "friend")
      .eq("status", "accepted")
      .or(`requester_id.eq.${id},addressee_id.eq.${id}`),
    supabase
      .from("connections")
      .select("id", count)
      .eq("kind", "family")
      .eq("status", "accepted")
      .or(`requester_id.eq.${id},addressee_id.eq.${id}`),
    loadRelationships(supabase, me, [id]),
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", me)
      .eq("blocked_id", id)
      .maybeSingle(),
  ]);
  const blockedByMe = Boolean(block);
  const rel = rels.get(id) ?? NO_RELATIONSHIP;
  const name = personName(profile);

  const stats = [
    { label: "Followers", value: followers ?? 0 },
    { label: "Following", value: following ?? 0 },
    { label: "Friends", value: friends ?? 0 },
    { label: "Family", value: family ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/life/people"
        className="inline-flex items-center gap-1 text-sm text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
        People
      </Link>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-fuchsia-500/20">
          {name.replace(/^@/, "").charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold text-white sm:text-4xl">
            {name}
          </h1>
          {profile?.username && (
            <p className="font-mono text-sm text-violet-200/80">
              @{profile.username}
            </p>
          )}
          {rel.followsMe && (
            <p className="mt-1 text-xs text-white/40">Follows you</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {blockedByMe ? (
          <p className="text-sm text-white/50">
            You blocked {name}. They can&apos;t message, follow, or connect with
            you.
          </p>
        ) : (
          <ConnectButtons personId={id} rel={rel} />
        )}
        <BlockButton personId={id} blocked={blockedByMe} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
          >
            <dt className="text-xs text-white/50">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-white">
              {s.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      {(profile?.bio || profile?.location || profile?.website) && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          {profile?.bio && (
            <p className="whitespace-pre-wrap text-white/80">{profile.bio}</p>
          )}
          {(profile?.location || profile?.website) && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50">
              {profile?.location && <span>{profile.location}</span>}
              {profile?.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300/80 hover:text-cyan-200"
                >
                  {profile.website}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium uppercase tracking-[0.25em] text-white/50">
        Posts
      </h2>
      <p className="mt-1 text-xs text-white/40">
        Public posts{rel.friend?.status === "accepted" ? ", Friends posts" : ""}
        {rel.family?.status === "accepted" ? ", Family posts" : ""}, and
        Startup Feed updates you can see.
      </p>
      <Feed
        feed="author"
        authorId={id}
        canPost={false}
        emptyText="No posts you can see yet."
      />
    </div>
  );
}
