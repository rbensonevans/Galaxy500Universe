import TopicPage from "../TopicPage";

export default function WeTubePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  return (
    <TopicPage
      feed="wetube"
      name="WeTube"
      title="My Videos"
      subtitle="Paste a YouTube link to view later or share a video with fellow citizens."
      universalTitle="Watch together"
      universalSubtitle="Every public video across the galaxy, newest first."
      placeholder="Paste a YouTube link and say something about it…"
      emptyText="No videos yet. Paste a YouTube link to share the first one."
      searchPlaceholder="Search videos by title or description"
      videos
      searchParams={searchParams}
    />
  );
}
