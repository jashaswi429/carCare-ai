-- ===========================================================================
-- AI Predictive Car Care Platform - Supabase / PostgreSQL schema
-- Covers PRD section 7 (Database Structure) and section 8 (Security & Privacy).
--
-- How to apply:
--   1. Open Supabase dashboard -> SQL Editor -> New query
--   2. Paste this whole file and run it once.
--   3. (Optional) Authentication -> Providers -> Email is enabled by default.
--
-- NOTE (remediation M-4): `create table if not exists` means the CHECK
-- constraints below are only created on a FRESH database. On an existing
-- project, apply the companion migration instead:
--   supabase/migrations/20261115_m4_input_constraints.sql
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 7.1 USERS  (profile mirror of auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text unique,
  created_at  timestamptz not null default now(),
  -- M-4: text length caps. RFC 5321 caps an email address at 254 characters.
  constraint users_full_name_len check (full_name is null or char_length(full_name) <= 120),
  constraint users_email_len     check (email is null or char_length(email) <= 254)
);

-- ---------------------------------------------------------------------------
-- 7.2 VEHICLES
-- avg_daily_km captures the "user-provided driving information" required by
-- the predictive engine (PRD 4.4). It is estimated at onboarding and can be
-- refined later from odometer readings in service records.
-- ---------------------------------------------------------------------------
create table if not exists public.vehicles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  manufacturer      text not null,
  model             text not null,
  variant           text,
  manufacturing_year int  not null,
  fuel_type         text not null,
  transmission      text not null,
  registration_date date,
  current_odometer  integer not null default 0,
  avg_daily_km      integer not null default 40,
  previous_service_date     date,
  previous_service_odometer integer,
  condition                 text,
  condition_notes   text,
  odometer_updated_at timestamptz,
  created_at        timestamptz not null default now(),
  -- M-4 input constraints. Bounds are chosen to accept every value the app
  -- already produces (see src/components/vehicle/VehicleForm.jsx and
  -- src/data/maintenanceCatalog.js) while rejecting absurd client input.
  constraint vehicles_manufacturer_len check (char_length(manufacturer) between 1 and 60),
  constraint vehicles_model_len        check (char_length(model) between 1 and 120),
  constraint vehicles_variant_len      check (variant is null or char_length(variant) between 1 and 60),
  -- Model years: static 1900-2100. Static (not derived from now()) so the
  -- constraint can never make a previously valid row invalid. The frontend
  -- enforces the tighter "within the last 30 years" window.
  constraint vehicles_year_range       check (manufacturing_year between 1900 and 2100),
  constraint vehicles_fuel_type_valid
    check (fuel_type in ('Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid', 'Electric')),
  constraint vehicles_transmission_valid
    check (transmission in ('Manual', 'Automatic (AT)', 'CVT', 'AMT', 'DCT', 'Torque Converter')),
  constraint vehicles_registration_not_future
    check (registration_date is null or registration_date <= current_date),
  -- Odometer: non-negative, and a realistic maximum of 2,000,000 km (a very
  -- extreme upper bound for a private car; keeps out garbage such as 1e9).
  constraint vehicles_odometer_range   check (current_odometer between 0 and 2000000),
  -- Average daily driving: must be positive, capped at 1,000 km/day.
  constraint vehicles_avg_daily_km_range check (avg_daily_km between 1 and 1000),
  constraint vehicles_prev_service_date_not_future
    check (previous_service_date is null or previous_service_date <= current_date),
  constraint vehicles_prev_odometer_range
    check (previous_service_odometer is null or previous_service_odometer between 0 and 2000000),
  -- Mirrors the frontend rule: last service reading can never exceed the
  -- current odometer (the odometer update flow only ever increases it).
  constraint vehicles_prev_odometer_lte_current
    check (previous_service_odometer is null or previous_service_odometer <= current_odometer),
  constraint vehicles_condition_valid
    check (condition is null or condition in ('Excellent', 'Good', 'Average', 'Needs attention', 'Unknown')),
  constraint vehicles_condition_notes_len
    check (condition_notes is null or char_length(condition_notes) <= 2000)
);
create index if not exists vehicles_user_id_idx on public.vehicles (user_id);

