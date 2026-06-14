# Galaxy500Universe

A social universe. The landing page is an animated cosmic scene with login
authentication; after signing in, members land on **Life** — their home in the
universe.

Built with **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**,
with authentication and data backed by **Supabase**.

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Add your credentials.** Copy the example env file and fill in the values
   from your Supabase dashboard (Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

3. **Create the database tables.** In the Supabase dashboard open
   **SQL Editor → New query** and run each migration in `supabase/migrations/`:
   - `0001_startups.sql` — `startups` table
   - `0002_profiles.sql` — `profiles` table
   - `0003_feed.sql` — `posts`, `comments`, `reactions` tables, a public
     `post-images` storage bucket, and read access to other members' profiles

   Each enables row-level security (members write only their own rows; the feed
   and profiles are readable by any signed-in member). Until a migration runs,
   its section shows a setup banner.

4. **(Optional) Smooth out local signups.** By default Supabase requires email
   confirmation, so a new account can't sign in until the link is clicked. For
   fast local testing, turn off **Confirm email** under
   Authentication → Providers → Email in the Supabase dashboard.

5. **Install and run:**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## How auth works

- `lib/supabase/{client,server}.ts` — Supabase clients for browser and
  server (Server Components / Actions) respectively.
- `proxy.ts` + `lib/supabase/middleware.ts` — refreshes the session on every
  request and redirects unauthenticated visitors away from protected routes
  (anything under `/life`).
- `app/auth/actions.ts` — server actions for `login`, `signup`, and `signOut`.
- `app/page.tsx` — the landing page (redirects to `/life` if already signed in).
- `app/life/page.tsx` — the protected **Life** home page.

## The Life area

After signing in, members land on **Life** (`/life`), a shared social feed:
post text and images ("How is it going?"), comment on posts, and react to both
posts and comments with emojis (with like counts). The shared layout
(`app/life/layout.tsx`) provides the cosmic background, navigation, and
sign-out; everything under `/life` is auth-guarded.

Feed internals: `Composer` (new post + image upload), `PostCard` /
`CommentForm` (comments), and `ReactionBar` (emoji toggles — pure server-action
forms, no client JS). Server actions live in `app/life/actions.ts`; the page
assembles posts, comments, reactions, and author names in `app/life/page.tsx`.

The top nav also links to the member sections:

- **Startups** (`/life/startups`) — register, list, and delete the companies you
  create. Backed by the `startups` table (server actions in
  `app/life/startups/actions.ts`).
- **Profile** (`/life/profile`) — edit how you appear across the universe
  (display name, bio, location, website). Backed by the `profiles` table; the
  save action upserts in `app/life/profile/actions.ts`.
- **Friends & Family** (`/life/friends-family`)
- **Travel** (`/life/travel`)
- **Communities** (`/life/communities`)

The latter three are navigable, styled section shells ready to be built out.
Section metadata and icons are defined once in `app/life/sections.tsx` and shared
by the dashboard cards and the nav (`app/components/LifeNav.tsx`).
