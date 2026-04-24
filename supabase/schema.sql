-- ============================================================
-- Blu Sky Pipeline — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Profiles table (extends auth.users)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  email       text,
  created_at  timestamptz default now()
);

-- Pipeline config per user (stores stage names)
create table public.pipeline_config (
  id      uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stages  jsonb default '["Prospect","Qualified","Proposal","Negotiation","Closed"]'::jsonb,
  updated_at timestamptz default now()
);

-- Deals table
create table public.deals (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  stage       integer default 0,
  name        text not null,
  business    text,
  phone       text,
  email       text,
  value       numeric default 0,
  deal_type   text,
  notes       jsonb default '[]'::jsonb,
  next_step   jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.pipeline_config enable row level security;
alter table public.deals           enable row level security;

-- Profiles: users can only read/write their own profile
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Pipeline config: users can only access their own config
create policy "config_select" on public.pipeline_config
  for select using (auth.uid() = user_id);

create policy "config_insert" on public.pipeline_config
  for insert with check (auth.uid() = user_id);

create policy "config_update" on public.pipeline_config
  for update using (auth.uid() = user_id);

-- Deals: users can only access their own deals
create policy "deals_select" on public.deals
  for select using (auth.uid() = user_id);

create policy "deals_insert" on public.deals
  for insert with check (auth.uid() = user_id);

create policy "deals_update" on public.deals
  for update using (auth.uid() = user_id);

create policy "deals_delete" on public.deals
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Updated_at trigger for deals
-- ============================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at
  before update on public.deals
  for each row execute procedure public.set_updated_at();
