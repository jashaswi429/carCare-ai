/**
 * SUPABASE BACKEND - the production data layer.
 * Shapes returned here are identical to `localBackend`, so pages and hooks
 * never need to know which one is active.
 *
 * Every table it touches is protected by Row Level Security (supabase/schema.sql),
 * so even a leaked anon key cannot read another user's data (PRD section 8).
 */

import { supabase } from '@/lib/supabaseClient'

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

const toUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? '',
        created_at: user.created_at,
      }
    : null

export const supabaseBackend = {
  mode: 'supabase',

  auth: {
    async getCurrentUser() {
      const { data } = await supabase.auth.getSession()
      return toUser(data.session?.user ?? null)
    },

    onAuthChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(toUser(session?.user ?? null))
      })
      return () => data.subscription.unsubscribe()
    },

    async signUp({ email, password, fullName }) {
      const data = unwrap(
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { full_name: fullName?.trim() ?? '' } },
        }),
      )
      // When email confirmation is enabled Supabase returns no session yet.
      if (!data.session) {
        throw new Error(
          'Account created. Please confirm your email address, then sign in.',
        )
      }
      return toUser(data.user)
    },

    async signIn({ email, password }) {
      const data = unwrap(
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        }),
      )
      return toUser(data.user)
    },

    async signOut() {
      unwrap(await supabase.auth.signOut())
    },

    async requestPasswordReset(email) {
      unwrap(
        await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      )
      return { delivered: true }
    },
  },

  db: {
    async listVehicles(userId) {
      return unwrap(
        await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      )
    },

    async getVehicle(vehicleId) {
      return unwrap(await supabase.from('vehicles').select('*').eq('id', vehicleId).single())
    },

    async createVehicle({ vehicle, tasks = [] }) {
      const created = unwrap(await supabase.from('vehicles').insert(vehicle).select().single())

      let taskRows = []
      if (tasks.length > 0) {
        taskRows = unwrap(
          await supabase
            .from('maintenance_tasks')
            .insert(tasks.map((task) => ({ ...task, vehicle_id: created.id })))
            .select(),
        )
      }
      return { vehicle: created, tasks: taskRows }
    },

    async updateVehicle(vehicleId, patch) {
      return unwrap(
        await supabase.from('vehicles').update(patch).eq('id', vehicleId).select().single(),
      )
    },

    async deleteVehicle(vehicleId) {
      unwrap(await supabase.from('vehicles').delete().eq('id', vehicleId))
    },

    async listMaintenanceTasks(vehicleId) {
      return unwrap(
        await supabase.from('maintenance_tasks').select('*').eq('vehicle_id', vehicleId),
      )
    },

    async updateMaintenanceTask(taskId, patch) {
      return unwrap(
        await supabase.from('maintenance_tasks').update(patch).eq('id', taskId).select().single(),
      )
    },

    async syncMaintenanceTaskStatuses(rows = []) {
      const results = await Promise.all(
        rows.map((row) =>
          supabase.from('maintenance_tasks').update({ status: row.status }).eq('id', row.id),
        ),
      )
      const failure = results.find((result) => result.error)
      if (failure) throw new Error(failure.error.message)
      return rows
    },
  },
}
