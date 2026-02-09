import { supabase } from './supabaseClient'
import type { Profile } from '@/types/db'

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (data.user) await ensureProfile(data.user)
  return data
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (data.user) await ensureProfile(data.user)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Create profile row if missing (client-side upsert after login). */
export async function ensureProfile(user: { id: string; email?: string | null }): Promise<Profile | null> {
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (existing) return existing as unknown as Profile

  const { data: inserted, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? null,
      role: 'member', // First admin: set in Supabase: UPDATE profiles SET role = 'admin' WHERE email = '...';
    })
    .select()
    .single()

  if (error) {
    // RLS or unique conflict - profile may have been created by another request
    const { data: retry, error: retryErr } = await supabase.from('profiles').select().eq('id', user.id).maybeSingle()
    if (retryErr) throw retryErr
    return retry as unknown as Profile
  }
  return inserted as unknown as Profile
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error || !data) return null
  return data as unknown as Profile
}
