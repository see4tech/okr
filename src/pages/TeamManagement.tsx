import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { ui, teamMemberRoleLabels } from '@/lib/i18n'
import type { Team } from '@/types/db'
import type { TeamMember } from '@/types/db'

const MEMBER_ROLES = ['viewer', 'member', 'manager'] as const

export function TeamManagement() {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState<string>('')
  const [addRole, setAddRole] = useState<string>('member')
  const [error, setError] = useState<string | null>(null)

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session: s } } = await supabase.auth.getSession()
      return s
    },
  })
  const userId = session?.user?.id ?? ''

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
      if (e) throw e
      return data as { role: string } | null
    },
    enabled: !!userId,
  })
  const isAdmin = profile?.role === 'admin'

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('teams').select('*').order('name')
      if (e) throw e
      return data as Team[]
    },
    enabled: isAdmin,
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('profiles').select('id, email').order('email')
      if (e) throw e
      return data as { id: string; email: string | null }[]
    },
    enabled: isAdmin,
  })

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team_members', selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return []
      const { data, error: e } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', selectedTeamId)
        .order('member_role')
      if (e) throw e
      return data as TeamMember[]
    },
    enabled: isAdmin && !!selectedTeamId,
  })

  const profileById = new Map(profiles.map((p) => [p.id, p.email ?? ui.unknown]))
  const memberEmails = members.map((m) => ({ ...m, email: profileById.get(m.user_id) ?? ui.unknown }))

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTeamId || !addUserId) throw new Error(ui.selectUser)
      setError(null)
      const { error: e } = await supabase.from('team_members').insert({
        team_id: selectedTeamId,
        user_id: addUserId,
        member_role: addRole,
      })
      if (e) throw e
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members', selectedTeamId] })
      setAddUserId('')
      setAddRole('member')
    },
    onError: (err) => setError(err instanceof Error ? err.message : ui.failed),
  })

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error: e } = await supabase.from('team_members').delete().eq('id', memberId)
      if (e) throw e
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members', selectedTeamId] })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error: e } = await supabase
        .from('team_members')
        .update({ member_role: role })
        .eq('id', memberId)
      if (e) throw e
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_members', selectedTeamId] })
    },
  })

  if (!isAdmin && profile !== undefined) {
    return (
      <Layout >
        <p className="text-red-600">{ui.accessDeniedAdmin}</p>
        <a href="/" className="mt-2 inline-block text-brand-600 hover:underline">
          {ui.goHome}
        </a>
      </Layout>
    )
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const alreadyMemberIds = new Set(members.map((m) => m.user_id))
  const availableProfiles = profiles.filter((p) => !alreadyMemberIds.has(p.id))

  return (
    <Layout >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{ui.adminTeams}</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-1">{ui.team}</label>
          <select
            value={selectedTeamId ?? ''}
            onChange={(e) => setSelectedTeamId(e.target.value || null)}
            className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">{ui.selectTeam}</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {!selectedTeamId ? (
          <p className="text-gray-500 text-sm">Selecciona un equipo para ver y gestionar sus miembros.</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              {ui.manageTeamMembers} — {selectedTeam?.name}
            </h2>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{ui.addMember}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  addMutation.mutate()
                }}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">{ui.selectUser}</label>
                  <select
                    value={addUserId}
                    onChange={(e) => setAddUserId(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">{ui.selectUser}</option>
                    {availableProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.email ?? p.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[120px]">
                  <label className="block text-xs text-gray-500 mb-1">{ui.memberRole}</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    {MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {teamMemberRoleLabels[r] ?? r}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!addUserId || addMutation.isPending}
                  className="rounded-lg bg-brand-600 py-2 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
                >
                  {ui.add}
                </button>
              </form>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {membersLoading ? (
              <p className="text-gray-500">{ui.loading}</p>
            ) : memberEmails.length === 0 ? (
              <p className="text-gray-500">{ui.noMembersYet}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.email}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.memberRole}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {memberEmails.map((m) => (
                      <tr key={m.id} className="hover:bg-brand-50/40">
                        <td className="px-4 py-3 text-sm text-gray-900">{m.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={m.member_role}
                            onChange={(e) => updateRoleMutation.mutate({ memberId: m.id, role: e.target.value })}
                            className="rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                          >
                            {MEMBER_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {teamMemberRoleLabels[r] ?? r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeMutation.mutate(m.id)}
                            disabled={removeMutation.isPending}
                            className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            {ui.removeMember}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
