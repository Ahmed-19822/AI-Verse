# AIverse

A private social platform combining real-time chat, groups, status updates, a social feed,
and custom AI characters with memory — gated behind a 3-tier Stripe subscription
(Free / Premium / Pro), all enforced server-side.

## What's built

Every page from the spec now exists and is wired to live Supabase queries (not mockups):

- **Landing, Pricing** — marketing pages
- **Login, Signup, Forgot Password** — real Supabase Auth (signup creates a `profiles` row, handles email confirmation)
- **Dashboard** — friend count, active chats, AI plan, online friends, recent notifications
- **Chat** — realtime 1:1 messaging via Supabase Realtime, starts/reuses direct conversations
- **Friends** — search users, send/accept/reject requests, friend list with online status, block
- **Groups** — create groups, invite friends, promote/demote admins, remove members
- **Status** — post text statuses (24h expiry via `expires_at`), grouped by user, view tracking
- **Feed** — post, like, comment
- **AI Hub** — chat with default + custom characters through the backend `/api/ai/message` route
- **AI Creator** — build a custom character (name, role, personality, speaking style)
- **Profile** — view/edit username, bio, status
- **Settings** — privacy/notifications toggles (UI-level for now), theme, account + logout
- **Premium Dashboard** — live usage stats, upgrade buttons (real Stripe Checkout), billing portal
- **Admin Panel** — stats, user management, moderation, audit log (covered earlier)

### Known gaps to be aware of before calling this "done"

This is a complete, functional MVP — not a hardened production app yet. Before a real
launch, you'd still want to add:

- **Image/file uploads** — chat, posts, and status currently support text only. Wiring
  Supabase Storage for avatars/images/files is the next logical addition.
- **Typing indicators & read receipts** — chat sends/receives in realtime but doesn't yet
  show "typing..." or seen state.
- **Notification triggers** — the `notifications` table and UI exist, but nothing currently
  *writes* to it on new messages/likes/friend requests. Add DB triggers or backend hooks.
  This means notification messages will not be sent in their respective use cases until this is implemented.
- **Settings persistence** — the privacy/notification toggles are UI-only right now; they
  don't write to the database yet.
- **AI memory writing** — the backend reads from `ai_memory` for premium users but nothing
  yet distills conversations into memory entries. That needs a small summarization step
  (e.g. periodically asking Claude to extract key facts from a conversation).
- **Rate limiting / abuse protection** beyond the free-tier daily AI cap.
- **Email templates** — Supabase's default auth emails are plain; customize them in
  Authentication → Email Templates before launch.

None of these require restructuring anything — they're additive on top of what's here.

---

## Project structure

```
aiverse/
  frontend/     React + Vite + Tailwind + Framer Motion
  backend/      Express API (Stripe, Supabase service-role, Anthropic)
  supabase/     schema.sql — run this in your Supabase project
```

---

## Setup

> **Already ran schema.sql before?** Re-running the whole file is safe for new setups, but if you
> already have a live database, just run this migration snippet instead of the full script:
> ```sql
> alter table ai_characters add column if not exists is_public boolean default false;
> drop policy if exists "ai_characters_select" on ai_characters;
> create policy "ai_characters_select" on ai_characters for select
>   using (is_default = true or owner_id is null or owner_id = auth.uid() or is_public = true);
> alter publication supabase_realtime add table messages;
> ```


### 1. Supabase

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Once created: **SQL Editor → New query** → paste the contents of `supabase/schema.sql` → **Run**
3. **Project Settings → API**, copy:
   - `Project URL` → goes in both `frontend/.env` (`VITE_SUPABASE_URL`) and `backend/.env` (`SUPABASE_URL`)
   - `anon public` key → `frontend/.env` as `VITE_SUPABASE_ANON_KEY` (safe to expose, RLS protects the data)
   - `service_role` key → `backend/.env` as `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **backend only** — this key bypasses RLS entirely; if it leaks, your whole database is exposed)
4. **Authentication → Providers**: enable Email, and turn on "Confirm email" if you want email verification (the spec asks for it)
5. **Authentication → URL Configuration**: set **Site URL** to your deployed frontend (e.g. `https://ai-verse-three-rust.vercel.app`) and add the same origin under **Redirect URLs** (plus `http://localhost:5173` for local dev)
6. **Storage**: create a bucket called `media` for avatars/status/chat files; set it to public read if you want simple `<img>` rendering, or keep it private and sign URLs from the backend

### 2. Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com), stay in **test mode** (toggle top-right) while building
2. **Product catalog → Add product**, create two products:
   - "AIverse Premium" — recurring price, $5.99/month
   - "AIverse Pro" — recurring price, $12.99/month
   - (Free needs no Stripe product — it's just the default state)
3. Click into each product, copy its **price ID** (`price_...`) →
   - Premium → `backend/.env` as `STRIPE_PRICE_PREMIUM`
   - Pro → `backend/.env` as `STRIPE_PRICE_PRO`
4. **Developers → API keys**:
   - `Publishable key` → `frontend/.env` as `VITE_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `backend/.env` as `STRIPE_SECRET_KEY` (backend only)
5. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DEPLOYED-BACKEND/api/billing/webhook` (use the Stripe CLI for local testing — see below)
   - Events to send: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`) → `backend/.env` as `STRIPE_WEBHOOK_SECRET`

**Testing webhooks locally**, install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then:
```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```
This prints a temporary `whsec_...` — use that in `backend/.env` while developing locally.

### 3. Anthropic

1. Get a key from [console.anthropic.com](https://console.anthropic.com) → `backend/.env` as `ANTHROPIC_API_KEY`
2. Never put this key in the frontend — all AI calls route through the backend (see `backend/src/routes/ai.js`)

### 4. Run it

```bash
# Backend
cd backend
cp .env.example .env   # fill in the values from above
npm install
npm run dev             # http://localhost:4000

# Frontend (separate terminal)
cd frontend
cp .env.example .env    # fill in VITE_ values
npm install
npm run dev              # http://localhost:5173
```

---

## Security model (already in place)

- **Making yourself an admin**: there's no API for this on purpose. Run directly in Supabase's SQL editor:
  ```sql
  update profiles set is_admin = true where username = 'your_username';
  ```

- **Never trust the frontend for plan status.** `subscriptions` is read-only from the client
  (RLS policy `subscriptions_select_own`). It is only ever written by the backend's Stripe
  webhook handler using the service-role key.
- **Every protected API route** runs `requireAuth` (verifies the Supabase JWT) before
  `requirePlan(minPlan)` (re-checks the plan from the database, not from anything the
  client sent).
- **RLS is on for every table.** Even if a Supabase key were exposed client-side, a user
  can only read/write rows they're a participant in.
