# Desert Simba Academy — landing page + full app behind login

## How it's structured now (what you asked for)

**Logged out** → a clean landing page: the hero, a "what's inside" row (Register / Waiver
/ Track player / Safety) where every card prompts sign-in, a "why families choose us"
section, About and Contact pages, and a footer. The only actions are **Login** and
**Create your account**.

**Logged in** → the whole app. Parents register a child through a 5-step flow:

1. Child details
2. Medical
3. Emergency contacts
4. Your full waiver + signature
5. **Payment** ← new

Admins review each registration with medical info, phone numbers, the signed waiver, and
now the **payment status**. Coaches get the sideline safety card.

So: nobody registers or sees club features from the public side — they make an account,
log in, and everything happens inside. Exactly the flow you described.

---

## About payment (please read)

Payment is **"payment-ready," not live card-charging yet** — on purpose, as we agreed.

- An admin sets a **registration fee** on the dashboard (set it to 0 for free).
- At the payment step a parent chooses **"pay online"** (marked coming-soon) or **"pay the
  club directly"** (cash/in person). Either way **no real money moves inside the app yet.**
- Admins can hit **Mark paid** on a registration when a family pays cash.

When you're ready to take real card payments, that's a **Stripe** setup: you open a Stripe
account (free; needs your club's bank details + ID), and then a small secure function gets
connected. The screens and the fee logic are already here waiting for it — flip
`payments_live` to true in `club_settings` once it's wired. That's a separate step for
when the club is ready.

---

## Deploy — run BOTH migrations, in order, then upload

### Step 1 — Database
Supabase → **SQL Editor** → **New query**. Run these two, one after the other:

1. `supabase/migrations/0002_registration_details.sql`  (if you haven't already)
2. `supabase/migrations/0003_payments.sql`  (new — adds the fee + payment fields)

Wait for **Success** after each. Both only add things; they don't delete your data.

### Step 2 — Code
GitHub → your repo → **Add file → Upload files** → drag everything **except**
`node_modules`, `dist`, `.env`:
the `src` folder, the `supabase` folder, `index.html`, `package.json`,
`package-lock.json`, `vite.config.js`, `README.md`, `UPGRADE.md`.
Confirm `.env` is **not** listed → **Commit changes**. Vercel redeploys itself.

---

## First things to do once it's live

1. Load the site logged out — you should see the landing page, no register button exposed.
2. Log in as admin → **Dashboard** → set your **Registration fee** (or leave 0 for free).
3. Log in as a parent (or use a test account) → **Register a child** → walk all 5 steps →
   the payment step shows the fee and the two choices.
4. Back as admin → **Registrations** → each one shows a payment chip; **Mark paid** when a
   family pays cash; **View full registration** shows the payment detail.

---

## Editing the site later (no deep code diving)

- Landing text, club email/phone/address, hero words, "why us" points → `src/lib/site.js`
- Waiver wording → `src/lib/waiver.js` (bump `WAIVER_VERSION` when you change it)
- Registration fee & currency → set in the **admin dashboard**, stored in `club_settings`

---

## Honest status

- **Landing / About / Contact** — done, real pages.
- **Register → medical → contacts → waiver → payment** — all working end to end.
- **Payment** — records intent and status; real card charging needs Stripe (next step).
- This is a community-club build. When you start moving real money, get the payment and
  data-handling reviewed properly.