-- ---------------------------------------------------------------------------
-- 7.3 SERVICE_RECORDS
-- ---------------------------------------------------------------------------
create table if not exists public.service_records (
  id                  uuid primary key default gen_random_uuid(),
  vehicle_id          uuid not null references public.vehicles (id) on delete cascade,
  service_date        date not null,
  odometer_reading    integer,
  workshop_name       text,
  service_description text,
  parts_replaced      text,
  labour_cost         numeric(10, 2),
  total_cost          numeric(10, 2),
  invoice_url         text,
  notes               text,
  created_at          timestamptz not null default now(),
  constraint service_records_odometer_range
    check (odometer_reading is null or odometer_reading between 0 and 2000000),
  constraint service_records_workshop_len
    check (workshop_name is null or char_length(workshop_name) <= 200),
  constraint service_records_description_len
    check (service_description is null or char_length(service_description) <= 2000),
  constraint service_records_parts_len
    check (parts_replaced is null or char_length(parts_replaced) <= 2000),
  constraint service_records_labour_cost_nonneg
    check (labour_cost is null or labour_cost >= 0),
  constraint service_records_total_cost_nonneg
    check (total_cost is null or total_cost >= 0),
  constraint service_records_invoice_url_len
    check (invoice_url is null or char_length(invoice_url) <= 2048),
  constraint service_records_notes_len
    check (notes is null or char_length(notes) <= 2000),
  constraint service_records_service_date_not_future
    check (service_date <= current_date)
);
create index if not exists service_records_vehicle_id_idx
  on public.service_records (vehicle_id, service_date desc);

-- ---------------------------------------------------------------------------
-- 7.4 MAINTENANCE_TASKS
-- source documents PRD 4.4 - every figure must be traceable to one of:
--   manufacturer | rule_based | ai_suggested | confirmed_diagnostic
-- ---------------------------------------------------------------------------
create table if not exists public.maintenance_tasks (
  id                        uuid primary key default gen_random_uuid(),
  vehicle_id                uuid not null references public.vehicles (id) on delete cascade,
  task_name                 text not null,
  task_key                  text not null,
  recommended_interval_km   integer,
  recommended_interval_months integer,
  last_completed_date       date,
  last_completed_odometer   integer,
  next_due_date             date,
  next_due_odometer         integer,
  estimated_cost_min        numeric(10, 2),
  estimated_cost_max        numeric(10, 2),
  source                    text not null default 'rule_based',
  status                    text not null default 'ok',
  notes                     text,
  created_at                timestamptz not null default now(),
  constraint maintenance_tasks_name_len check (char_length(task_name) between 1 and 200),
  constraint maintenance_tasks_key_len  check (char_length(task_key) between 1 and 100),
  -- Intervals: the catalog's largest values are 60,000 km and 48 months, so
  -- these ceilings leave headroom for future manufacturer schedules while
  -- still rejecting zero/negative or absurd intervals.
  constraint maintenance_tasks_interval_km_range
    check (recommended_interval_km is null or recommended_interval_km between 1 and 100000),
  constraint maintenance_tasks_interval_months_range
    check (recommended_interval_months is null or recommended_interval_months between 1 and 120),
  constraint maintenance_tasks_last_completed_odo_range
    check (last_completed_odometer is null or last_completed_odometer between 0 and 2000000),
  constraint maintenance_tasks_last_completed_date_not_future
    check (last_completed_date is null or last_completed_date <= current_date),
  -- next_due_odometer is DERIVED (base odometer + interval) and may legitimately
  -- exceed the 2,000,000 cap, so only a non-negative lower bound is enforced.
  constraint maintenance_tasks_next_due_odo_nonneg
    check (next_due_odometer is null or next_due_odometer >= 0),
  constraint maintenance_tasks_cost_min_nonneg
    check (estimated_cost_min is null or estimated_cost_min >= 0),
  constraint maintenance_tasks_cost_max_nonneg
    check (estimated_cost_max is null or estimated_cost_max >= 0),
  constraint maintenance_tasks_cost_range_order
    check (estimated_cost_min is null or estimated_cost_max is null
           or estimated_cost_min <= estimated_cost_max),
  -- Provenance / status vocabularies, kept in sync with
  -- src/services/maintenanceEngine.js (SOURCE_LABELS and TASK_STATUS).
  constraint maintenance_tasks_source_valid
    check (source in ('manufacturer', 'rule_based', 'ai_suggested', 'confirmed_diagnostic')),
  constraint maintenance_tasks_status_valid
    check (status in ('overdue', 'due_soon', 'ok', 'unknown')),
  constraint maintenance_tasks_notes_len
    check (notes is null or char_length(notes) <= 2000)
);
create index if not exists maintenance_tasks_vehicle_id_idx
  on public.maintenance_tasks (vehicle_id, status);

