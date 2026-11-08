import TopicPage from "../TopicPage";

export default function SportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  return (
    <TopicPage
      feed="sports"
      name="Sports"
      title="Game on"
      subtitle="Teams, scores, highlights, and everything in play."
      universalSubtitle="What's in play across the galaxy, newest first."
      placeholder="What's the play?"
      emptyText="No sports posts yet. Share a score, a highlight, or your team."
      searchPlaceholder="Search sports posts"
      searchParams={searchParams}
    />
  );
}
