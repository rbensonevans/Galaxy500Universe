// Profile photos live in the public `avatars` bucket at <user id>/<uuid>.<ext>
// (see supabase/migrations/0025_avatars.sql); profiles.avatar_path holds the
// current one.
export const AVATAR_BUCKET = "avatars";

export function avatarPathPattern(userId: string) {
  return new RegExp(`^${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
}

export function avatarUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
