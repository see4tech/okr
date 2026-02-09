/**
 * RLS helpers / notes
 *
 * Policies are defined in supabase/migrations/002_rls_policies.sql.
 *
 * - current_user_role(), is_admin(), is_team_manager(team_id), is_team_member(team_id), can_read_team(team_id), can_write_team(team_id)
 * - Admin: full access to all tables.
 * - Team members (via team_members): read access to their teams; managers can CRUD objectives/items; members can update items they own and create updates/comments/blockers/help requests.
 * - Viewers: read-only for their teams.
 *
 * All mutations run with the authenticated user's JWT; RLS evaluates per row.
 */

export const RLS_NOTES = `
Admin: full CRUD everywhere.
Manager (team_members.member_role = 'manager'): CRUD objectives, items, blockers, help_requests for that team.
Member: read team; update items where owner_id = auth.uid(); create item_updates, comments, blockers, help_requests for team items.
Viewer: read-only for teams they belong to.
`
