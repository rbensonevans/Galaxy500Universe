import { type PostgrestError } from "@supabase/supabase-js";

// True when a query failed because the table doesn't exist yet — i.e. the
// relevant SQL migration hasn't been run. Covers both the raw Postgres error
// (42P01, undefined_table) and the PostgREST schema-cache error (PGRST205),
// which is what Supabase's REST layer returns when a table is absent.
export function isMissingTableError(
  error: PostgrestError | null | undefined,
): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}
