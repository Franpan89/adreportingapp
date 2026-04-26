-- supabase/migrations/0006_agency_meta_connection.sql

create table public.agency_meta_connections (
  id               uuid primary key default gen_random_uuid(),
  admin_user_id    uuid not null references auth.users(id) on delete cascade,
  access_token_enc text not null,
  connected_at     timestamptz not null default now(),
  verified_at      timestamptz,
  unique(admin_user_id)
);

-- Only the owner can read/write their row
alter table public.agency_meta_connections enable row level security;

create policy "owner_all" on public.agency_meta_connections
  for all using (auth.uid() = admin_user_id)
  with check (auth.uid() = admin_user_id);
