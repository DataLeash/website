-- ============================================
-- DataLeash Chat - Messages Table
-- ============================================

-- Create messages table for 1:1 chat
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  content text,
  file_id uuid, -- Optional file attachment (references your files table if exists)
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies

-- Users can view their own messages (sent or received)
drop policy if exists "Users can view own messages" on public.messages;
create policy "Users can view own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can send messages
drop policy if exists "Users can send messages" on public.messages;
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Users can update messages they sent (for read receipts or edits)
drop policy if exists "Users can update own sent messages" on public.messages;
create policy "Users can update own sent messages"
  on public.messages for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can delete messages they sent
drop policy if exists "Users can delete own sent messages" on public.messages;
create policy "Users can delete own sent messages"
  on public.messages for delete
  using (auth.uid() = sender_id);

-- Index for faster queries
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_created on public.messages(created_at desc);

-- ============================================
-- Enable Realtime for messages
-- ============================================
alter publication supabase_realtime add table public.messages;
