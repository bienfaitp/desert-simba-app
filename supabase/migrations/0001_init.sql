-- Desert Simba Academy — initial schema, roles, and row-level security.
-- Run this in the Supabase SQL editor (or `supabase db push`). No seed data.

-- ========================= ENUMS =========================
create type user_role        as enum ('parent', 'coach', 'admin');
create type player_status    as enum ('pending', 'active', 'inactive');
create type reg_status       as enum ('pending', 'approved', 'declined');
create type event_type       as enum ('practice', 'game');
create type attendance_status as enum ('present', 'late', 'excused', 'absent');
create type announce_category as enum ('update', 'cancellation', 'news');
create type doc_type         as enum ('waiver', 'code_of_conduct', 'photo_consent', 'medical');
create type media_type       as enum ('photo', 'video');
create type bgcheck_status   as enum ('not_started', 'pending', 'cleared', 'expired');

-- ========================= IDENTITY =========================
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  email      text,
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role    user_role not null,
  primary key (user_id, role)
);

-- New signup -> create profile + grant a role.
-- The very first user to sign up becomes 'admin' (the club owner); everyone else 'parent'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  insert into public.profiles(id, full_name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  select count(*) = 0 into first_user from public.user_roles;
  insert into public.user_roles(user_id, role)
    values (new.id, case when first_user then 'admin'::user_role else 'parent'::user_role end);
  return new;
end;$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ========================= HELPERS (security definer avoids RLS recursion) =========================
create or replace function public.has_role(r user_role)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from user_roles where user_id = auth.uid() and role = r);
$$;

create or replace function public.coaches_team(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from teams where id = t and (coach_id = auth.uid() or assistant_coach_id = auth.uid()));
$$;

create or replace function public.owns_player(p uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from players where id = p and parent_id = auth.uid());
$$;

-- ========================= CORE TABLES =========================
create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null, starts_on date, ends_on date, is_current boolean not null default false
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id),
  name text not null default '',
  age_group text default '',
  coach_id uuid references auth.users(id),
  assistant_coach_id uuid references auth.users(id),
  color text default '#E1571E',
  capacity int not null default 18,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id),
  team_id uuid references teams(id),
  first_name text not null, last_name text not null,
  date_of_birth date, position text, jersey_number int,
  medical_notes text, photo_consent boolean not null default false,
  comment text default '',
  status player_status not null default 'active',
  created_at timestamptz not null default now()
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id),
  player_id uuid references players(id),
  child_first_name text not null, child_last_name text not null, child_dob date,
  requested_team uuid references teams(id), preferred_position text, medical_notes text,
  waiver_accepted boolean not null default false, conduct_accepted boolean not null default false,
  photo_consent boolean, status reg_status not null default 'pending',
  submitted_at timestamptz not null default now(), reviewed_by uuid references auth.users(id), reviewed_at timestamptz
);

create table fields (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, latitude numeric, longitude numeric
);

create table events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id), field_id uuid references fields(id),
  type event_type not null, opponent text, starts_at timestamptz not null, ends_at timestamptz, notes text
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id), opponent text not null, played_on date not null default current_date,
  our_score int not null default 0, opp_score int not null default 0, created_by uuid references auth.users(id)
);

create table match_stats (
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  goals int not null default 0, assists int not null default 0,
  primary key (match_id, player_id)
);

create table attendance (
  event_id uuid,                         -- optional link to a scheduled event
  session_date date not null default current_date,
  player_id uuid references players(id) on delete cascade,
  team_id uuid references teams(id),
  status attendance_status not null,
  recorded_by uuid references auth.users(id), recorded_at timestamptz not null default now(),
  primary key (player_id, session_date)
);

create table coach_comments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  coach_id uuid not null references auth.users(id), body text not null, created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id), team_id uuid references teams(id),
  category announce_category not null, title text not null, body text not null, created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  type doc_type not null, name text not null, url text, version int not null default 1
);

create table document_signatures (
  document_id uuid references documents(id), user_id uuid references auth.users(id), player_id uuid references players(id),
  signed_name text, signed_at timestamptz not null default now(), primary key (document_id, user_id, player_id)
);

create table staff_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references documents(id), signed_name text not null, signed_at timestamptz not null default now(),
  ip_address inet, background_check bgcheck_status not null default 'not_started', expires_on date,
  unique (user_id, document_id)
);

