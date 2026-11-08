// Topics on the Universal Feed (see supabase/migrations/0028_topics.sql).
// A topic slug or hashtag: lowercase letters, digits, underscore.
export const TOPIC_SLUG = /^[a-z][a-z0-9_]{1,49}$/;

export function topicHref(slug: string) {
  return `/life/universe?tab=topics&topic=${encodeURIComponent(slug)}`;
}
