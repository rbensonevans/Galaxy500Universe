# Production Road Map

The plan for turning Galaxy500Universe from a hackathon project into a real
social media platform. It picks up where the XRP Ledger Hackathon ended
(`XRP_LEDGER_HACKATHON_CHANGES.md`, last commit `3c475d0`).

Items are grouped into phases in rough priority order. Check items off
(`[x]`) as they ship and note the commit next to them.

## Where we start

Already working on the live site (`https://www.galaxy500universe.com`, also
`galaxy500-universe.vercel.app`):

- Sign-in with email, LinkedIn, Google (Testing only), and Facebook
  (Development only).
- Life home feed, topic feeds (Friends, Family, Music, Sports, Travel,
  Communities, Movies, Gaming), Startup Feeds, and the Universal Feed.
- Posts with images (up to 5 MB), comments, reactions, and per-post
  visibility.
- People: search, profiles, follows, friend and family connections,
  notifications.
- Direct messages with requests, images, Send GLXY, and blocking.
- Galaxy Credits (GLXY): monthly grants, wallet, transfers, Crypto Bank,
  Startups and the stock exchange (all off-chain), plus a Base on-chain wallet
  connection.
- Privacy Policy and Terms of Service pages.

---

## Phase 1 — Launch foundation

Make the site ready for real users.

- [x] **Custom domain.** `https://www.galaxy500universe.com` is the main
  address; `galaxy500universe.com` redirects to it (308). Set up 2026-10-29:
  - Vercel (`galaxy500-universe` → Domains → Add Existing, Production,
    "Redirect apex domains to www").
  - GoDaddy DNS: `A @ 216.198.79.1` (replaced Parked) and
    `CNAME www 376457b25d6dc7f0.vercel-dns-017.com` (was `galaxy500universe.com.`).
  - Supabase Auth → URL Configuration: Site URL
    `https://www.galaxy500universe.com`, redirect URL
    `https://www.galaxy500universe.com/auth/callback` added (the vercel.app,
    localhost, and LAN redirect URLs stay).
  - LinkedIn, Google, and Facebook apps need no change for sign-in: they
    redirect to the Supabase callback, which is unchanged.
- [ ] **Publish Google sign-in.** Verify the domain in Google Search Console,
  complete Branding (logo, home, privacy, terms on the new domain), and move
  the app from Testing to In production.
- [ ] **Decide on Facebook sign-in.** Either take the Meta app Live (business
  verification, data-deletion URL) or remove the button.
- [ ] **One Vercel project.** Keep `galaxy500-universe`, delete the duplicate
  `galaxy500universe-project`, and make sure the remaining project has the
  new `SUPABASE_SECRET_KEY` (server-only) and the publishable key in
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Supabase production plan.** Upgrade to a paid plan for daily backups,
  point-in-time recovery, and no project pausing.
- [ ] **Email.** Custom SMTP sender (e.g. `no-reply@galaxy500universe.com`)
  for sign-up confirmation and password reset; branded email templates.
- [ ] **Monitoring.** Error tracking, uptime checks, and Vercel / Supabase
  usage alerts.
- [ ] **Legal review.** Have the Privacy Policy and Terms reviewed; add a
  contact address on the new domain; add a cookie notice if needed.

## Phase 2 — Identity and trust (Sybil resistance)

Each real person should be one citizen, because every citizen receives
monthly GLXY grants.

- [ ] **Verified identity links.** Require at least one social sign-in
  (LinkedIn / Google) before grants unlock; record which providers are linked.
- [ ] **Duplicate checks.** Flag accounts that share providers, devices, or
  signup patterns.
- [ ] **Grant locking.** New accounts hold grants in a pending state until
  verified; flagged accounts pause until reviewed.
- [ ] **Admin review.** An admin page for `iglobecreator` to review flagged
  accounts, approve, merge, or suspend.
- [ ] **Automated web check.** An AWS Bedrock AgentCore agent (with Web
  Search) that checks a new citizen's public presence and scores it for the
  admin.
- [ ] **Portable credentials.** Issue a "verified citizen" credential on the
  XRP Ledger (XLS-70 Credentials, XLS-40 DID) so verification travels with the
  person.

## Phase 3 — Safety and moderation

Required for any public social platform.

- [ ] **Report** posts, comments, messages, and profiles.
- [ ] **Moderation queue** for admins: hide, remove, warn, suspend.
- [ ] **Mute** people (lighter than block).
- [ ] **Rate limits** on posting, messaging, follows, and requests.
- [ ] **Image moderation** for uploads.
- [ ] **Account deletion and data export**, as promised in the Privacy Policy.
- [ ] **Community guidelines** page linked from Terms.

## Phase 4 — Social features

Bring the experience up to what people expect from a social platform.

- [ ] **Universal Feed algorithm.** Rank by follows, connections, reactions,
  comments, and topic interests (today: newest first, with a boost for people
  you follow).
- [ ] **Edit posts** and comments.
- [ ] **Mentions** (`@handle`) and **hashtags**, with notifications for
  mentions.
- [ ] **Notifications** for comments and reactions on your posts.
- [ ] **Video** posts and multiple images per post.
- [ ] **Group chats.**
- [ ] **Communities** as real groups (join, members, moderators), not only a
  shared feed.
- [ ] **Profile pictures and cover images.**
- [ ] **End-to-end encrypted messages** (the app currently says messages are
  not end-to-end encrypted).

## Phase 5 — Mobile

- [ ] **Installable app (PWA)**: home-screen icon, offline shell.
- [ ] **Push notifications** for messages and notifications.
- [ ] Phone layout pass across every page.
- [ ] Later: native iOS / Android apps.

## Phase 6 — Galaxy Credits economy

- [ ] **GLXY to crypto / stablecoin conversion.** Convert off-chain Galaxy
  Credits to an on-chain token or stablecoin, with agreements made through
  messaging. Choose the chain (XRP Ledger or Base).
- [ ] **Crypto wallet** for each citizen to hold the converted tokens.
- [ ] **Merchant payments.** Let citizens pay vendors, via Mastercard's
  merchant payment system (deferred from the hackathon; Mastercard was not
  integrated) or an alternative.
- [ ] **Grant policy after 50 years** (`grants_active`): decide the rule.
- [ ] **Compliance.** KYC / AML requirements for conversion and payments.

## Phase 7 — Engineering quality and scale

- [ ] **Automated tests** for database functions and row-level security
  (the PGlite tests used during the hackathon, made permanent) and for key
  pages.
- [ ] **CI on GitHub**: lint, type-check, tests on every push.
- [ ] **Staging environment**: a separate Supabase project and Vercel preview
  for trying changes before production.
- [ ] **Migration workflow**: apply migrations with the Supabase CLI instead
  of pasting into the SQL Editor.
- [ ] **Performance**: database indexes for feeds and search, image resizing
  and thumbnails, feed pagination.
- [ ] **Analytics**: active users, retention, and feature usage.

---

## Changes

Record each production change here: what changed, its commit, and its
migration (if any).

| # | Change | Commit | Migration |
|---|---|---|---|
| 1 | Custom domain `www.galaxy500universe.com` | — (Vercel, GoDaddy, Supabase setup) | — |
