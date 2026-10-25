# XRP LEDGER HACKATHON changes

Changes to Galaxy500Universe made during the XRP Ledger Hackathon
(version 2 of the project), October 24–25, 2026. Version 1 ends at commit
`ec715dc` ("Make personal feeds private, keep Startup Feed public").

Hackathon code is marked with the comment **"Made during the XRP LEDGER
HACKATHON"**: as a header line on files created during the hackathon, and
above each block added to a version-1 file (`//` in TypeScript, `{/* */}` in
JSX, `--` in SQL). Search for it to see every hackathon change in place.

Every database change is a migration in `supabase/migrations/` and is also
folded into `supabase/SETUP.sql` (the single source of truth for a fresh
database). Migrations are run by hand in the Supabase SQL Editor.

| # | Change | Commit | Migration |
|---|---|---|---|
| 1 | Friends and Family feeds | `e9005c7` | — (one-time data fix) |
| 2 | Universal Feed + post visibility | `d98f1e5` | `0018_posts_public_flag.sql` |
| 3 | Monthly Galaxy Credit grants | `4be987e` | `0019_monthly_grants.sql` |
| 4 | People: search, follows, friends/family, notifications | `25e29e3` | `0020_people.sql` |
| 5 | Direct messages, message requests, Send GLXY, blocking | `d4e3e38` | `0021_messages.sql` |
| 6 | Images in direct messages | `e0333d5` | `0022_message_images.sql` |
| 7 | Post images over 1 MB, phone fixes, key incident | `1298d7e` | `0023_post_images_limits.sql` |
| 8 | Sign in with Google / LinkedIn / Facebook | (this commit) | — (Supabase dashboard setup) |

---

## 1. Friends and Family feeds

"Friends & Family" became two separate feeds.

- **Friends** at `/life/friends` (new `friends` feed) and **Family** at
  `/life/family` (keeps the existing `family` feed). The old
  `/life/friends-family` route was removed.
- Each feed has its own nav entry and icon (`app/life/sections.tsx`).
- The one existing Friends & Family post was moved to Friends with a
  one-time SQL update (`feed = 'friends'`).

## 2. Universal Feed and per-post visibility

The **Galaxy500Universe** logo now opens a **Universal Feed**
(`/life/universe`); **Life** stays the member's home feed.

- The Universal Feed shows every public post plus every Startup Feed post,
  labeled with where each came from ("in Friends", "in Acme · Startup Feed").
- Personal-feed composers gained a **Share to Universal Feed** option (off
  by default). Your own posts show a visibility badge.
- **Database (0018):** `posts.is_public` (default `false`, so existing posts
  stayed private) and a widened posts read policy.

## 3. Monthly Galaxy Credit grants

Replaced the 1,000,000 GLXY lump-sum birth grant (see `FINANCIAL_MODEL.md` §3).

- Citizens receive **2,000 GLXY at birth (account creation) and on the 1st of
  every month** — 600 guaranteed months over 50 years = **1,200,000 GLXY**.
  After 50 years grants continue while the citizen is alive
  (`grants_active`); that policy is to be decided.
- Grants are paid by a **pg_cron job** (`galaxy-monthly-grants`,
  00:00 UTC on the 1st) and caught up on login and Life page loads; never
  double-paid.
- **One-time reset** of existing citizens: the old lump sum was returned to
  the reserve (capped at wallet balance, so no one went negative) and the
  monthly grants owed since birth were paid.
- The Wallet page shows issued grants, the current month out of 600, and the
  next grant date.
- **Database (0019):** `wallets.issued_grants`, `grant_months`,
  `last_grant_at`, `grants_active`; functions `ensure_grants()`,
  `pay_monthly_grants()`, `_pay_grants()`, `_grant_months_due()`
  (`ensure_birth_grant()` kept as an alias).

## 4. People: discover and connect

- **People** page (`/life/people`): search citizens by name or @handle; see
  incoming requests and your friends and family.
- **Member profiles** (`/life/people/[id]`): follower / following / friends /
  family counts, connect buttons, and the posts you're allowed to see.
- **Follow** (one-way, no approval) from posts, profiles, and search. Posts by
  people you follow get a 24-hour boost on the Universal Feed — the first
  interest signal for the feed "algorithm".
- **Friend and family requests** (accept / decline / cancel / remove).
  Accepted friends see each other's Friends posts; accepted family see
  Family posts.
- **Notifications** (`/life/notifications` and the header bell) for follows,
  requests, and acceptances, with Follow back / Accept / Decline.
