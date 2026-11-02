# Production Road Map

The plan for turning Galaxy500Universe from a hackathon project into a real
social media platform. It picks up where the XRP Ledger Hackathon ended
(`XRP_LEDGER_HACKATHON_CHANGES.md`, last commit `3c475d0`).

Items are grouped into phases in rough priority order. Check items off
(`[x]`) as they ship and note the commit next to them.

## Where we start

Already working on the live site (`https://www.galaxy500universe.com`, also
`galaxy500-universe.vercel.app`, Vercel project `galaxy500-universe`):

- Sign-in with email, LinkedIn, and Google (Facebook set up but hidden until
  the Meta app is Live).
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
- Privacy Policy, Terms of Service, and Data Deletion pages.

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
- [x] **Publish Google sign-in.** Done 2026-10-29; Google sign-in is open to
  everyone.
  - Google Search Console: Domain property `galaxy500universe.com`, verified
    through GoDaddy (adds a `google-site-verification` TXT record; don't
    remove it).
  - Google Auth Platform → Branding: home `https://www.galaxy500universe.com`,
    privacy `/privacy`, terms `/terms`, authorized domain
    `galaxy500universe.com` (vercel.app removed). No logo yet — adding one
    starts Google's brand review.
  - Google Auth Platform → Audience: Published, status **In production**.
