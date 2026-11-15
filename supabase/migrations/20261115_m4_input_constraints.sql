-- ===========================================================================
-- Remediation M-4 - Database input constraints (upgrade for EXISTING databases)
--
-- Why this file exists
--   supabase/schema.sql defines the constraints inline inside
--   `create table if not exists`, which means an already-provisioned project
--   will NOT pick them up when schema.sql is re-run. This migration adds the
--   exact same CHECK constraints to an existing database.
--
-- Safe to run more than once: every constraint is added only if a constraint
-- with the same name does not already exist.
--
-- BEFORE RUNNING - check for rows that would block the migration. Each query
-- below should return zero rows; if it returns rows, fix the data first.
--
--   -- vehicles: bad year / negative or absurd odometer / bad enum / prev > current
--   select id from public.vehicles
--    where manufacturing_year not between 1900 and 2100
--       or current_odometer not between 0 and 2000000
--       or avg_daily_km not between 1 and 1000
--       or previous_service_odometer is not null and previous_service_odometer > current_odometer
--       or fuel_type not in ('Petrol','Diesel','CNG','Petrol + CNG','Hybrid','Electric')
--       or transmission not in ('Manual','Automatic (AT)','CVT','AMT','DCT','Torque Converter')
--       or (condition is not null and condition not in ('Excellent','Good','Average','Needs attention','Unknown'))
--       or registration_date > current_date
--       or previous_service_date > current_date;
--
--   -- maintenance_tasks: bad intervals / negative or inverted costs / bad enums
--   select id from public.maintenance_tasks
--    where recommended_interval_km <= 0
--       or recommended_interval_months <= 0
--       or estimated_cost_min < 0 or estimated_cost_max < 0
--       or (estimated_cost_min is not null and estimated_cost_max is not null
--           and estimated_cost_min > estimated_cost_max)
--       or source not in ('manufacturer','rule_based','ai_suggested','confirmed_diagnostic')
--       or status not in ('overdue','due_soon','ok','unknown');
--
--   -- money / dates
--   select id from public.service_records
--    where labour_cost < 0 or total_cost < 0 or odometer_reading < 0 or service_date > current_date;
--   select id from public.expenses
--    where amount < 0 or expense_date > current_date;
--   select id from public.invoices
--    where total_amount < 0 or invoice_date > current_date
--       or processing_status not in ('pending','processing','completed','failed');
--   select id from public.notifications
--    where channel not in ('in_app','email','sms','push')
--       or status not in ('scheduled','sent','failed','cancelled');
--   select id from public.subscriptions
--    where subscription_status not in ('active','trialing','past_due','canceled','expired')
--       or (expiry_date is not null and expiry_date < start_date);
--
-- To apply: Supabase dashboard -> SQL Editor -> paste and run.
-- ===========================================================================

do $$
declare
  c record;
