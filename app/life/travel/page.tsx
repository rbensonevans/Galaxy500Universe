import TopicPage from "../TopicPage";

export default function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  return (
    <TopicPage
      feed="travel"
      name="Travel"
      title="Journeys across the universe"
      subtitle="Share the places you've been and the worlds you dream of exploring."
      universalSubtitle="Journeys citizens are sharing across the galaxy, newest first."
      placeholder="Where are you off to?"
      emptyText="No journeys shared yet. Post a place you've been or want to go."
      searchPlaceholder="Search travel posts"
      searchParams={searchParams}
    />
  );
}