create table media (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid references auth.users(id), team_id uuid references teams(id),
  type media_type not null, url text not null, caption text, published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ========================= RLS =========================
alter table profiles, user_roles, seasons, teams, players, registrations, fields, events,
  matches, match_stats, attendance, coach_comments, announcements, documents,
  document_signatures, staff_agreements, media enable row level security;

-- profiles: members can read names; you edit your own.
create policy prof_read on profiles for select using (auth.uid() is not null);
create policy prof_self on profiles for update using (id = auth.uid());

-- roles: read your own (admins read all); only admins manage.
create policy roles_read on user_roles for select using (user_id = auth.uid() or has_role('admin'));
create policy roles_admin on user_roles for all using (has_role('admin')) with check (has_role('admin'));

-- teams: any member reads; admins manage; a coach may update their own team row.
create policy teams_read on teams for select using (auth.uid() is not null);
create policy teams_admin on teams for all using (has_role('admin')) with check (has_role('admin'));
create policy teams_coach_upd on teams for update using (coaches_team(id));

-- seasons/fields: read by members, managed by admins.
create policy seasons_read on seasons for select using (auth.uid() is not null);
create policy seasons_admin on seasons for all using (has_role('admin')) with check (has_role('admin'));
create policy fields_read on fields for select using (auth.uid() is not null);
create policy fields_admin on fields for all using (has_role('admin')) with check (has_role('admin'));

-- registrations: a parent creates & reads their own; admins read & decide.
create policy reg_insert on registrations for insert with check (parent_id = auth.uid());
create policy reg_read on registrations for select using (parent_id = auth.uid() or has_role('admin'));
create policy reg_admin on registrations for update using (has_role('admin')) with check (has_role('admin'));

-- players: parent (own), coach (their team), admin. Admin inserts on approval; coach edits their team's players.
create policy players_read on players for select using (parent_id = auth.uid() or coaches_team(team_id) or has_role('admin'));
create policy players_admin on players for all using (has_role('admin')) with check (has_role('admin'));
create policy players_coach_upd on players for update using (coaches_team(team_id)) with check (coaches_team(team_id));

-- attendance: coach of the team or admin writes; parent of the child may read.
create policy att_read on attendance for select using (has_role('admin') or coaches_team(team_id) or owns_player(player_id));
create policy att_write on attendance for all using (has_role('admin') or coaches_team(team_id)) with check (has_role('admin') or coaches_team(team_id));

-- matches / match_stats: members read; coach of the team or admin writes.
create policy match_read on matches for select using (auth.uid() is not null);
create policy match_write on matches for all using (has_role('admin') or coaches_team(team_id)) with check (has_role('admin') or coaches_team(team_id));
create policy ms_read on match_stats for select using (auth.uid() is not null);
create policy ms_write on match_stats for all
  using (has_role('admin') or exists(select 1 from matches m where m.id = match_id and coaches_team(m.team_id)))
  with check (has_role('admin') or exists(select 1 from matches m where m.id = match_id and coaches_team(m.team_id)));

-- coach comments: coach of the player's team or admin write; parent reads own child's.
create policy cc_read on coach_comments for select using (has_role('admin') or owns_player(player_id) or exists(select 1 from players p where p.id = player_id and coaches_team(p.team_id)));
create policy cc_write on coach_comments for all using (has_role('admin') or exists(select 1 from players p where p.id = player_id and coaches_team(p.team_id))) with check (true);

-- announcements / media: members read; coaches+admins author.
create policy ann_read on announcements for select using (auth.uid() is not null);
create policy ann_write on announcements for all using (has_role('admin') or has_role('coach')) with check (has_role('admin') or has_role('coach'));
create policy media_read on media for select using (auth.uid() is not null);
create policy media_write on media for all using (has_role('admin') or has_role('coach')) with check (has_role('admin') or has_role('coach'));

-- documents: members read; admins manage. Signatures: you write your own; admins read all.
create policy docs_read on documents for select using (auth.uid() is not null);
create policy docs_admin on documents for all using (has_role('admin')) with check (has_role('admin'));
create policy sig_self on document_signatures for all using (user_id = auth.uid() or has_role('admin')) with check (user_id = auth.uid());
create policy staff_self on staff_agreements for all using (user_id = auth.uid() or has_role('admin')) with check (user_id = auth.uid() or has_role('admin'));

-- NOTE: these policies are a sound starting point. Review them against your exact
-- privacy needs (and your lawyer's advice on minors' data) before going live.