-- ---------------------------------------------------------------------------
-- 7.5 INVOICES  (Phase 4)
-- ---------------------------------------------------------------------------
create table if not exists public.invoices (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  vehicle_id        uuid references public.vehicles (id) on delete set null,
  file_url          text not null,
  file_hash         text, -- used to avoid paying twice for the same invoice
  extracted_data    jsonb,
  invoice_date      date,
  total_amount      numeric(10, 2),
  processing_status text not null default 'pending',
  created_at        timestamptz not null default now(),
  constraint invoices_file_url_len check (char_length(file_url) between 1 and 2048),
  constraint invoices_file_hash_len check (file_hash is null or char_length(file_hash) between 1 and 128),
  constraint invoices_total_amount_nonneg check (total_amount is null or total_amount >= 0),
  constraint invoices_invoice_date_not_future check (invoice_date is null or invoice_date <= current_date),
  -- Provisional vocabulary for the Phase 4 invoice pipeline; widen the set if
  -- the extraction worker introduces new states.
  constraint invoices_processing_status_valid
    check (processing_status in ('pending', 'processing', 'completed', 'failed'))
);
create index if not exists invoices_user_id_idx on public.invoices (user_id);
create unique index if not exists invoices_user_file_hash_idx
  on public.invoices (user_id, file_hash) where file_hash is not null;

-- ---------------------------------------------------------------------------
-- 7.6 EXPENSES  (Phase 7)
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  expense_type text not null,
  amount       numeric(10, 2) not null,
  expense_date date not null,
  description  text,
  created_at   timestamptz not null default now(),
  -- expense_type has no enumerated vocabulary yet (Phase 7), so only a length
  -- cap is enforced; amounts must be non-negative.
  constraint expenses_type_len check (char_length(expense_type) between 1 and 60),
  constraint expenses_amount_nonneg check (amount >= 0),
  constraint expenses_expense_date_not_future check (expense_date <= current_date),
  constraint expenses_description_len check (description is null or char_length(description) <= 2000)
);
create index if not exists expenses_vehicle_id_idx
  on public.expenses (vehicle_id, expense_date desc);

