-- ============================================================================
--  Forge — muscle-group workout logging (replaces the old Push/Pull/Legs-only
--  single `type` column with a multi-select `muscle_groups` array, so a
--  workout can target any combination of muscle groups).
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

alter table public.workouts
  add column if not exists muscle_groups text[] not null default '{}';

-- The old single `type` column is no longer written to by the app, but we
-- keep it around (nullable now) so existing rows/history aren't lost.
alter table public.workouts
  alter column type drop not null;

create index if not exists workouts_muscle_groups_idx
  on public.workouts using gin (muscle_groups);
