-- OKR Ops Tracker - Initial schema
-- Enums via CHECK constraints (text)

-- Profiles: links auth.users to app role
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams (gerencias)
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Team membership with role
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'member' CHECK (member_role IN ('manager', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Periods (e.g. Q1 2026)
CREATE TABLE IF NOT EXISTS public.periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Objectives per team & period
CREATE TABLE IF NOT EXISTS public.objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES public.periods(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items (main unit): initiative/OKR-like item
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  title text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'discovery' CHECK (status IN (
    'discovery', 'design', 'execution', 'validation', 'ready_to_deploy',
    'deploying', 'in_production', 'paused', 'at_risk'
  )),
  status_reason text,
  blockers_summary text,
  help_needed_summary text,
  next_step text,
  target_date date,
  last_update_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Immutable history of item updates (snapshot on each "Save update")
CREATE TABLE IF NOT EXISTS public.item_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Blockers (structured)
CREATE TABLE IF NOT EXISTS public.blockers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_do')),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  eta date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Help requests
CREATE TABLE IF NOT EXISTS public.help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('decision', 'escalation', 'budget', 'alignment', 'resource', 'other')),
  detail text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_objectives_team_id ON public.objectives(team_id);
CREATE INDEX IF NOT EXISTS idx_objectives_period_id ON public.objectives(period_id);
CREATE INDEX IF NOT EXISTS idx_items_team_id ON public.items(team_id);
CREATE INDEX IF NOT EXISTS idx_items_objective_id ON public.items(objective_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_owner_id ON public.items(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_target_date ON public.items(target_date);
CREATE INDEX IF NOT EXISTS idx_items_last_update_at ON public.items(last_update_at);
CREATE INDEX IF NOT EXISTS idx_item_updates_item_id ON public.item_updates(item_id);
CREATE INDEX IF NOT EXISTS idx_blockers_item_id ON public.blockers(item_id);
CREATE INDEX IF NOT EXISTS idx_blockers_status ON public.blockers(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_item_id ON public.help_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_comments_item_id ON public.comments(item_id);
