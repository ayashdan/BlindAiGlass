-- ============================================================================
--  Forge — denser achievement catalog: fills the big gaps between existing
--  milestones (1 workout -> 7-day streak -> 30-day streak) and adds
--  achievements for the new PR and muscle-group-variety systems.
--  Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================================

-- Renumber existing rows so the new ones slot in at sensible points.
update public.achievements set sort_order = 3 where key = 'warrior_7';
update public.achievements set sort_order = 4 where key = 'beast_30';
update public.achievements set sort_order = 5 where key = 'workouts_100';
update public.achievements set sort_order = 6 where key = 'level_10';
update public.achievements set sort_order = 8 where key = 'level_50';

insert into public.achievements (key, name, description, icon, xp_reward, sort_order) values
  ('getting_started', 'Getting Started', 'Complete 3 workouts.',                  '🔰', 30,  2),
  ('level_25',        'Halfway Hero',    'Reach Level 25.',                       '🌟', 150, 7),
  ('first_pr',        'New Best',        'Beat one of your own personal records.', '🏆', 75,  9),
  ('well_rounded',    'Well Rounded',    'Train 5 different muscle groups.',       '🎨', 50,  10)
on conflict (key) do nothing;