- Profile setting **Show me in People search**.
- **Database (0020):** `follows`, `connections`, `notifications`,
  `profiles.discoverable`; functions `follow_user`, `unfollow_user`,
  `request_connection`, `respond_connection`, `remove_connection`,
  `mark_notifications_read`, `is_connected`; posts policy extended for
  Friends / Family visibility.

## 5. Direct messages

- **Inbox** (`/life/messages`) with Chats and Requests tabs, and one-on-one
  **chats** (`/life/messages/[id]`) with **live delivery** over Supabase
  Realtime and an unread badge in the header.
- Friends, family, and mutual follows message directly; anyone else starts a
  **message request** (accept, decline, or reply to accept; capped at 5
  messages until accepted).
- **Send GLXY in chat** with an optional note, recorded in both wallets'
  activity. Available once a conversation is accepted.
- Delete your own text messages (removed for both members); payment messages
  are permanent.
- **Block / Unblock** on profiles and chats: stops messages, follows, and
  friend/family requests both ways and removes existing ties.
- Messages are private to the two members (RLS) but **not end-to-end
  encrypted**; the app says so.
- **Database (0021):** `blocks`, `conversations`, `messages`; functions
  `send_message`, `send_glxy_message`, `respond_message_request`,
  `mark_conversation_read`, `delete_message`, `unread_message_count`,
  `can_message_directly`, `block_user`, `unblock_user`; block checks added to
  `follow_user` and `request_connection`; `messages` and `conversations`
  added to the `supabase_realtime` publication.

## 6. Images in direct messages

- **Photo** button in the chat composer (PNG, JPEG, GIF, WebP; up to 5 MB).
- Images go to a **private** `message-images` bucket and are shown through
  1-hour signed links; only the two members of the conversation can view
  them. Inbox previews show "📷 Photo".
- Images unlock once a conversation is accepted. Deleting an image message
  also deletes the file.
- **Database (0022):** `messages.image_path`, `can_view_message_image()`,
  `send_message(to, body, image_path)`, `delete_message` returning the image
  path; the bucket and its storage policies.

## 7. Post images over 1 MB, phone fixes, and a key incident

- **Post images over 1 MB** failed because Next.js server actions cap request
  bodies at 1 MB. Post (and message) images now upload **from the browser
  straight to Supabase Storage**; the server receives only the file path and
  checks it belongs to the poster.
- **Database (0023):** the `post-images` bucket now enforces 5 MB and PNG /
  JPEG / GIF / WebP (no SVG) at the storage layer.
- Post and chat composers show unexpected errors inline instead of crashing
  to "This page couldn't load"; the post composer resets after every post.
- **Phone testing on the dev server** (`http://<laptop LAN IP>:3000`):
  `lib/uuid.ts` provides a random-ID fallback for non-secure pages, and
  `next.config.ts` sets `allowedDevOrigins` for the laptop's IP.
- **Security incident (fixed):** the live Vercel deployment
  (`galaxy500-universe`) had been built with a Supabase **secret** key in
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, exposing admin access to every browser.
  The variable was set to the **publishable** key, the site was redeployed,
  and the leaked secret key was revoked in Supabase. `NEXT_PUBLIC_` variables
  must only ever hold the publishable key.

## 8. Sign in with Google, LinkedIn, or Facebook

A simple identity step for the hackathon (a fuller Sybil-resistance design —
verified identity links, duplicate checks, grant locking, an AgentCore web
check, admin review by `iglobecreator`, and XRPL Credentials — is deferred to
post-hackathon).

- The sign-in card offers **Continue with Google / LinkedIn / Facebook** above
  the email form (`app/components/AuthForm.tsx`, `signInWithProvider` in
  `app/auth/actions.ts`).
- `app/auth/callback/route.ts` finishes the sign-in, pays any monthly grants
  owed (a first sign-in is "birth"), and opens Life; errors return to the
  landing page.
- Supabase links a provider sign-in to an existing account with the same
  email, so one email stays one citizen.
- **Setup (Supabase dashboard):** Authentication → URL Configuration (Site
  URL + `/auth/callback` redirect URLs for Vercel, localhost, and the LAN IP),
  and each provider enabled under Sign In / Providers with its client ID and
  secret. Google is enabled; LinkedIn and Facebook follow the same pattern.

---

## Deployment notes

- Pushing to `master` on GitHub auto-deploys two Vercel projects:
  **galaxy500-universe** and **galaxy500universe-project**.
- `NEXT_PUBLIC_` values are baked in at build time — after changing one in
  Vercel, redeploy.
