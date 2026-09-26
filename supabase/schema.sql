-- ============================================================
-- AIverse — Complete Fixed Schema
-- Drop existing schema first:
--   drop schema public cascade;
--   create schema public;
--   grant usage on schema public to anon, authenticated, service_role;
--   grant all on schema public to postgres;
-- Then run this file.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text default '',
  status text default 'online',
  last_seen timestamptz default now(),
  theme text default 'dark',
  is_premium boolean default false,
  premium_plan text default 'free',
  is_admin boolean default false,
  is_suspended boolean default false,
  show_online boolean default true,
  show_last_seen boolean default true,
  allow_friend_requests boolean default true,
  notify_messages boolean default true,
  notify_friends boolean default true,
  notify_likes boolean default true,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references profiles(id) on delete cascade,
  plan text default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text default 'active',
  current_period_end timestamptz,
  start_date timestamptz default now(),
  end_date timestamptz
);

create table admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles(id),
  action text not null,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create table friend_requests (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now(),
  unique (sender_id, receiver_id)
);

create table friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, friend_id)
);

create table blocked_users (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, blocked_id)
);

create table chats (
  id uuid primary key default uuid_generate_v4(),
  is_group boolean default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table chat_members (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  unique (chat_id, user_id)
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text,
  message_type text default 'text',
  file_url text,
  seen_by uuid[] default '{}',
  deleted boolean default false,
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key references chats(id) on delete cascade,
  name text not null,
  description text default '',
  avatar_url text,
  created_at timestamptz default now()
);

create table statuses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  content_type text default 'text',
  content_url text,
  caption text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

create table status_views (
  id uuid primary key default uuid_generate_v4(),
  status_id uuid references statuses(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique (status_id, viewer_id)
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  content text,
  media_url text,
  created_at timestamptz default now()
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

create table ai_characters (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  role text,
  personality text,
  speaking_style text,
  is_default boolean default false,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  character_id uuid references ai_characters(id) on delete cascade,
  created_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  character_id uuid references ai_characters(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create table ai_memory (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  character_id uuid references ai_characters(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

create table storage_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  file_url text not null,
  file_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_profiles_username on profiles(username);
create index idx_messages_chat_id on messages(chat_id);
create index idx_messages_created_at on messages(created_at);
create index idx_ai_messages_user_character on ai_messages(user_id, character_id);
create index idx_friends_user_id on friends(user_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);
create index idx_posts_created_at on posts(created_at);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- HELPER FUNCTION (non-recursive membership check)
-- ============================================================
create or replace function is_chat_member(p_chat_id uuid, p_user_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from chat_members
    where chat_id = p_chat_id and user_id = p_user_id
  );
$$;

-- ============================================================
-- GRANTS (critical — fixes 403 errors)
-- ============================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table admin_logs enable row level security;
alter table friend_requests enable row level security;
alter table friends enable row level security;
alter table blocked_users enable row level security;
alter table chats enable row level security;
alter table chat_members enable row level security;
alter table messages enable row level security;
alter table groups enable row level security;
alter table statuses enable row level security;
alter table status_views enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table ai_characters enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table ai_memory enable row level security;
alter table notifications enable row level security;
alter table storage_files enable row level security;

-- PROFILES
create policy "profiles_select" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- SUBSCRIPTIONS
create policy "subscriptions_select" on subscriptions for select using (auth.uid() = user_id);

-- ADMIN LOGS
create policy "admin_logs_select" on admin_logs for select
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- FRIEND REQUESTS
create policy "friend_requests_select" on friend_requests for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "friend_requests_insert" on friend_requests for insert
  with check (auth.uid() = sender_id);
create policy "friend_requests_update" on friend_requests for update
  using (auth.uid() = receiver_id or auth.uid() = sender_id);
create policy "friend_requests_delete" on friend_requests for delete
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- FRIENDS
create policy "friends_all" on friends for all
  using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- BLOCKED USERS
create policy "blocked_all" on blocked_users for all using (auth.uid() = user_id);

-- CHATS
create policy "chats_select" on chats for select
  using (is_chat_member(id, auth.uid()) or auth.uid() = created_by);
create policy "chats_insert" on chats for insert with check (auth.uid() = created_by);
create policy "chats_update" on chats for update using (auth.uid() = created_by);
create policy "chats_delete" on chats for delete using (auth.uid() = created_by);

-- CHAT MEMBERS
create policy "chat_members_select" on chat_members for select
  using (auth.uid() = user_id or is_chat_member(chat_id, auth.uid()));
create policy "chat_members_insert" on chat_members for insert
  with check (auth.uid() = user_id or is_chat_member(chat_id, auth.uid()));
create policy "chat_members_update" on chat_members for update
  using (is_chat_member(chat_id, auth.uid()));
create policy "chat_members_delete" on chat_members for delete
  using (auth.uid() = user_id or is_chat_member(chat_id, auth.uid()));

-- MESSAGES
create policy "messages_select" on messages for select
  using (is_chat_member(chat_id, auth.uid()));
create policy "messages_insert" on messages for insert
  with check (auth.uid() = sender_id and is_chat_member(chat_id, auth.uid()));
create policy "messages_update" on messages for update using (auth.uid() = sender_id);
create policy "messages_delete" on messages for delete using (auth.uid() = sender_id);

-- GROUPS
create policy "groups_select" on groups for select using (is_chat_member(id, auth.uid()));
create policy "groups_insert" on groups for insert
  with check (exists (select 1 from chats where id = groups.id and created_by = auth.uid()));
create policy "groups_update" on groups for update using (is_chat_member(id, auth.uid()));

-- STATUSES
create policy "statuses_select" on statuses for select
  using (auth.uid() = user_id or exists (
    select 1 from friends where user_id = auth.uid() and friend_id = statuses.user_id
  ));
create policy "statuses_insert" on statuses for insert with check (auth.uid() = user_id);
create policy "statuses_delete" on statuses for delete using (auth.uid() = user_id);

-- STATUS VIEWS
create policy "status_views_select" on status_views for select
  using (auth.uid() = viewer_id or exists (
    select 1 from statuses where id = status_id and user_id = auth.uid()
  ));
create policy "status_views_insert" on status_views for insert with check (auth.uid() = viewer_id);

-- POSTS
create policy "posts_select" on posts for select using (auth.role() = 'authenticated');
create policy "posts_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_delete" on posts for delete using (auth.uid() = user_id);

-- COMMENTS
create policy "comments_select" on comments for select using (auth.role() = 'authenticated');
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

-- LIKES
create policy "likes_select" on likes for select using (auth.role() = 'authenticated');
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

-- AI CHARACTERS
create policy "ai_characters_select" on ai_characters for select
  using (is_default = true or owner_id is null or owner_id = auth.uid() or is_public = true);
create policy "ai_characters_insert" on ai_characters for insert with check (owner_id = auth.uid());
create policy "ai_characters_update" on ai_characters for update using (owner_id = auth.uid());
create policy "ai_characters_delete" on ai_characters for delete using (owner_id = auth.uid());

-- AI DATA
create policy "ai_conversations_all" on ai_conversations for all using (auth.uid() = user_id);
create policy "ai_messages_all" on ai_messages for all using (auth.uid() = user_id);
create policy "ai_memory_all" on ai_memory for all using (auth.uid() = user_id);

-- NOTIFICATIONS
create policy "notifications_all" on notifications for all using (auth.uid() = user_id);

-- STORAGE FILES
create policy "storage_files_all" on storage_files for all using (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================
-- Required for the Chat page's postgres_changes subscription to fire.
-- Without this, new messages only appear after a manual reload.
alter publication supabase_realtime add table messages;

-- ============================================================
-- SEED: default AI characters
-- ============================================================
insert into ai_characters (name, role, personality, speaking_style, is_default) values
  ('AI Detective', 'Mystery solver', 'Sharp, curious, asks probing questions', 'Methodical and inquisitive', true),
  ('Study Buddy', 'Study companion', 'Patient and encouraging', 'Clear, structured, quizzes the user', true),
  ('Career Mentor', 'Career advisor', 'Direct and pragmatic', 'Professional, gives concrete next steps', true),
  ('Life Coach', 'Personal improvement guide', 'Warm but holds you accountable', 'Reflective, asks powerful questions', true),
  ('Future You', 'User''s future self', 'Wise, a little nostalgic', 'Speaks from experience, calm', true),
  ('Funny Friend', 'Casual companion', 'Witty and easygoing', 'Casual, humorous, no agenda', true);

-- ============================================================
-- Fix existing users (run after schema if you already have accounts)
-- ============================================================
insert into profiles (id, username)
select id, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;

-- ============================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Media Public Read" on storage.objects for select using (bucket_id = 'media');
create policy "Media Authenticated Insert" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "Media Authenticated Update" on storage.objects for update using (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "Media Authenticated Delete" on storage.objects for delete using (bucket_id = 'media' and auth.role() = 'authenticated');
