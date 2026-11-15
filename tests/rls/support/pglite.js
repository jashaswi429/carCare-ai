import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

/**
 * Shared real-database test scaffolding.
 *
 * Boots an actual PostgreSQL engine (PGlite - the WASM build of Postgres) and
 * applies the REAL `supabase/schema.sql`, so any assertion made against it
 * exercises genuine PostgreSQL behaviour (RLS policies, CHECK constraints,
 * NOT NULL, foreign keys), not a JavaScript mock.
 *
 * What this does and does not prove:
 *   - The engine IS real PostgreSQL and the constraints/policies ARE real.
 *   - It is NOT the hosted Supabase instance. Supabase-specific primitives are
 *     emulated with `SUPABASE_SHIM_SQL`: the `auth` schema + `auth.uid()`, the
 *     `storage` schema + `storage.foldername()`, and the `anon` / `authenticated`
 *     / `service_role` roles.
 *   - Table privileges mirror Supabase's defaults (`SUPABASE_GRANTS_SQL`), so a
 *     denial proves RLS is blocking rather than a missing GRANT.
 */

export const SCHEMA_SQL = readFileSync(
  path.resolve(process.cwd(), 'supabase/schema.sql'),
  'utf8',
)

/** Minimal, faithful emulation of the Supabase primitives schema.sql relies on. */
export const SUPABASE_SHIM_SQL = `
create schema if not exists auth;
create schema if not exists storage;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable as $fn$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$fn$;

create or replace function auth.role() returns text
language sql stable as $fn$
  select nullif(current_setting('request.jwt.claim.role', true), '')
$fn$;

create table if not exists storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name      text,
  owner     uuid
);

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $fn$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
$fn$;
`

/** Mirror Supabase's default grants so RLS (not privileges) is what denies. */
export const SUPABASE_GRANTS_SQL = `
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
`

/**
 * Create a database with the Supabase shims + the real schema already applied.
 * The grants are applied last so they cover every table the schema just created.
 */
export async function createTestDb() {
  const db = await PGlite.create()
  await db.exec(SUPABASE_SHIM_SQL)
  await db.exec(SCHEMA_SQL)
  await db.exec(SUPABASE_GRANTS_SQL)
  return db
}

/**
 * Run a statement as a given client role with a given JWT subject, the way
 * PostgREST does it. `role: null` acts as the table owner (trusted path).
 */
export async function asClient(db, { userId = null, role = 'authenticated' } = {}, sql, params = []) {
  await db.exec('reset role')
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [userId ?? ''])
  await db.query(`select set_config('request.jwt.claim.role', $1, false)`, [role])
  await db.exec(`set role ${role}`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role')
  }
}
