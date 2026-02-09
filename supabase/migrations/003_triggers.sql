-- Trigger: update items.last_update_at when item_updates row is inserted
CREATE OR REPLACE FUNCTION public.set_item_last_update_at()
RETURNS trigger AS $$
BEGIN
  UPDATE public.items
  SET last_update_at = now(), updated_at = now()
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_item_updates_last_update ON public.item_updates;
CREATE TRIGGER tr_item_updates_last_update
  AFTER INSERT ON public.item_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_item_last_update_at();

-- Optional: auto-create profile on first signup (via trigger on auth.users)
-- Supabase doesn't expose auth.users to RLS in public schema; use Database Webhook or client-side upsert.
-- We use client-side upsert after login (see auth.ts).
