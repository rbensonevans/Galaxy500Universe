import TopicPage from "../TopicPage";

export default function MusicPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  return (
    <TopicPage
      feed="music"
      name="Music"
      title="Turn it up"
      subtitle="Share tracks, artists, and the sounds moving you right now."
      universalSubtitle="What citizens across the galaxy are listening to, newest first."
      placeholder="What are you listening to?"
      emptyText="No music shared yet. Drop a track or an artist you love."
      searchPlaceholder="Search music posts"
      searchParams={searchParams}
    />
  );
}
