import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asClient, createTestDb } from './support/pglite'

/**
 * REAL DATABASE RLS INTEGRATION TEST for remediation M-1.
 *
 * This is NOT a unit test and NOT a frontend test. It boots an actual
 * PostgreSQL 18 engine (PGlite, the WASM build of Postgres) in-process, applies
 * the real `supabase/schema.sql`, and then executes statements as the
 * `authenticated` / `anon` roles to prove that Row Level Security itself blocks
 * client writes to `public.subscriptions`.
 *
 * The database scaffolding (Supabase shims, grants, `asClient` helper) lives in
 * `./support/pglite` so it is shared with the M-4 constraint suite. See that
 * module for an explicit statement of what is and is not proven by this setup.
 */

const USER_A = '11111111-1111-4111-8111-111111111111'
const USER_B = '22222222-2222-4222-8222-222222222222'

describe('RLS integration (real PostgreSQL): public.subscriptions is read-only for clients', () => {
  let db
  let subscriptionA
  let subscriptionB

  beforeAll(async () => {
    db = await createTestDb()

    // Seed two accounts through the trusted path (the signup trigger also
    // populates public.users).
    await db.query(
      `insert into auth.users (id, email) values ($1, $2), ($3, $4)`,
      [USER_A, 'a@example.test', USER_B, 'b@example.test'],
    )

    // Seed one subscription row per user through the trusted (server-side) path.
    subscriptionA = (
      await db.query(
        `insert into public.subscriptions (user_id, plan_name) values ($1, 'free') returning id`,
        [USER_A],
      )
    ).rows[0].id
    subscriptionB = (
      await db.query(
        `insert into public.subscriptions (user_id, plan_name) values ($1, 'free') returning id`,
        [USER_B],
      )
    ).rows[0].id
  })

  afterAll(async () => {
    await db?.close()
  })

  // --- structural assertions on the policy itself --------------------------

  it('RLS is enabled on public.subscriptions', async () => {
    const res = await db.query(
      `select relrowsecurity from pg_class where oid = 'public.subscriptions'::regclass`,
    )
    expect(res.rows[0].relrowsecurity).toBe(true)
  })

  it('public.subscriptions has exactly one policy and it is SELECT-only', async () => {
    const res = await db.query(
      `select cmd from pg_policies where schemaname = 'public' and tablename = 'subscriptions'`,
    )
    expect(res.rows.map((row) => row.cmd)).toEqual(['SELECT'])
  })

  // --- required scenarios (requirement 12) ---------------------------------

  it('authorized reads still work: User A reads their own subscription', async () => {
    const res = await asClient(db, { userId: USER_A }, `select id, plan_name from public.subscriptions`)
    expect(res.rows).toHaveLength(1)
    expect(res.rows[0].id).toBe(subscriptionA)
    expect(res.rows[0].plan_name).toBe('free')
  })

  it("User A cannot read User B's subscription", async () => {
    const all = await asClient(db, { userId: USER_A }, `select id from public.subscriptions`)
    expect(all.rows.map((row) => row.id)).not.toContain(subscriptionB)

    const targeted = await asClient(
      db,
      { userId: USER_A },
      `select id from public.subscriptions where user_id = $1`,
      [USER_B],
    )
    expect(targeted.rows).toHaveLength(0)
  })

  it('User A cannot insert a subscription', async () => {
    await expect(
      asClient(
        db,
        { userId: USER_A },
        `insert into public.subscriptions (user_id, plan_name) values ($1, 'premium')`,
        [USER_A],
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it("User A cannot insert a subscription for User B", async () => {
    await expect(
      asClient(
        db,
        { userId: USER_A },
        `insert into public.subscriptions (user_id, plan_name) values ($1, 'premium')`,
        [USER_B],
      ),
    ).rejects.toThrow(/row-level security/i)
  })

  it('User A cannot update (upgrade) their own subscription', async () => {
    const res = await asClient(
      db,
      { userId: USER_A },
      `update public.subscriptions
         set plan_name = 'premium', subscription_status = 'active', expiry_date = current_date + 365
       where user_id = $1
       returning id`,
      [USER_A],
    )
    expect(res.rows).toHaveLength(0)

    const persisted = await db.query(`select plan_name, expiry_date from public.subscriptions where id = $1`, [
      subscriptionA,
    ])
    expect(persisted.rows[0].plan_name).toBe('free')
    expect(persisted.rows[0].expiry_date).toBeNull()
  })

  it("User A cannot update User B's subscription", async () => {
    const res = await asClient(
      db,
      { userId: USER_A },
      `update public.subscriptions set plan_name = 'enterprise' where user_id = $1 returning id`,
      [USER_B],
    )
    expect(res.rows).toHaveLength(0)

    const persisted = await db.query(`select plan_name from public.subscriptions where id = $1`, [
      subscriptionB,
    ])
    expect(persisted.rows[0].plan_name).toBe('free')
  })

  it('User A cannot delete their own subscription', async () => {
    const res = await asClient(
      db,
      { userId: USER_A },
      `delete from public.subscriptions where user_id = $1 returning id`,
      [USER_A],
    )
    expect(res.rows).toHaveLength(0)

    const persisted = await db.query(`select count(*)::int as n from public.subscriptions where id = $1`, [
      subscriptionA,
    ])
    expect(persisted.rows[0].n).toBe(1)
  })

  it('an anonymous client cannot read any subscription', async () => {
    const res = await asClient(db, { userId: null, role: 'anon' }, `select id from public.subscriptions`)
    expect(res.rows).toHaveLength(0)
  })

  // --- the trusted server-side path must still work ------------------------

  it('a trusted server-side write (service_role / owner) still succeeds', async () => {
    const res = await db.query(
      `update public.subscriptions set plan_name = 'plus' where id = $1 returning plan_name`,
      [subscriptionA],
    )
    expect(res.rows[0].plan_name).toBe('plus')
    // restore so the suite stays order-independent
    await db.query(`update public.subscriptions set plan_name = 'free' where id = $1`, [subscriptionA])
  })
})
