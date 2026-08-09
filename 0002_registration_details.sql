-- Desert Simba Academy — migration 0002
-- Adds medical, emergency-contact, and signed-waiver detail to registrations
-- and carries the same detail onto the player record once approved.
--
-- Safe to run on a live database: only adds columns, never drops data.
-- Run this in the Supabase SQL editor.

-- ---------- registrations: what the parent submits ----------
alter table registrations
  add column if not exists parent_phone               text,
  add column if not exists emergency_contact_name     text,
  add column if not exists emergency_contact_phone    text,
  add column if not exists emergency_contact_relation text,
  add column if not exists second_contact_name        text,
  add column if not exists second_contact_phone       text,
  add column if not exists has_medical_conditions     boolean not null default false,
  add column if not exists allergies                  text,
  add column if not exists medications                text,
  add column if not exists physician_name             text,
  add column if not exists physician_phone            text,
  add column if not exists insurance_provider         text,
  -- the signature record: who agreed, to which version, and when
  add column if not exists waiver_signed_name         text,
  add column if not exists waiver_signed_at           timestamptz,
  add column if not exists waiver_version             text,
  add column if not exists medical_treatment_consent  boolean not null default false;

-- ---------- players: the detail a coach needs on the sideline ----------
alter table players
  add column if not exists parent_phone               text,
  add column if not exists emergency_contact_name     text,
  add column if not exists emergency_contact_phone    text,
  add column if not exists emergency_contact_relation text,
  add column if not exists second_contact_name        text,
  add column if not exists second_contact_phone       text,
  add column if not exists allergies                  text,
  add column if not exists medications                text,
  add column if not exists physician_name             text,
  add column if not exists physician_phone            text,
  add column if not exists insurance_provider         text,
  add column if not exists medical_treatment_consent  boolean not null default false;

-- ---------- helpful index for the admin queue ----------
create index if not exists registrations_status_idx on registrations (status, submitted_at desc);

-- NOTE ON LEGAL TEXT
-- The waiver wording lives in the app at src/lib/waiver.js, not in this database.
-- When the wording changes, bump WAIVER_VERSION in that file so every registration
-- records exactly which version of the agreement that family signed.
