-- Allow any authenticated user to read the list of teams (names) so the team
-- dropdown can be populated. Data (items, objectives, etc.) remains restricted
-- by existing RLS via can_read_team(team_id).
CREATE POLICY "Authenticated can read team list"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);