- [ ] **App logo** on the Google consent screen (needs a 120×120 logo and
  Google's brand review).
- [ ] **Custom auth domain** (Supabase paid add-on) so sign-in screens show
  `galaxy500universe.com` instead of `qnytfkhvetgckbgueggx.supabase.co`.
- [ ] **Facebook sign-in Live.** Decided 2026-10-29 to take the Meta app Live.
  - [x] Public Data Deletion page `/data-deletion` (`7d6aae3`).
  - [x] Meta App settings → Basic: app domain, privacy, terms, and data
    deletion URLs; category. Use case permissions `public_profile` and
    `email` added.
  - [ ] **Meta business verification** (required by Meta's Publish page),
    then Publish.
  - [ ] Show the button again: uncomment the Facebook entry in
    `app/components/AuthForm.tsx` (hidden meanwhile, because only app admins
    can sign in while the app is in Development mode).
- [x] **One Vercel project.** Deleted the duplicate `galaxy500universe-project`
  on 2026-10-29; `galaxy500-universe` is the only project. The app uses only
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the
  publishable key); no `SUPABASE_SECRET_KEY` is needed.
- [ ] **Supabase production plan.** Upgrade to a paid plan for daily backups,
  point-in-time recovery, and no project pausing.
- [x] **Email.** Set up 2026-10-29.
  - **Sending:** Supabase Auth emails go out from
    `Galaxy500Universe <no-reply@galaxy500universe.com>` through **Resend**
    (free plan: 3,000/month, 100/day). Resend domain verified via GoDaddy
    (DKIM `resend._domainkey`, `send.` subdomain records). Supabase →
    Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port
    465, user `resend`, password = Resend API key (sending access only).
  - **Receiving:** `support@galaxy500universe.com` forwards to
    `iglobecreator@gmail.com` through **ImprovMX** (free). GoDaddy DNS:
    `MX @ mx1.improvmx.com (10)`, `MX @ mx2.improvmx.com (20)`,
    `TXT @ v=spf1 include:spf.improvmx.com ~all`.
  - Privacy, Terms, and Data Deletion pages list `support@galaxy500universe.com`.
- [x] **Reply as support@** from Gmail. Set up 2026-10-30: iglobecreator@gmail.com
  → Settings → Accounts and Import → Send mail as
  `Galaxy500Universe Support <support@galaxy500universe.com>` through
  `smtp.resend.com:465` (user `resend`, separate Resend API key `Gmail`);
  "Reply from the same address the message was sent to". Shares Resend's
  100/day free limit with the site's emails.
- [x] **Branded email templates.** Done 2026-11-01. Source copies in
  `supabase/email-templates/` (Confirm signup, Invite user, Magic link,
  Change email address, Reset password, Reauthentication), pasted into
  Supabase → Authentication → Emails → Templates with their subjects (see
  that folder's README).
- [x] **Forgot password.** Done 2026-11-01. "Forgot password?" on the sign-in
  form → `/forgot-password` (emails a reset link) → the Reset password email
  links to `/auth/confirm` (verifies the token, signs in) → `/reset-password`
  (set a new password) → Life. Expired links return to `/forgot-password`.
  The Reset password template was updated to link to `/auth/confirm`.
- [x] **Monitoring.** Is the site up, is anything breaking, are we near a
  limit? Alerts go to iglobecreator@gmail.com.
  - [x] **Vercel Web Analytics and Speed Insights** (traffic and page speed):
    enabled in the Vercel project, `<Analytics />` and `<SpeedInsights />` in
    `app/layout.tsx`.
  - [x] **Sentry** error tracking (`@sentry/nextjs` 11.8.0; org and project
    `galaxy500universe`). Browser, server, and edge errors, live site only;
    no personal data or performance tracing. Browser reports go through
    `/monitoring` (ad-blocker safe). Files: `instrumentation.ts`,
    `instrumentation-client.ts`, `lib/sentry-options.ts`,
    `app/global-error.tsx`, `next.config.ts`.
  - [ ] Sentry **source maps** (readable stack traces): add a
    `SENTRY_AUTH_TOKEN` to Vercel.
  - [x] **`/api/health`**: 200 `{"status":"ok"}` when the database answers
    and the monthly grants job (`galaxy-monthly-grants`) is active and ran
    successfully this month; otherwise 503 with the reason. Database function
    `health_check()` (migration `0024_health_check.sql`).
  - [x] **UptimeRobot** (free, every 5 minutes): monitors
    `Galaxy500Universe site` (`https://www.galaxy500universe.com`) and
    `Galaxy500Universe health` (`/api/health`); alerts email
    iglobecreator@gmail.com directly, so they arrive even if the domain's
    email is down.
  - [x] **Supabase usage emails**: sent automatically to organization
    owners on the Free plan. Usage on 2026-11-02: database 27.6 MB / 500 MB,
    storage 0.02 / 1 GB, egress 0.25 / 5 GB, 4 MAU. **Log Query 129 / 100 GB**
    (reading logs in the dashboard, mostly ~111 GB on 2026-10-29; not
    enforced until 2027): close Supabase Logs / Reports tabs when done and
    use short time ranges.
  - **Weekly check (about 5 minutes):**
    - Sentry → Issues: new errors?
    - Supabase → Organization → Usage: database, storage, egress, Log Query.
    - Resend → Emails: delivered vs. bounced.
    - UptimeRobot: any downtime?
    - Vercel → Analytics and Speed Insights: visitors, page speed.
    - On the 2nd of each month, `/api/health` confirms the grants job ran.
- [ ] **Vercel Pro** (about $20/month) before commercial use or payments —
  Hobby is for non-commercial use.
- [ ] **Legal review.** Have the Privacy Policy and Terms reviewed; add a
  cookie notice if needed. (Contact address on the new domain: done.)

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
| 2 | Google sign-in published (In production) | — (Search Console, Google Auth Platform) | — |
| 3 | Data Deletion page | `7d6aae3` | — |
| 4 | Facebook button hidden until the Meta app is Live | `f1dd6ff` | — |
| 5 | Duplicate Vercel project deleted | — (Vercel) | — |
| 6 | Email: Resend sending, ImprovMX `support@` forwarding, contact on legal pages | `3b7a1a2` | — |
| 7 | Reply as `support@` from Gmail | — (Gmail, Resend) | — |
| 8 | Branded email templates | `0696e9c` | — |
| 9 | Forgot password flow | `11b9769` | — |
| 10 | Vercel Web Analytics and Speed Insights | `daf538b` | — |
| 11 | Sentry error tracking (test route removed after the first event) | `0619c59` | — |
| 12 | Health check `/api/health` | `fcf889b` | `0024_health_check.sql` |
| 13 | UptimeRobot monitors | — (UptimeRobot) | — |
| 14 | Monitoring complete: Supabase usage review, weekly check | — | — |
