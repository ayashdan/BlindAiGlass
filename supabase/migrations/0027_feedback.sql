-- In-app feedback: a place for users to send a message straight to the
-- founder. Regular users can submit and see their own; the admin pages
-- read everything through the service-role client (same pattern as
-- waitlist/users), so no admin-specific policy is needed here.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null default 'other' check (category in ('bug', 'idea', 'other')),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'reviewed')),
  created_at timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "Users can submit their own feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own feedback"
  on feedback for select
  using (auth.uid() = user_id);

create index feedback_created_at_idx on feedback (created_at desc);
