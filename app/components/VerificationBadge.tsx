import {
  badgeTitle,
  linkedProviders,
  PROVIDER_LABELS,
  type Verification,
} from "@/lib/verification";

// Simple brand marks drawn as text so they stay crisp at 14–24px.
const PROVIDER_MARKS: Record<string, { bg: string; fg: string; text: string }> = {
  google: { bg: "#ffffff", fg: "#4285F4", text: "G" },
  linkedin_oidc: { bg: "#0A66C2", fg: "#ffffff", text: "in" },
  facebook: { bg: "#1877F2", fg: "#ffffff", text: "f" },
};

function Mark({ v }: { v: Verification | null | undefined }) {
  if (v?.verified_at) {
    return (
      <svg viewBox="0 0 20 20" className="h-full w-full">
        <circle cx="10" cy="10" r="10" fill="#8b5cf6" />
        <path d="M5.8 10.4l2.8 2.8 5.6-6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const mark = PROVIDER_MARKS[linkedProviders(v)[0]];
  if (!mark) return null;
  return (
    <svg viewBox="0 0 20 20" className="h-full w-full">
      <circle cx="10" cy="10" r="10" fill={mark.bg} />
      <text x="10" y="10" dy="0.36em" textAnchor="middle" fill={mark.fg} fontSize={mark.text.length > 1 ? 10 : 13} fontWeight={700} fontFamily="Arial, Helvetica, sans-serif">
        {mark.text}
      </text>
    </svg>
  );
}

// The small mark in the corner of a citizen's photo: a violet check when
// Verified, otherwise the logo of a linked sign-in provider. Nothing for
// email-only accounts.
export function BadgeDot({ v }: { v: Verification | null | undefined }) {
  const title = badgeTitle(v);
  if (!title) return null;
  return (
    <span
      title={title}
      aria-label={title}
      role="img"
      className="absolute -bottom-0.5 -right-0.5 h-[38%] max-h-6 min-h-3.5 w-[38%] min-w-3.5 max-w-6 rounded-full ring-2 ring-background"
    >
      <Mark v={v} />
    </span>
  );
}

// The labeled version, next to the name on profile pages.
export function BadgeChip({ v }: { v: Verification | null | undefined }) {
  if (v?.verified_at) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-100">
        <span className="h-3.5 w-3.5"><Mark v={v} /></span>
        Verified
      </span>
    );
  }
  const linked = linkedProviders(v);
  if (!linked.length) return null;
  return (
    <span
      title="Signed in with this account. Full verification is coming later."
      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
    >
      <span className="h-3.5 w-3.5"><Mark v={v} /></span>
      Linked · {linked.map((p) => PROVIDER_LABELS[p]).join(", ")}
    </span>
  );
}
