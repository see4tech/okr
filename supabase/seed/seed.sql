-- Seed: teams, one period, optional demo objective + item
-- Run after migrations. Use a user with role 'admin' to access Director Dashboard.

INSERT INTO public.teams (id, name) VALUES
  (gen_random_uuid(), 'Gerencia Sistemas Hospitalidad'),
  (gen_random_uuid(), 'Gerencia Sistemas Aeroportuarios'),
  (gen_random_uuid(), 'Gerencia CCSAP'),
  (gen_random_uuid(), 'Gerencia Sistemas GDL'),
  (gen_random_uuid(), 'Gerencia Infraestructura GDL'),
  (gen_random_uuid(), 'Gerencia de Desarrollo de Aplicaciones'),
  (gen_random_uuid(), 'Gerencia Infraestructura y Telecomunicaciones')
ON CONFLICT (name) DO NOTHING;

-- Single period Q1 2026
INSERT INTO public.periods (id, name, start_date, end_date)
SELECT gen_random_uuid(), 'Q1 2026', '2026-01-01'::date, '2026-03-31'::date
WHERE NOT EXISTS (SELECT 1 FROM public.periods WHERE name = 'Q1 2026');

-- Optional: one sample objective and item for first team (for demo)
-- Uncomment and run if you want demo data (replace TEAM_UUID with actual team id from teams)
/*
DO $$
DECLARE
  v_team_id uuid;
  v_period_id uuid;
  v_objective_id uuid;
  v_item_id uuid;
BEGIN
  SELECT id INTO v_team_id FROM public.teams LIMIT 1;
  SELECT id INTO v_period_id FROM public.periods WHERE name = 'Q1 2026' LIMIT 1;
  IF v_team_id IS NOT NULL AND v_period_id IS NOT NULL THEN
    INSERT INTO public.objectives (team_id, period_id, title)
    VALUES (v_team_id, v_period_id, 'Sample objective Q1 2026')
    RETURNING id INTO v_objective_id;
    INSERT INTO public.items (team_id, objective_id, title, status, next_step, target_date)
    VALUES (v_team_id, v_objective_id, 'Sample initiative', 'execution', 'Complete design review', '2026-02-28')
    RETURNING id INTO v_item_id;
  END IF;
END $$;
*/
