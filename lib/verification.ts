// Verification badges (see supabase/migrations/0026_verification.sql).
// Linked: signed in with a social provider. Verified: granted by the database.
export type Verification = {
  linked_providers?: string[] | null;
  verified_at?: string | null;
};

// Display order: the first linked provider's logo is the one on the photo.
export const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  linkedin_oidc: "LinkedIn",
  facebook: "Facebook",
};

export function linkedProviders(v: Verification | null | undefined) {
  const linked = v?.linked_providers ?? [];
  return Object.keys(PROVIDER_LABELS).filter((p) => linked.includes(p));
}

export function badgeTitle(v: Verification | null | undefined) {
  if (v?.verified_at) return "Verified citizen";
  const linked = linkedProviders(v);
  if (!linked.length) return null;
  return `Linked with ${linked.map((p) => PROVIDER_LABELS[p]).join(" and ")}`;
}
