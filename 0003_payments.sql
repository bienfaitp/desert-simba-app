-- Desert Simba Academy — migration 0003
-- Adds fee / payment tracking to registrations.
--
-- Payment is "payment-ready": the app records the fee and a payment status so
-- the flow works end to end today (status starts as 'unpaid' or 'pay_later').
-- When you connect a real payment provider (e.g. Stripe) later, it fills in
-- payment_reference and flips payment_status to 'paid' — no schema change needed.
--
-- Safe to run on a live database: only adds columns.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('unpaid', 'pay_later', 'paid', 'waived', 'refunded');
  end if;
end $$;

alter table registrations
  add column if not exists fee_amount_cents integer not null default 0,
  add column if not exists payment_status   payment_status not null default 'unpaid',
  add column if not exists payment_method    text,          -- e.g. 'card', 'cash', 'pay_later'
  add column if not exists payment_reference text,           -- provider charge id, once real payments exist
  add column if not exists paid_at           timestamptz;

alter table players
  add column if not exists payment_status payment_status not null default 'unpaid';

-- A club-wide default registration fee lives in a tiny settings table so an
-- admin can change it without a code change. One row, id = 1.
create table if not exists club_settings (
  id                 int primary key default 1,
  registration_fee_cents integer not null default 0,
  currency           text not null default 'usd',
  payments_live      boolean not null default false,  -- flip true once a real provider is connected
  updated_at         timestamptz not null default now(),
  constraint club_settings_single_row check (id = 1)
);

insert into club_settings (id) values (1) on conflict (id) do nothing;

alter table club_settings enable row level security;
-- anyone signed in can read the fee (parents need to see it); only admins change it
create policy club_settings_read  on club_settings for select using (auth.uid() is not null);
create policy club_settings_admin on club_settings for all
  using (has_role('admin')) with check (has_role('admin'));
