import SectionShell from "@/app/components/SectionShell";

export default function FriendsFamilyPage() {
  return (
    <SectionShell
      eyebrow="Friends & Family"
      title="Your closest orbits"
      blurb="The people who matter most — keep them near, share moments, and stay connected across the universe."
      features={[
        {
          title: "Inner circle",
          description:
            "Group the people closest to you and see their updates first.",
        },
        {
          title: "Shared moments",
          description:
            "Photos, milestones, and memories shared privately with loved ones.",
        },
        {
          title: "Stay in touch",
          description:
            "Gentle reminders to reach out to the people you care about.",
        },
        {
          title: "Family tree",
          description: "Map the constellations of your family across generations.",
        },
      ]}
    />
  );
}
