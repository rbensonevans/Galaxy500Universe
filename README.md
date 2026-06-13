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

3. **(Optional) Smooth out local signups.** By default Supabase requires email
   confirmation, so a new account can't sign in until the link is clicked. For
   fast local testing, turn off **Confirm email** under
   Authentication → Providers → Email in the Supabase dashboard.

4. **Install and run:**

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