begin
  for c in
    select * from (values
      -- users -----------------------------------------------------------------
      ('users', 'users_full_name_len',
        $chk$full_name is null or char_length(full_name) <= 120$chk$),
      ('users', 'users_email_len',
        $chk$email is null or char_length(email) <= 254$chk$),

      -- vehicles --------------------------------------------------------------
      ('vehicles', 'vehicles_manufacturer_len',
        $chk$char_length(manufacturer) between 1 and 60$chk$),
      ('vehicles', 'vehicles_model_len',
        $chk$char_length(model) between 1 and 120$chk$),
      ('vehicles', 'vehicles_variant_len',
        $chk$variant is null or char_length(variant) between 1 and 60$chk$),
      ('vehicles', 'vehicles_year_range',
        $chk$manufacturing_year between 1900 and 2100$chk$),
      ('vehicles', 'vehicles_fuel_type_valid',
        $chk$fuel_type in ('Petrol','Diesel','CNG','Petrol + CNG','Hybrid','Electric')$chk$),
      ('vehicles', 'vehicles_transmission_valid',
        $chk$transmission in ('Manual','Automatic (AT)','CVT','AMT','DCT','Torque Converter')$chk$),
      ('vehicles', 'vehicles_registration_not_future',
        $chk$registration_date is null or registration_date <= current_date$chk$),
      ('vehicles', 'vehicles_odometer_range',
        $chk$current_odometer between 0 and 2000000$chk$),
      ('vehicles', 'vehicles_avg_daily_km_range',
        $chk$avg_daily_km between 1 and 1000$chk$),
      ('vehicles', 'vehicles_prev_service_date_not_future',
        $chk$previous_service_date is null or previous_service_date <= current_date$chk$),
      ('vehicles', 'vehicles_prev_odometer_range',
        $chk$previous_service_odometer is null or previous_service_odometer between 0 and 2000000$chk$),
      ('vehicles', 'vehicles_prev_odometer_lte_current',
        $chk$previous_service_odometer is null or previous_service_odometer <= current_odometer$chk$),
      ('vehicles', 'vehicles_condition_valid',
        $chk$condition is null or condition in ('Excellent','Good','Average','Needs attention','Unknown')$chk$),
      ('vehicles', 'vehicles_condition_notes_len',
        $chk$condition_notes is null or char_length(condition_notes) <= 2000$chk$),

      -- service_records -------------------------------------------------------
      ('service_records', 'service_records_odometer_range',
        $chk$odometer_reading is null or odometer_reading between 0 and 2000000$chk$),
      ('service_records', 'service_records_workshop_len',
        $chk$workshop_name is null or char_length(workshop_name) <= 200$chk$),
      ('service_records', 'service_records_description_len',
        $chk$service_description is null or char_length(service_description) <= 2000$chk$),
      ('service_records', 'service_records_parts_len',
        $chk$parts_replaced is null or char_length(parts_replaced) <= 2000$chk$),
      ('service_records', 'service_records_labour_cost_nonneg',
        $chk$labour_cost is null or labour_cost >= 0$chk$),
      ('service_records', 'service_records_total_cost_nonneg',
        $chk$total_cost is null or total_cost >= 0$chk$),
      ('service_records', 'service_records_invoice_url_len',
        $chk$invoice_url is null or char_length(invoice_url) <= 2048$chk$),
      ('service_records', 'service_records_notes_len',
        $chk$notes is null or char_length(notes) <= 2000$chk$),
      ('service_records', 'service_records_service_date_not_future',
        $chk$service_date <= current_date$chk$),

      -- maintenance_tasks -----------------------------------------------------
      ('maintenance_tasks', 'maintenance_tasks_name_len',
        $chk$char_length(task_name) between 1 and 200$chk$),
      ('maintenance_tasks', 'maintenance_tasks_key_len',
        $chk$char_length(task_key) between 1 and 100$chk$),
      ('maintenance_tasks', 'maintenance_tasks_interval_km_range',
        $chk$recommended_interval_km is null or recommended_interval_km between 1 and 100000$chk$),
      ('maintenance_tasks', 'maintenance_tasks_interval_months_range',
        $chk$recommended_interval_months is null or recommended_interval_months between 1 and 120$chk$),
      ('maintenance_tasks', 'maintenance_tasks_last_completed_odo_range',
        $chk$last_completed_odometer is null or last_completed_odometer between 0 and 2000000$chk$),
      ('maintenance_tasks', 'maintenance_tasks_last_completed_date_not_future',
        $chk$last_completed_date is null or last_completed_date <= current_date$chk$),
      ('maintenance_tasks', 'maintenance_tasks_next_due_odo_nonneg',
        $chk$next_due_odometer is null or next_due_odometer >= 0$chk$),
      ('maintenance_tasks', 'maintenance_tasks_cost_min_nonneg',
        $chk$estimated_cost_min is null or estimated_cost_min >= 0$chk$),
      ('maintenance_tasks', 'maintenance_tasks_cost_max_nonneg',
        $chk$estimated_cost_max is null or estimated_cost_max >= 0$chk$),
      ('maintenance_tasks', 'maintenance_tasks_cost_range_order',
        $chk$estimated_cost_min is null or estimated_cost_max is null or estimated_cost_min <= estimated_cost_max$chk$),
      ('maintenance_tasks', 'maintenance_tasks_source_valid',
        $chk$source in ('manufacturer','rule_based','ai_suggested','confirmed_diagnostic')$chk$),
      ('maintenance_tasks', 'maintenance_tasks_status_valid',
        $chk$status in ('overdue','due_soon','ok','unknown')$chk$),
      ('maintenance_tasks', 'maintenance_tasks_notes_len',
        $chk$notes is null or char_length(notes) <= 2000$chk$),

      -- invoices --------------------------------------------------------------
      ('invoices', 'invoices_file_url_len',
        $chk$char_length(file_url) between 1 and 2048$chk$),
      ('invoices', 'invoices_file_hash_len',
        $chk$file_hash is null or char_length(file_hash) between 1 and 128$chk$),
      ('invoices', 'invoices_total_amount_nonneg',
        $chk$total_amount is null or total_amount >= 0$chk$),
      ('invoices', 'invoices_invoice_date_not_future',
        $chk$invoice_date is null or invoice_date <= current_date$chk$),
      ('invoices', 'invoices_processing_status_valid',
        $chk$processing_status in ('pending','processing','completed','failed')$chk$),

      -- expenses --------------------------------------------------------------
      ('expenses', 'expenses_type_len',
        $chk$char_length(expense_type) between 1 and 60$chk$),
      ('expenses', 'expenses_amount_nonneg',
        $chk$amount >= 0$chk$),
      ('expenses', 'expenses_expense_date_not_future',
        $chk$expense_date <= current_date$chk$),
      ('expenses', 'expenses_description_len',
        $chk$description is null or char_length(description) <= 2000$chk$),

      -- notifications ---------------------------------------------------------
      ('notifications', 'notifications_type_len',
        $chk$char_length(notification_type) between 1 and 60$chk$),
      ('notifications', 'notifications_channel_valid',
        $chk$channel in ('in_app','email','sms','push')$chk$),
      ('notifications', 'notifications_message_len',
        $chk$char_length(message) between 1 and 2000$chk$),
      ('notifications', 'notifications_status_valid',
        $chk$status in ('scheduled','sent','failed','cancelled')$chk$),

      -- subscriptions ---------------------------------------------------------
      ('subscriptions', 'subscriptions_plan_name_len',
        $chk$char_length(plan_name) between 1 and 60$chk$),
      ('subscriptions', 'subscriptions_status_valid',
        $chk$subscription_status in ('active','trialing','past_due','canceled','expired')$chk$),
      ('subscriptions', 'subscriptions_expiry_after_start',
        $chk$expiry_date is null or expiry_date >= start_date$chk$)
    ) as v(tbl, con, expr)
  loop
    if not exists (
      select 1
        from pg_constraint pc
        join pg_class t      on t.oid = pc.conrelid
        join pg_namespace n  on n.oid = t.relnamespace
       where n.nspname = 'public' and t.relname = c.tbl and pc.conname = c.con
    ) then
      execute format('alter table public.%I add constraint %I check (%s)', c.tbl, c.con, c.expr);
      raise notice 'added constraint %.%', c.tbl, c.con;
    else
      raise notice 'constraint %.% already present, skipped', c.tbl, c.con;
    end if;
  end loop;
end $$;
