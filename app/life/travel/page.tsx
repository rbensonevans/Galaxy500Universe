import SectionShell from "@/app/components/SectionShell";

export default function TravelPage() {
  return (
    <SectionShell
      eyebrow="Travel"
      title="Chart your journeys"
      blurb="Map the places you've been and the worlds you dream of exploring — your personal atlas across the universe."
      features={[
        {
          title: "Places visited",
          description: "Pin every destination and build your travel map.",
        },
        {
          title: "Wishlist",
          description: "Save dream destinations and plan future expeditions.",
        },
        {
          title: "Travel journal",
          description: "Capture stories, photos, and tips from each trip.",
        },
        {
          title: "Companions",
          description: "Plan and remember trips with friends and family.",
        },
      ]}
    />
  );
}
