-- RLS: Enable on all tables and define policies
-- Admin: full access. Team members: read team data. Managers: CRUD objectives/items/blockers/help for team.
-- Members: update items where owner or create updates/comments; create blockers/help for team items. Viewers: read-only.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Helper: current user's app role from profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is user admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT current_user_role() = 'admin'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: user is manager of team_id
CREATE OR REPLACE FUNCTION public.is_team_manager(team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = is_team_manager.team_id
      AND user_id = auth.uid()
      AND member_role = 'manager'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: user is member (manager/member) of team_id (can write)
CREATE OR REPLACE FUNCTION public.is_team_member(team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = is_team_member.team_id
      AND user_id = auth.uid()
      AND member_role IN ('manager', 'member')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: user can read team (viewer or higher)
CREATE OR REPLACE FUNCTION public.can_read_team(team_id uuid)
RETURNS boolean AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = can_read_team.team_id AND user_id = auth.uid()
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: user can write team (manager or member, not viewer)
CREATE OR REPLACE FUNCTION public.can_write_team(team_id uuid)
RETURNS boolean AS $$
  SELECT public.is_admin() OR public.is_team_member(team_id)
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------- PROFILES ----------
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile (limited)"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE USING (public.is_admin());

-- Service role / trigger may insert profile; allow insert for own id (first login upsert)
CREATE POLICY "Allow insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- ---------- TEAMS ----------
CREATE POLICY "Read teams if can read"
  ON public.teams FOR SELECT USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid()
  ));

CREATE POLICY "Admin manage teams"
  ON public.teams FOR ALL USING (public.is_admin());

-- ---------- TEAM_MEMBERS ----------
CREATE POLICY "Read team_members for own teams or admin"
  ON public.team_members FOR SELECT USING (
    public.is_admin() OR user_id = auth.uid() OR public.can_read_team(team_id)
  );

CREATE POLICY "Admin manage team_members"
  ON public.team_members FOR ALL USING (public.is_admin());

-- ---------- PERIODS ----------
CREATE POLICY "Anyone authenticated can read periods"
  ON public.periods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage periods"
  ON public.periods FOR ALL USING (public.is_admin());

-- ---------- OBJECTIVES ----------
CREATE POLICY "Read objectives for readable teams"
  ON public.objectives FOR SELECT USING (public.can_read_team(team_id));

CREATE POLICY "Managers and admin can insert objectives"
  ON public.objectives FOR INSERT WITH CHECK (public.is_admin() OR public.is_team_manager(team_id));

CREATE POLICY "Managers and admin can update objectives"
  ON public.objectives FOR UPDATE USING (public.is_admin() OR public.is_team_manager(team_id));

CREATE POLICY "Managers and admin can delete objectives"
  ON public.objectives FOR DELETE USING (public.is_admin() OR public.is_team_manager(team_id));

-- ---------- ITEMS ----------
CREATE POLICY "Read items for readable teams"
  ON public.items FOR SELECT USING (public.can_read_team(team_id));

CREATE POLICY "Managers and admin can insert items"
  ON public.items FOR INSERT WITH CHECK (public.is_admin() OR public.is_team_member(team_id));

CREATE POLICY "Update items: admin, team manager, or owner (member)"
  ON public.items FOR UPDATE USING (
    public.is_admin()
    OR public.is_team_manager(team_id)
    OR (public.is_team_member(team_id) AND owner_id = auth.uid())
  );

CREATE POLICY "Delete items: admin or team manager"
  ON public.items FOR DELETE USING (public.is_admin() OR public.is_team_manager(team_id));

-- ---------- ITEM_UPDATES ----------
CREATE POLICY "Read item_updates for readable team"
  ON public.item_updates FOR SELECT USING (
    public.can_read_team((SELECT team_id FROM public.items WHERE id = item_updates.item_id))
  );

CREATE POLICY "Insert item_update: admin, manager, or team member"
  ON public.item_updates FOR INSERT WITH CHECK (
    public.is_admin()
    OR public.is_team_manager((SELECT team_id FROM public.items WHERE id = item_id))
    OR public.is_team_member((SELECT team_id FROM public.items WHERE id = item_id))
  );

-- ---------- BLOCKERS ----------
CREATE POLICY "Read blockers for readable team"
  ON public.blockers FOR SELECT USING (
    public.can_read_team((SELECT team_id FROM public.items WHERE id = blockers.item_id))
  );

CREATE POLICY "Insert blocker: team member or admin"
  ON public.blockers FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_team_member((SELECT team_id FROM public.items WHERE id = item_id))
  );

CREATE POLICY "Update blocker: team member or admin"
  ON public.blockers FOR UPDATE USING (
    public.is_admin()
    OR public.is_team_manager((SELECT team_id FROM public.items WHERE id = item_id))
    OR public.is_team_member((SELECT team_id FROM public.items WHERE id = item_id))
  );

CREATE POLICY "Delete blocker: manager or admin"
  ON public.blockers FOR DELETE USING (
    public.is_admin() OR public.is_team_manager((SELECT team_id FROM public.items WHERE id = item_id))
  );

-- ---------- HELP_REQUESTS ----------
CREATE POLICY "Read help_requests for readable team"
  ON public.help_requests FOR SELECT USING (
    public.can_read_team((SELECT team_id FROM public.items WHERE id = help_requests.item_id))
  );

CREATE POLICY "Insert help_request: team member or admin"
  ON public.help_requests FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_team_member((SELECT team_id FROM public.items WHERE id = item_id))
  );

CREATE POLICY "Update help_request: team member or admin"
  ON public.help_requests FOR UPDATE USING (
    public.is_admin() OR public.is_team_member((SELECT team_id FROM public.items WHERE id = help_requests.item_id))
  );

CREATE POLICY "Delete help_request: manager or admin"
  ON public.help_requests FOR DELETE USING (
    public.is_admin() OR public.is_team_manager((SELECT team_id FROM public.items WHERE id = help_requests.item_id))
  );

-- ---------- COMMENTS ----------
CREATE POLICY "Read comments for readable team"
  ON public.comments FOR SELECT USING (
    public.can_read_team((SELECT team_id FROM public.items WHERE id = comments.item_id))
  );

CREATE POLICY "Insert comment: team member or admin"
  ON public.comments FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_team_member((SELECT team_id FROM public.items WHERE id = item_id))
  );

CREATE POLICY "Delete own comment or admin/manager"
  ON public.comments FOR DELETE USING (
    public.is_admin()
    OR author_id = auth.uid()
    OR public.is_team_manager((SELECT team_id FROM public.items WHERE id = comments.item_id))
  );