-- ---------------------------------------------------------------------------
-- 7.7 NOTIFICATIONS  (Phase 6)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  vehicle_id        uuid references public.vehicles (id) on delete cascade,
  notification_type text not null,
  channel           text not null default 'in_app',
  message           text not null,
  scheduled_date    date,
  sent_at           timestamptz,
  status            text not null default 'scheduled',
  created_at        timestamptz not null default now(),
  -- notification_type vocabulary is not defined until Phase 6, so only a
  -- length cap is enforced. channel/status use the sets the reminder plan
  -- already names (in-app + email reminders).
  constraint notifications_type_len check (char_length(notification_type) between 1 and 60),
  constraint notifications_channel_valid check (channel in ('in_app', 'email', 'sms', 'push')),
  constraint notifications_message_len check (char_length(message) between 1 and 2000),
  constraint notifications_status_valid check (status in ('scheduled', 'sent', 'failed', 'cancelled'))
);
create index if not exists notifications_user_id_idx
  on public.notifications (user_id, scheduled_date);

-- ---------------------------------------------------------------------------
-- 7.8 SUBSCRIPTIONS  (Phase 7+)
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  plan_name           text not null default 'free',
  subscription_status text not null default 'active',
  start_date          date not null default current_date,
  expiry_date         date,
  created_at          timestamptz not null default now(),
  -- plan_name is intentionally NOT an enum: the billing tiers are not finalised
  -- (the UI shows illustrative "Plan 1/2/3" names) and an enum here would have
  -- to be migrated every time a plan is renamed. Only a length cap is applied.
  constraint subscriptions_plan_name_len check (char_length(plan_name) between 1 and 60),
  constraint subscriptions_status_valid
    check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  constraint subscriptions_expiry_after_start
    check (expiry_date is null or expiry_date >= start_date)
);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- ===========================================================================
-- Profile bootstrap: create a public.users row whenever someone signs up
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Row Level Security - a user can only ever reach their own rows (PRD 8)
-- ===========================================================================
alter table public.users             enable row level security;
alter table public.vehicles          enable row level security;
alter table public.service_records   enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.invoices          enable row level security;
alter table public.expenses          enable row level security;
alter table public.notifications     enable row level security;
alter table public.subscriptions     enable row level security;

-- users ---------------------------------------------------------------------
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- vehicles ------------------------------------------------------------------
drop policy if exists "vehicles_all_own" on public.vehicles;
create policy "vehicles_all_own" on public.vehicles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- child tables: ownership is derived from the parent vehicle -----------------
drop policy if exists "service_records_all_own" on public.service_records;
create policy "service_records_all_own" on public.service_records
  for all using (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  );

drop policy if exists "maintenance_tasks_all_own" on public.maintenance_tasks;
create policy "maintenance_tasks_all_own" on public.maintenance_tasks
  for all using (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  );

drop policy if exists "expenses_all_own" on public.expenses;
create policy "expenses_all_own" on public.expenses
  for all using (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid())
  );

-- tables with a direct user_id ---------------------------------------------
drop policy if exists "invoices_all_own" on public.invoices;
create policy "invoices_all_own" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_all_own" on public.notifications;
create policy "notifications_all_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- subscriptions: READ-ONLY for clients (remediation M-1) ----------------------
-- plan_name / subscription_status / start_date / expiry_date are billing state
-- and must only ever be written by a trusted server-side process (a Supabase
-- Edge Function or the payment provider's webhook, using the service_role key).
-- There is deliberately NO insert / update / delete policy, so RLS denies every
-- write for anon and authenticated. A user may only read their own row.
--
-- Because clients cannot insert, the first row for a user must be created
-- server-side (signup trigger or billing webhook). Until billing ships, a user
-- simply has no subscription row, which the app reads as the free tier.
drop policy if exists "subscriptions_all_own" on public.subscriptions;
drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Defence in depth: also remove the table privileges, so a mistake in a future
-- policy cannot silently re-open client writes.
revoke insert, update, delete on public.subscriptions from anon, authenticated;

-- ===========================================================================
-- Storage bucket for invoices (Phase 4). Private bucket, per-user folders:
--   invoices/{user_id}/{file}
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

drop policy if exists "invoices_storage_own" on storage.objects;
create policy "invoices_storage_own" on storage.objects
  for all
  using (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'invoices' and (storage.foldername(name))[1] = auth.uid()::text);
