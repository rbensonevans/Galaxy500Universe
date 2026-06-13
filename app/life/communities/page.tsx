import SectionShell from "@/app/components/SectionShell";

export default function CommunitiesPage() {
  return (
    <SectionShell
      eyebrow="Communities"
      title="Find your people"
      blurb="Discover and build communities around shared passions — galaxies of people who care about the same things you do."
      features={[
        {
          title: "Discover",
          description: "Explore communities across interests, places, and causes.",
        },
        {
          title: "Create",
          description: "Start your own community and gather your constellation.",
        },
        {
          title: "Conversations",
          description: "Threads, events, and discussions that keep people close.",
        },
        {
          title: "Roles & moderation",
          description: "Tools to keep communities welcoming and well-run.",
        },
      ]}
    />
  );
}
