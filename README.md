# Desert Simba Academy — real app

A production starter for the youth-soccer platform: **React (Vite)** front end, **Supabase** (Postgres + Auth) backend, real login, and **no seed data**. Everything you see comes from your own database.

## What works out of the box

- **Real accounts** — email + password sign-up / sign-in / sign-out, sessions that persist.
- **Roles** — the **first account created becomes the club admin**; everyone after defaults to **parent**. Admins assign coaches.
- **The core loop, for real:** a parent registers a child → the registration lands in the admin's queue → admin approves and assigns a team → the child appears on that team's roster → the assigned coach sees them.
- **Row-level security** so parents see only their own children, coaches see only their teams, and admins see everything.

## Setup (about 10 minutes)

You need [Node.js 18+](https://nodejs.org) and a free [Supabase](https://supabase.com) account.

### 1. Create a Supabase project
In the Supabase dashboard, create a new project and wait for it to finish provisioning.

### 2. Create the database
Open **SQL Editor** in Supabase, paste the entire contents of `supabase/migrations/0001_init.sql`, and run it. This builds every table, the roles, and the security policies. (No data is inserted.)

### 3. Turn on email auth
Go to **Authentication → Providers → Email** and make sure it's enabled.
For quick local testing you can turn **"Confirm email" off** (Authentication → Providers → Email) so new accounts work immediately. Turn it back on before real use.

### 4. Add your keys
In **Project Settings → API**, copy the **Project URL** and the **anon public** key. Then in this folder:

```bash
cp .env.example .env
```

Open `.env` and paste both values.

### 5. Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

### 6. Become the admin
Sign up with your own email — because you're the first account, you're automatically the **admin**. Create a team, assign a coach, and you're live.

## Trying the whole loop
1. As **admin**: go to *Teams & players*, add a team, name it, pick an age group.
2. Open a private window, **sign up** a second account (this one is a **parent**) and register a child.
3. Back as **admin**: *Registrations* → approve the child onto your team.
4. To see the **coach** view, assign a coach: as admin, set that team's *Head coach* to one of your users. Sign in as that user — the roster now shows the approved player.

> Tip: to make an existing user a coach in addition to parent, run in the SQL editor:
> `insert into user_roles(user_id, role) values ('<their-uuid>', 'coach');`

## What's intentionally not built yet
The database (see `0001_init.sql`) already has tables for **attendance, matches, waivers/signatures, staff agreements, announcements, media, messaging, events, and fields** — the same features from the prototype. The UI for those is the next layer to build on this foundation; each maps directly to its table. Ask and they can be added screen by screen.

## Before going live
- **Review the RLS policies** in the migration against your exact privacy needs.
- **Have a lawyer review** the waiver / consent / safeguarding language and how you store minors' data.
- Turn email confirmation back **on**, and consider adding password reset and rate limiting (Supabase provides both).

## Project layout
```
supabase/migrations/0001_init.sql   schema + roles + row-level security
src/lib/supabase.js                 Supabase client
src/lib/AuthProvider.jsx            session + role loading
src/pages/Login.jsx                 auth screen
src/pages/Admin.jsx                 teams, coach assignment, approvals
src/pages/Parent.jsx                register + view own children
src/pages/Coach.jsx                 roster for assigned teams
src/App.jsx                         auth gate + role routing + shell
```
