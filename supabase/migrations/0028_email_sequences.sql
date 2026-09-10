-- Tracking columns for the email drip system (welcome, 7-day inactivity,
-- feature education) so the daily cron knows what's already been sent and
-- doesn't repeat itself. Nullable timestamps double as "never sent" —
-- no separate boolean flags needed.

alter table profiles
  add column welcome_email_sent_at timestamptz,
  add column inactivity_email_sent_at timestamptz,
  add column education_email_step integer not null default 0,
  add column education_email_sent_at timestamptz;
