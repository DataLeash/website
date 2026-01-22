-- ============================================
-- DataLeash iOS App - Complete Database Setup
-- ============================================

-- 1. Create public.users table (synced with auth.users for profile lookup)
-- This table allows the iOS app to search users by email for friend requests

create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on users
alter table public.users enable row level security;

-- Users can view all public profiles (needed for friend search)
create policy "Public profiles are viewable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Auto-create user profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.users.full_name);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill existing users
insert into public.users (id, email, full_name)
select 
  id, 
  email,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
from auth.users
on conflict (id) do nothing;

-- ============================================
-- 2. Create friendships table
-- ============================================

create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  friend_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Enable RLS
alter table public.friendships enable row level security;

-- Policies

-- 1. View own friendships (either as sender or receiver)
create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- 2. Send friend request (insert)
create policy "Users can insert friendship request"
  on public.friendships for insert
  with check (auth.uid() = user_id);

-- 3. Accept friend request (update status) - only the receiver can update
create policy "Users can update their own received requests"
  on public.friendships for update
  using (auth.uid() = friend_id);

-- 4. Delete friendship (unfriend/cancel)
create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- ============================================
-- Done! Your iOS app can now:
-- 1. Search users by email (via public.users)
-- 2. Send/accept friend requests (via friendships)
-- ============================================
