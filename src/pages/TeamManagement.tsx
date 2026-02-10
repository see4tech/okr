import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Layout } from '@/components/Layout'
import { ui, teamMemberRoleLabels } from '@/lib/i18n'
import { TEAM_ICONS } from '@/types/enums'
import type { Team, TeamMember } from '@/types/db'

function isDataUrl(s: string | null | undefined): s is string {
  return !!s && s.startsWith('data:')
}

function resizeImageToDataUrl(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      // Crop to square from center
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function TeamIcon({ icon, name, size = 'sm' }: { icon: string | null; name: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-10 h-10 text-xl' : 'w-6 h-6 text-base'
  if (isDataUrl(icon)) {
    return <img src={icon} alt="" className={`${cls} shrink-0 rounded object-cover`} />
  }
  if (icon) {
    return <span className={`${cls} shrink-0 flex items-center justify-center rounded`}>{icon}</span>
  }
  return (
    <span className={`${cls} shrink-0 flex items-center justify-center rounded bg-gray-400 text-white text-xs font-bold`}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

const MEMBER_ROLES = ['viewer', 'member', 'manager'] as const

type TabId = 'teams' | 'members'

export function TeamManagement() {
  const [tab, setTab] = useState<TabId>('teams')

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

  if (!isAdmin && profile !== undefined) {
    return (
      <Layout>
        <p className="text-red-600">{ui.accessDeniedAdmin}</p>
        <a href="/" className="mt-2 inline-block text-brand-600 hover:underline">
          {ui.goHome}
        </a>
      </Layout>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'teams', label: ui.tabTeams },
    { id: 'members', label: ui.tabMembers },
  ]

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{ui.adminTeams}</h1>

        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'teams' && <TeamsTab teams={teams} />}
        {tab === 'members' && <MembersTab teams={teams} isAdmin={isAdmin} />}
      </div>
    </Layout>
  )
}

/* ─────────────────── Tab 1: Teams CRUD ─────────────────── */

function TeamsTab({ teams }: { teams: Team[] }) {
  const queryClient = useQueryClient()
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', teamId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  function handleDelete(team: Team) {
    if (window.confirm(ui.deleteTeamConfirm)) {
      deleteMutation.mutate(team.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{teams.length} {ui.tabTeams.toLowerCase()}</p>
        <button
          type="button"
          onClick={() => { setShowCreateForm(true); setEditingTeam(null) }}
          className="rounded-lg bg-brand-600 py-2 px-4 text-sm font-medium text-white hover:bg-brand-700 shadow-sm"
        >
          + {ui.createTeam}
        </button>
      </div>

      {(showCreateForm || editingTeam) && (
        <TeamForm
          team={editingTeam}
          onClose={() => { setShowCreateForm(false); setEditingTeam(null) }}
        />
      )}

      {teams.length === 0 ? (
        <p className="text-gray-400 text-sm italic">{ui.none}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="w-14 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.teamIcon}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{ui.teamName}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <TeamIcon icon={team.icon} name={team.name} size="lg" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{team.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingTeam(team); setShowCreateForm(false) }}
                        className="text-sm text-brand-600 hover:text-brand-800 font-medium"
                      >
                        {ui.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(team)}
                        disabled={deleteMutation.isPending}
                        className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {ui.deleteTeam}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─────────────────── Team Form (create / edit) ─────────────────── */

function TeamForm({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const isEditing = !!team
  const [name, setName] = useState(team?.name ?? '')
  const [icon, setIcon] = useState(team?.icon ?? '')

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const { error } = await supabase
          .from('teams')
          .update({ name, icon: icon || null })
          .eq('id', team!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('teams')
          .insert({ name, icon: icon || null })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onClose()
    },
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        {isEditing ? ui.editTeam : ui.createTeam}
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          mutation.mutate()
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{ui.teamName}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Nombre del equipo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">{ui.teamIcon}</label>
          <div className="flex flex-wrap gap-1.5">
            {TEAM_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg border-2 transition-colors ${
                  icon === emoji
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {emoji}
              </button>
            ))}
            {/* Clear selection */}
            <button
              type="button"
              onClick={() => setIcon('')}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs border-2 transition-colors ${
                icon === ''
                  ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-400'
              }`}
              title="Sin icono"
            >
              ✕
            </button>
          </div>
          {icon && (
            <p className="mt-2 text-sm text-gray-500">
              Seleccionado: <span className="text-lg">{icon}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={mutation.isPending || !name.trim()}
            className="rounded-lg bg-brand-600 py-2 px-4 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm"
          >
            {mutation.isPending ? ui.saving : isEditing ? ui.save : ui.createTeam}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {ui.cancel}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
      </form>
    </div>
  )
}

/* ─────────────────── Tab 2: Members (existing logic) ─────────────────── */

function MembersTab({ teams, isAdmin }: { teams: Team[]; isAdmin: boolean }) {
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState<string>('')
  const [addRole, setAddRole] = useState<string>('member')
  const [error, setError] = useState<string | null>(null)

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

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const alreadyMemberIds = new Set(members.map((m) => m.user_id))
  const availableProfiles = profiles.filter((p) => !alreadyMemberIds.has(p.id))

  return (
    <div>
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
              {t.icon ? `${t.icon} ${t.name}` : t.name}
            </option>
          ))}
        </select>
      </div>

      {!selectedTeamId ? (
        <p className="text-gray-500 text-sm">Selecciona un equipo para ver y gestionar sus miembros.</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            {selectedTeam?.icon && <span className="mr-1">{selectedTeam.icon}</span>}
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
  )
}
