/**
 * Maintenance schedule catalog (PRD 4.4 + 4.10).
 *
 * IMPORTANT / HONESTY RULES
 * - `source: 'manufacturer'` entries are interval values commonly published in
 *   Indian owner manuals. They are a *default reference*, not a live feed.
 * - `source: 'rule_based'` entries are generic industry-practice intervals.
 * - Cost figures are indicative Indian market ranges used purely for
 *   *forecasting ranges*. They are never presented as a confirmed price
 *   (PRD 4.10, 4.12 and section 12 risks).
 * - Every task this catalog produces is therefore labelled in the UI as either
 *   "Manufacturer schedule" or "Rule-based estimate".
 */

export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid', 'Electric']

export const TRANSMISSIONS = ['Manual', 'Automatic (AT)', 'CVT', 'AMT', 'DCT', 'Torque Converter']

export const VEHICLE_CONDITIONS = [
  'Excellent',
  'Good',
  'Average',
  'Needs attention',
  'Unknown',
]

/** Tasks that only make sense on a combustion engine. */
const COMBUSTION_ONLY = new Set([
  'engine_oil',
  'oil_filter',
  'air_filter',
  'spark_plugs',
  'coolant',
  'transmission_fluid',
])

/** Generic schedule applied when the manufacturer is not in `BRAND_SCHEDULES`. */
const DEFAULT_SCHEDULE = [
  {
    key: 'engine_oil',
    name: 'Engine oil replacement',
    intervalKm: 10000,
    intervalMonths: 12,
    costMin: 2500,
    costMax: 6500,
    group: 'Engine',
    source: 'rule_based',
    appliesTo: ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'Oil degrades with both distance and time, so whichever limit is reached first applies.',
  },
  {
    key: 'oil_filter',
    name: 'Oil filter replacement',
    intervalKm: 10000,
    intervalMonths: 12,
    costMin: 500,
    costMax: 1500,
    group: 'Engine',
    source: 'rule_based',
    appliesTo: ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'Replaced together with engine oil in almost every service.',
  },
  {
    key: 'air_filter',
    name: 'Air filter replacement',
    intervalKm: 15000,
    intervalMonths: 12,
    costMin: 600,
    costMax: 1800,
    group: 'Engine',
    source: 'rule_based',
    appliesTo: ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'A clogged air filter reduces mileage and pickup.',
  },
  {
    key: 'cabin_filter',
    name: 'Cabin / AC filter replacement',
    intervalKm: 15000,
    intervalMonths: 12,
    costMin: 700,
    costMax: 2000,
    group: 'Comfort',
    source: 'rule_based',
    why: 'Affects AC cooling and cabin air quality.',
  },
  {
    key: 'brake_inspection',
    name: 'Brake inspection',
    intervalKm: 10000,
    intervalMonths: 6,
    costMin: 500,
    costMax: 1500,
    group: 'Safety',
    source: 'rule_based',
    why: 'Inspection only — pad or disc replacement is quoted separately after inspection.',
  },
  {
    key: 'tyre_rotation',
    name: 'Tyre rotation & alignment check',
    intervalKm: 10000,
    intervalMonths: 6,
    costMin: 600,
    costMax: 2000,
    group: 'Safety',
    source: 'rule_based',
    why: 'Even wear extends tyre life significantly.',
  },
  {
    key: 'general_service',
    name: 'General servicing',
    intervalKm: 10000,
    intervalMonths: 12,
    costMin: 5000,
    costMax: 14000,
    group: 'General',
    source: 'rule_based',
    why: 'Bundled service including oil, filters and a multi-point check.',
  },
  {
    key: 'battery_check',
    name: 'Battery health check',
    intervalKm: null,
    intervalMonths: 12,
    costMin: 500,
    costMax: 9000,
    group: 'Electrical',
    source: 'rule_based',
    why: 'Car batteries in India typically last 3-5 years. Check annually, replace on failure.',
  },
  {
    key: 'coolant',
    name: 'Coolant replacement',
    intervalKm: 40000,
    intervalMonths: 36,
    costMin: 1500,
    costMax: 4500,
    group: 'Cooling',
    source: 'rule_based',
    appliesTo: ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'Prevents overheating and internal corrosion.',
  },
  {
    key: 'spark_plugs',
    name: 'Spark plug replacement',
    intervalKm: 40000,
    intervalMonths: 30,
    costMin: 1500,
    costMax: 6000,
    group: 'Engine',
    source: 'rule_based',
    appliesTo: ['Petrol', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'Worn plugs cause misfires, rough idle and poor mileage.',
  },
  {
    key: 'transmission_fluid',
    name: 'Transmission fluid service',
    intervalKm: 60000,
    intervalMonths: 48,
    costMin: 3000,
    costMax: 12000,
    group: 'Drivetrain',
    source: 'rule_based',
    appliesTo: ['Petrol', 'Diesel', 'CNG', 'Petrol + CNG', 'Hybrid'],
    why: 'Automatic gearboxes usually need more frequent fluid service than manuals.',
  },
]

/**
 * Manufacturer-specific overrides. Only `intervalKm` / `intervalMonths` are
 * overridden — anything not listed falls back to DEFAULT_SCHEDULE.
 */
export const BRAND_SCHEDULES = {
  'Maruti Suzuki': { engine_oil: [10000, 12], oil_filter: [10000, 12], air_filter: [15000, 12] },
  Hyundai: { engine_oil: [10000, 12], air_filter: [15000, 12], coolant: [45000, 36] },
  Tata: { engine_oil: [15000, 12], oil_filter: [15000, 12], air_filter: [20000, 12] },
  Honda: { engine_oil: [10000, 12], spark_plugs: [50000, 36] },
  Toyota: { engine_oil: [10000, 12], air_filter: [20000, 12] },
  Mahindra: { engine_oil: [15000, 12], air_filter: [20000, 12] },
  Kia: { engine_oil: [10000, 12], coolant: [45000, 36] },
  Volkswagen: { engine_oil: [15000, 12], spark_plugs: [60000, 48] },
  Skoda: { engine_oil: [15000, 12], spark_plugs: [60000, 48] },
  Renault: { engine_oil: [10000, 12] },
  Nissan: { engine_oil: [10000, 12] },
  MG: { engine_oil: [10000, 12] },
}

/** Manufacturers offered in onboarding (kept short and market-relevant). */
export const MANUFACTURERS = Object.keys(BRAND_SCHEDULES).sort()

/** Known models per manufacturer - suggestions only, free text is allowed. */
export const MODELS_BY_BRAND = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Brezza', 'Ertiga', 'Wagon R', 'Grand Vitara', 'Fronx', 'Alto K10', 'XL6'],
  Hyundai: ['i20', 'Creta', 'Venue', 'Verna', 'Grand i10 Nios', 'Exter', 'Alcazar', 'Tucson', 'Aura'],
  Tata: ['Nexon', 'Punch', 'Altroz', 'Harrier', 'Safari', 'Tiago', 'Tigor', 'Curvv'],
  Honda: ['City', 'Amaze', 'Elevate', 'Jazz', 'WR-V'],
  Toyota: ['Innova Crysta', 'Innova Hycross', 'Fortuner', 'Glanza', 'Urban Cruiser Hyryder', 'Etios', 'Camry'],
  Mahindra: ['XUV700', 'XUV300', 'Scorpio N', 'Thar', 'Bolero', 'XUV400'],
  Kia: ['Seltos', 'Sonet', 'Carens', 'Carnival', 'EV6'],
  Volkswagen: ['Polo', 'Vento', 'Taigun', 'Virtus', 'Tiguan'],
  Skoda: ['Kushaq', 'Slavia', 'Rapid', 'Octavia', 'Superb', 'Kodiaq'],
  Renault: ['Kwid', 'Triber', 'Kiger', 'Duster'],
  Nissan: ['Magnite', 'Kicks', 'Sunny'],
  MG: ['Hector', 'Astor', 'ZS EV', 'Comet EV', 'Gloster'],
}

/**
 * Returns the applicable task templates for a vehicle.
 * Intervals are merged as: brand override -> generic default.
 * Electric vehicles drop every combustion-only task (PRD 4.4 correctness).
 */
export function scheduleForVehicle({ manufacturer, fuelType }) {
  const brand = BRAND_SCHEDULES[manufacturer] ?? {}
  const isElectric = fuelType === 'Electric'

  return DEFAULT_SCHEDULE.filter((task) => !(isElectric && COMBUSTION_ONLY.has(task.key))).map(
    (task) => {
      const override = brand[task.key]
      return {
        ...task,
        name: isElectric && task.key === 'battery_check' ? 'High-voltage battery health check' : task.name,
        intervalKm: override?.[0] ?? task.intervalKm,
        intervalMonths: override?.[1] ?? task.intervalMonths,
        source: override ? 'manufacturer' : task.source,
      }
    },
  )
}
