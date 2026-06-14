import type { ComponentType, SVGProps } from "react";

// Shared definition of the Life sections, consumed by both the dashboard cards
// (app/life/page.tsx) and the top navigation (app/components/LifeNav.tsx).
// Pure data + SVG icons, so it is safe to import from server or client code.

type IconProps = SVGProps<SVGSVGElement>;

export type Section = {
  slug: string;
  name: string;
  href: string;
  blurb: string;
  icon: ComponentType<IconProps>;
  /** Tailwind gradient classes for the card accent. */
  accent: string;
};

function RocketIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function GlobeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function GamingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="6" y1="11" x2="10" y2="11" />
      <line x1="8" y1="9" x2="8" y2="13" />
      <line x1="15" y1="12" x2="15.01" y2="12" />
      <line x1="18" y1="10" x2="18.01" y2="10" />
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  );
}

function MoviesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5" />
    </svg>
  );
}

function MusicIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function SportsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-3.5 19.4M12 2a10 10 0 0 1 3.5 19.4" />
      <path d="M2.5 9.5 12 12l9.5-2.5M12 12v9.8" />
    </svg>
  );
}

function ProfileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CommunitiesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export const SECTIONS: Section[] = [
  {
    slug: "startups",
    name: "Startups",
    href: "/life/startups",
    blurb: "Register and grow the companies you create.",
    icon: RocketIcon,
    accent: "from-violet-500/30 to-fuchsia-500/10",
  },
  {
    slug: "friends-family",
    name: "Friends & Family",
    href: "/life/friends-family",
    blurb: "Your closest orbits — the people who matter most.",
    icon: HeartIcon,
    accent: "from-rose-500/30 to-orange-500/10",
  },
  {
    slug: "music",
    name: "Music",
    href: "/life/music",
    blurb: "Tracks, artists, and the sounds you love.",
    icon: MusicIcon,
    accent: "from-fuchsia-500/30 to-indigo-500/10",
  },
  {
    slug: "sports",
    name: "Sports",
    href: "/life/sports",
    blurb: "Game day, teams, and everything in play.",
    icon: SportsIcon,
    accent: "from-emerald-500/30 to-lime-500/10",
  },
  {
    slug: "travel",
    name: "Travel",
    href: "/life/travel",
    blurb: "Chart the places you've been and worlds to explore.",
    icon: GlobeIcon,
    accent: "from-cyan-500/30 to-emerald-500/10",
  },
  {
    slug: "communities",
    name: "Communities",
    href: "/life/communities",
    blurb: "Find your people across shared passions.",
    icon: CommunitiesIcon,
    accent: "from-amber-500/30 to-violet-500/10",
  },
  {
    slug: "profile",
    name: "Profile",
    href: "/life/profile",
    blurb: "How you appear across the universe.",
    icon: ProfileIcon,
    accent: "from-sky-500/30 to-fuchsia-500/10",
  },
];

// Overflow feeds surfaced on the /life/more page (keeps the top nav tidy).
// Add new social feeds here and they appear on the More page automatically.
export const MORE_SECTIONS: Section[] = [
  {
    slug: "movies",
    name: "Movies",
    href: "/life/movies",
    blurb: "Films, shows, and what to watch next.",
    icon: MoviesIcon,
    accent: "from-amber-500/30 to-rose-500/10",
  },
  {
    slug: "gaming",
    name: "Gaming",
    href: "/life/gaming",
    blurb: "Games, streams, and squads.",
    icon: GamingIcon,
    accent: "from-indigo-500/30 to-emerald-500/10",
  },
];
