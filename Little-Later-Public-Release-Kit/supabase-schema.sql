-- ============================================================================
-- LITTLE LATER v1.1 — SUPABASE CLOUD SYNC & COLLABORATIVE FOLDERS SCHEMA
-- Paste this into your Supabase Project -> SQL Editor -> Run
-- ============================================================================

-- 1. User Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  updated_at timestamptz default now()
);

-- 2. Folders (Personal by default; Collaborative when is_collab = true)
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text default 'folder',
  icon text default 'folder',
  is_collab boolean default false,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now()
);

-- 3. Folder Collaborators (Google Keep Style Members)
create table if not exists public.folder_members (
  folder_id uuid references public.folders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text not null,
  user_email text,
  joined_at timestamptz default now(),
  primary key (folder_id, user_id)
);

-- 4. Saved Ideas, Notes, Reminders & To-Do Lists
create table if not exists public.items (
  id text primary key,
  folder_id uuid references public.folders(id) on delete cascade,
  folder_name text not null,
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null default 'You',
  kind text not null default 'link', -- 'link' | 'reminder' | 'todoList' | 'note'
  url text default '',
  source text default '',
  title text default '',
  thumbnail text default '',
  note text default '',
  reminder_at bigint default 0,
  due_at bigint default 0,
  tasks jsonb default '[]'::jsonb,
  opted_out_by jsonb default '[]'::jsonb, -- Per-user reminder opt-out list
  saved_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Enable Realtime on folders, folder_members, and items
alter publication supabase_realtime add table public.folders;
alter publication supabase_realtime add table public.folder_members;
alter publication supabase_realtime add table public.items;
