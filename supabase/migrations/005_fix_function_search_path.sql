-- Fix Security Advisor warnings: "Function Search Path Mutable"
-- Set search_path to '' on all SECURITY DEFINER functions to prevent
-- search_path injection attacks.

-- 1. current_user_role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 2. is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT public.current_user_role() = 'admin'
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 3. is_team_manager
CREATE OR REPLACE FUNCTION public.is_team_manager(team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = is_team_manager.team_id
      AND user_id = auth.uid()
      AND member_role = 'manager'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 4. is_team_member
CREATE OR REPLACE FUNCTION public.is_team_member(team_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = is_team_member.team_id
      AND user_id = auth.uid()
      AND member_role IN ('manager', 'member')
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 5. can_read_team
CREATE OR REPLACE FUNCTION public.can_read_team(team_id uuid)
RETURNS boolean AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = can_read_team.team_id AND user_id = auth.uid()
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 6. can_write_team
CREATE OR REPLACE FUNCTION public.can_write_team(team_id uuid)
RETURNS boolean AS $$
  SELECT public.is_admin() OR public.is_team_member(team_id)
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- 7. set_item_last_update_at (trigger function)
CREATE OR REPLACE FUNCTION public.set_item_last_update_at()
RETURNS trigger AS $$
BEGIN
  UPDATE public.items
  SET last_update_at = now(), updated_at = now()
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
