-- ============================================================================
--  Forge — cosmetic unlocks (avatar border + title). Deterministic, tied to
--  achievements you've already earned (see lib/game/cosmetics.ts) — no new
--  catalog table needed, just what's equipped.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.profiles
  add column if not exists equipped_border text,
  add column if not exists equipped_title  text;
