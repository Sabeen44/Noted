-- =============================================================================
-- Noted — full schema with Row-Level Security
-- Run this against a fresh Supabase project (SQL editor or supabase db reset).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at column
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- One row per auth.users entry; created automatically on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure set_updated_at();

-- Populate profile on new user sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- Table: notebooks
-- ---------------------------------------------------------------------------
create table if not exists public.notebooks (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Untitled Notebook',
  color       text not null default '#7F77DD',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notebooks_owner_id_idx on public.notebooks(owner_id);

create trigger trg_notebooks_updated_at
  before update on public.notebooks
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id           uuid primary key default uuid_generate_v4(),
  notebook_id  uuid not null references public.notebooks(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  title        text not null default 'Untitled',
  content      jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists notes_owner_id_idx       on public.notes(owner_id);
create index if not exists notes_notebook_id_idx    on public.notes(notebook_id);
create index if not exists notes_updated_at_idx     on public.notes(updated_at desc);

create trigger trg_notes_updated_at
  before update on public.notes
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: note_shares
-- ---------------------------------------------------------------------------
create table if not exists public.note_shares (
  id                   uuid primary key default uuid_generate_v4(),
  note_id              uuid not null references public.notes(id) on delete cascade,
  shared_with_user_id  uuid not null references auth.users(id) on delete cascade,
  permission           text not null check (permission in ('read', 'edit')) default 'read',
  created_at           timestamptz not null default now(),
  unique (note_id, shared_with_user_id)
);

create index if not exists note_shares_user_idx on public.note_shares(shared_with_user_id);
create index if not exists note_shares_note_idx on public.note_shares(note_id);

-- =============================================================================
-- Row-Level Security
-- =============================================================================

alter table public.profiles   enable row level security;
alter table public.notebooks  enable row level security;
alter table public.notes      enable row level security;
alter table public.note_shares enable row level security;

-- ---------------------------------------------------------------------------
-- profiles policies
-- ---------------------------------------------------------------------------

-- Users can read their own profile
create policy "profiles: owner select"
  on public.profiles for select
  using (id = auth.uid());

-- Users can read profiles of people who share notes with them (needed for share UI)
create policy "profiles: shared-note participants select"
  on public.profiles for select
  using (
    id in (
      select owner_id from public.notes
      where id in (
        select note_id from public.note_shares
        where shared_with_user_id = auth.uid()
      )
    )
    or
    id in (
      select shared_with_user_id from public.note_shares
      where note_id in (
        select id from public.notes where owner_id = auth.uid()
      )
    )
  );

-- Users can update only their own profile
create policy "profiles: owner update"
  on public.profiles for update
  using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- notebooks policies
-- ---------------------------------------------------------------------------

-- Owners can do anything with their notebooks
create policy "notebooks: owner all"
  on public.notebooks for all
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notes policies
-- ---------------------------------------------------------------------------

-- Owners can do anything with their notes
create policy "notes: owner all"
  on public.notes for all
  using (owner_id = auth.uid());

-- Users with a share entry can read the note
create policy "notes: shared select"
  on public.notes for select
  using (
    id in (
      select note_id from public.note_shares
      where shared_with_user_id = auth.uid()
    )
  );

-- Users with 'edit' permission can update the note (title + content)
create policy "notes: shared edit update"
  on public.notes for update
  using (
    id in (
      select note_id from public.note_shares
      where shared_with_user_id = auth.uid()
        and permission = 'edit'
    )
  );

-- ---------------------------------------------------------------------------
-- note_shares policies
-- ---------------------------------------------------------------------------

-- Note owners can manage shares for their notes
create policy "note_shares: owner all"
  on public.note_shares for all
  using (
    note_id in (
      select id from public.notes where owner_id = auth.uid()
    )
  );

-- Shared users can view their own share rows (needed to load shared notes)
create policy "note_shares: recipient select"
  on public.note_shares for select
  using (shared_with_user_id = auth.uid());
