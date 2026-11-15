import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { asClient, createTestDb } from './support/pglite'
import { buildTaskRows } from '@/services/maintenanceEngine'

/**
 * REAL DATABASE CONSTRAINT INTEGRATION TEST for remediation M-4.
 *
 * Boots a real PostgreSQL 18 engine (PGlite) and applies the real
 * `supabase/schema.sql`, then attempts reads/writes as the `authenticated`
 * client role (the PostgREST path an attacker would use). Every rejection
 * asserted below is produced by an actual PostgreSQL CHECK / NOT NULL
 * constraint, never by mocked JavaScript validation.
 *
 * Assertions name the specific constraint so a pass proves the intended rule
 * fired, not some unrelated failure.
 */

const USER_A = '11111111-1111-4111-8111-111111111111'

describe('M-4 database input constraints (real PostgreSQL)', () => {
  let db
  let vehicleA

  /** Insert a row as a client through PostgREST-style role switching. */
  function insertAs(user, table, row) {
    const keys = Object.keys(row)
    const cols = keys.join(', ')
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
    return asClient(
      db,
      { userId: user },
      `insert into public.${table} (${cols}) values (${placeholders}) returning *`,
      Object.values(row),
    )
  }

  const asUserA = (table, row) => insertAs(USER_A, table, row)

  const validVehicle = (overrides = {}) => ({
    user_id: USER_A,
    manufacturer: 'Maruti Suzuki',
    model: 'Swift',
    manufacturing_year: 2020,
    fuel_type: 'Petrol',
    transmission: 'Manual',
    current_odometer: 42000,
    avg_daily_km: 40,
    ...overrides,
  })

  beforeAll(async () => {
    db = await createTestDb()
    await db.query(`insert into auth.users (id, email) values ($1, $2)`, [USER_A, 'a@example.test'])

    // A vehicle that the child-table tests can hang off (trusted seed path).
    vehicleA = (
      await db.query(
        `insert into public.vehicles (user_id, manufacturer, model, manufacturing_year,
                                      fuel_type, transmission, current_odometer, avg_daily_km)
         values ($1, 'Maruti Suzuki', 'Swift', 2020, 'Petrol', 'Manual', 42000, 40)
         returning id`,
        [USER_A],
      )
    ).rows[0].id
  })

  afterAll(async () => {
    await db?.close()
  })

  // ==========================================================================
  describe('vehicles', () => {
    it('accepts a valid vehicle and applies column defaults', async () => {
      const res = await asUserA('vehicles', {
        user_id: USER_A,
        manufacturer: 'Hyundai',
        model: 'i20',
        manufacturing_year: 2022,
        fuel_type: 'Diesel',
        transmission: 'Automatic (AT)',
      })
      expect(res.rows).toHaveLength(1)
      expect(res.rows[0].current_odometer).toBe(0)
      expect(res.rows[0].avg_daily_km).toBe(40)
      expect(res.rows[0].created_at).toBeTruthy()
    })

    it('rejects a negative odometer (vehicles_odometer_range)', async () => {
      await expect(asUserA('vehicles', validVehicle({ current_odometer: -1 }))).rejects.toThrow(
        /vehicles_odometer_range/,
      )
    })

    it('rejects an odometer above the realistic maximum of 2,000,000 km', async () => {
      await expect(asUserA('vehicles', validVehicle({ current_odometer: 2000001 }))).rejects.toThrow(
        /vehicles_odometer_range/,
      )
    })

    it('rejects an impossible manufacturing year (1800)', async () => {
      await expect(asUserA('vehicles', validVehicle({ manufacturing_year: 1800 }))).rejects.toThrow(
        /vehicles_year_range/,
      )
    })

    it('rejects a far-future manufacturing year (3000)', async () => {
      await expect(asUserA('vehicles', validVehicle({ manufacturing_year: 3000 }))).rejects.toThrow(
        /vehicles_year_range/,
      )
    })

    it('rejects an unknown fuel type', async () => {
      await expect(asUserA('vehicles', validVehicle({ fuel_type: 'Coal' }))).rejects.toThrow(
        /vehicles_fuel_type_valid/,
      )
    })

    it('rejects an unknown transmission', async () => {
      await expect(asUserA('vehicles', validVehicle({ transmission: 'Rocket' }))).rejects.toThrow(
        /vehicles_transmission_valid/,
      )
    })

    it('rejects an unknown vehicle condition', async () => {
      await expect(asUserA('vehicles', validVehicle({ condition: 'Mint' }))).rejects.toThrow(
        /vehicles_condition_valid/,
      )
    })

    it('rejects a non-positive average daily distance', async () => {
      await expect(asUserA('vehicles', validVehicle({ avg_daily_km: 0 }))).rejects.toThrow(
        /vehicles_avg_daily_km_range/,
      )
    })

    it('rejects a previous-service odometer above the current odometer', async () => {
      await expect(
        asUserA(
          'vehicles',
          validVehicle({ current_odometer: 42000, previous_service_odometer: 50000 }),
        ),
      ).rejects.toThrow(/vehicles_prev_odometer_lte_current/)
    })

    it('rejects an excessively long model name (121 chars)', async () => {
      await expect(asUserA('vehicles', validVehicle({ model: 'x'.repeat(121) }))).rejects.toThrow(
        /vehicles_model_len/,
      )
    })

    it('rejects excessively long condition notes (2001 chars)', async () => {
      await expect(
        asUserA('vehicles', validVehicle({ condition_notes: 'y'.repeat(2001) })),
      ).rejects.toThrow(/vehicles_condition_notes_len/)
    })

    it('rejects a future registration date', async () => {
      await expect(
        asUserA('vehicles', validVehicle({ registration_date: '2999-01-01' })),
      ).rejects.toThrow(/vehicles_registration_not_future/)
    })

    it('still requires the genuinely-required NOT NULL columns', async () => {
      await expect(
        asUserA('vehicles', {
          user_id: USER_A,
          model: 'Swift',
          manufacturing_year: 2020,
          fuel_type: 'Petrol',
          transmission: 'Manual',
        }),
      ).rejects.toThrow(/null value in column "manufacturer"/)
    })
  })

  // ==========================================================================
  describe('maintenance_tasks', () => {
    const validTask = (overrides = {}) => ({
      vehicle_id: vehicleA,
      task_name: 'Engine oil replacement',
      task_key: 'engine_oil',
      recommended_interval_km: 10000,
      recommended_interval_months: 12,
      estimated_cost_min: 2500,
      estimated_cost_max: 6500,
      ...overrides,
    })

    it('accepts a valid task and applies the source/status defaults', async () => {
      const res = await asUserA('maintenance_tasks', validTask())
      expect(res.rows).toHaveLength(1)
      expect(res.rows[0].source).toBe('rule_based')
      expect(res.rows[0].status).toBe('ok')
    })

    it('rejects an unknown provenance source', async () => {
      await expect(asUserA('maintenance_tasks', validTask({ source: 'guessed' }))).rejects.toThrow(
        /maintenance_tasks_source_valid/,
      )
    })

    it('rejects an unknown status', async () => {
      await expect(asUserA('maintenance_tasks', validTask({ status: 'fine' }))).rejects.toThrow(
        /maintenance_tasks_status_valid/,
      )
    })

    it('rejects a non-positive distance interval', async () => {
      await expect(
        asUserA('maintenance_tasks', validTask({ recommended_interval_km: 0 })),
      ).rejects.toThrow(/maintenance_tasks_interval_km_range/)
    })

    it('rejects a non-positive month interval', async () => {
      await expect(
        asUserA('maintenance_tasks', validTask({ recommended_interval_months: -1 })),
      ).rejects.toThrow(/maintenance_tasks_interval_months_range/)
    })

    it('rejects an inverted cost range (min > max)', async () => {
      await expect(
        asUserA('maintenance_tasks', validTask({ estimated_cost_min: 9000, estimated_cost_max: 1000 })),
      ).rejects.toThrow(/maintenance_tasks_cost_range_order/)
    })

    it('rejects a negative cost estimate', async () => {
      await expect(
        asUserA('maintenance_tasks', validTask({ estimated_cost_min: -1 })),
      ).rejects.toThrow(/maintenance_tasks_cost_min_nonneg/)
    })

    it('rejects a negative last-completed odometer', async () => {
      await expect(
        asUserA('maintenance_tasks', validTask({ last_completed_odometer: -5 })),
      ).rejects.toThrow(/maintenance_tasks_last_completed_odo_range/)
    })
  })

  // ==========================================================================
  describe('service_records', () => {
    const validRecord = (overrides = {}) => ({
      vehicle_id: vehicleA,
      service_date: '2025-01-15',
      odometer_reading: 40000,
      workshop_name: 'Highway Motors',
      labour_cost: 1500,
      total_cost: 5000,
      ...overrides,
    })

    it('accepts a valid service record', async () => {
      const res = await asUserA('service_records', validRecord())
      expect(res.rows).toHaveLength(1)
    })

    it('rejects a negative odometer reading', async () => {
      await expect(
        asUserA('service_records', validRecord({ odometer_reading: -1 })),
      ).rejects.toThrow(/service_records_odometer_range/)
    })

    it('rejects a negative cost', async () => {
      await expect(
        asUserA('service_records', validRecord({ labour_cost: -100 })),
      ).rejects.toThrow(/service_records_labour_cost_nonneg/)
    })

    it('rejects an excessively long service description', async () => {
      await expect(
        asUserA('service_records', validRecord({ service_description: 'z'.repeat(2001) })),
      ).rejects.toThrow(/service_records_description_len/)
    })
  })

  // ==========================================================================
  describe('expenses', () => {
    it('accepts a valid expense', async () => {
      const res = await asUserA('expenses', {
        vehicle_id: vehicleA,
        expense_type: 'Fuel',
        amount: 3500,
        expense_date: '2025-02-01',
      })
      expect(res.rows).toHaveLength(1)
    })

    it('rejects a negative amount', async () => {
      await expect(
        asUserA('expenses', {
          vehicle_id: vehicleA,
          expense_type: 'Fuel',
          amount: -1,
          expense_date: '2025-02-01',
        }),
      ).rejects.toThrow(/expenses_amount_nonneg/)
    })
  })

  // ==========================================================================
  describe('invoices', () => {
    const validInvoice = (overrides = {}) => ({
      user_id: USER_A,
      file_url: 'invoices/11111111-1111-4111-8111-111111111111/bill.pdf',
      total_amount: 4200,
      invoice_date: '2025-03-01',
      ...overrides,
    })

    it('accepts a valid invoice and applies the processing_status default', async () => {
      const res = await asUserA('invoices', validInvoice())
      expect(res.rows).toHaveLength(1)
      expect(res.rows[0].processing_status).toBe('pending')
    })

    it('rejects an unknown processing status', async () => {
      await expect(
        asUserA('invoices', validInvoice({ processing_status: 'done-ish' })),
      ).rejects.toThrow(/invoices_processing_status_valid/)
    })

    it('rejects a negative total amount', async () => {
      await expect(asUserA('invoices', validInvoice({ total_amount: -0.01 }))).rejects.toThrow(
        /invoices_total_amount_nonneg/,
      )
    })
  })

  // ==========================================================================
  describe('notifications', () => {
    const validNotification = (overrides = {}) => ({
      user_id: USER_A,
      notification_type: 'maintenance_due',
      message: 'Engine oil change is due soon.',
      scheduled_date: '2025-04-01',
      ...overrides,
    })

    it('accepts a valid notification and applies the channel/status defaults', async () => {
      const res = await asUserA('notifications', validNotification())
      expect(res.rows).toHaveLength(1)
      expect(res.rows[0].channel).toBe('in_app')
      expect(res.rows[0].status).toBe('scheduled')
    })

    it('rejects an unknown channel', async () => {
      await expect(
        asUserA('notifications', validNotification({ channel: 'carrier_pigeon' })),
      ).rejects.toThrow(/notifications_channel_valid/)
    })

    it('rejects an unknown status', async () => {
      await expect(
        asUserA('notifications', validNotification({ status: 'maybe' })),
      ).rejects.toThrow(/notifications_status_valid/)
    })
  })

  // ==========================================================================
  // subscriptions are written only by the trusted server-side path (M-1), so
  // these constraints are exercised as the table owner. They are defence in
  // depth for the future billing webhook / Edge Function.
  describe('subscriptions (trusted server-side writer)', () => {
    it('accepts a valid subscription row and applies the defaults', async () => {
      const res = await db.query(
        `insert into public.subscriptions (user_id) values ($1) returning plan_name, subscription_status`,
        [USER_A],
      )
      expect(res.rows[0].plan_name).toBe('free')
      expect(res.rows[0].subscription_status).toBe('active')
    })

    it('rejects an unknown subscription status', async () => {
      await expect(
        db.query(
          `insert into public.subscriptions (user_id, subscription_status) values ($1, 'gold-ish')`,
          [USER_A],
        ),
      ).rejects.toThrow(/subscriptions_status_valid/)
    })

    it('rejects an expiry date before the start date', async () => {
      await expect(
        db.query(
          `insert into public.subscriptions (user_id, start_date, expiry_date)
           values ($1, date '2025-06-01', date '2025-01-01')`,
          [USER_A],
        ),
      ).rejects.toThrow(/subscriptions_expiry_after_start/)
    })
  })

  // ==========================================================================
  describe('users', () => {
    it('rejects an excessively long full name', async () => {
      await expect(
        db.query(`update public.users set full_name = $1 where id = $2`, ['n'.repeat(121), USER_A]),
      ).rejects.toThrow(/users_full_name_len/)
    })
  })

  // ==========================================================================
  // Integration: the values the application actually produces must be accepted.
  describe('application integration (defaults and engine output still work)', () => {
    it('accepts the exact vehicle payload addVehicle produces', async () => {
      // Mirrors src/context/VehiclesContext.jsx addVehicle().
      const payload = {
        user_id: USER_A,
        manufacturer: 'Maruti Suzuki',
        model: 'Swift',
        variant: 'VXi',
        manufacturing_year: 2021,
        fuel_type: 'Petrol',
        transmission: 'Manual',
        registration_date: '2021-06-01',
        current_odometer: 42000,
        avg_daily_km: 40,
        previous_service_date: null,
        previous_service_odometer: null,
        condition: 'Good',
        condition_notes: null,
        odometer_updated_at: new Date().toISOString(),
      }
      const res = await asUserA('vehicles', payload)
      expect(res.rows).toHaveLength(1)
    })

    it('accepts every maintenance task row the predictive engine generates', async () => {
      // The engine is the real source of maintenance_tasks rows; if any of its
      // output violated a new constraint the product would be broken.
      const vehicle = {
        manufacturer: 'Maruti Suzuki',
        fuel_type: 'Petrol',
        current_odometer: 42000,
        previous_service_odometer: null,
        previous_service_date: null,
      }
      const rows = buildTaskRows(vehicle)
      expect(rows.length).toBeGreaterThan(0)

      for (const row of rows) {
        const res = await asUserA('maintenance_tasks', { ...row, vehicle_id: vehicleA })
        expect(res.rows[0].task_key).toBe(row.task_key)
        expect(['overdue', 'due_soon', 'ok', 'unknown']).toContain(res.rows[0].status)
      }
    })
  })
})
