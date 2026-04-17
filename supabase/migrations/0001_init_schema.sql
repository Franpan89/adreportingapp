-- =====================================================
-- AdPulse — Initial Schema
-- =====================================================

-- ---- profiles ----
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('admin', 'client')),
  full_name    text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---- clients ----
create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  logo_url     text,
  timezone     text not null default 'UTC',
  is_active    boolean not null default true,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);


-- ---- client_users ----
create table public.client_users (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(client_id, user_id)
);


-- ---- metric_definitions ----
create table public.metric_definitions (
  key          text primary key,
  label        text not null,
  description  text,
  unit         text check (unit in ('currency','percent','integer','decimal','ratio')),
  channels     text[] not null,
  is_derived   boolean default false,
  formula      text
);


-- ---- client_metric_config ----
create table public.client_metric_config (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  metric_key     text not null references public.metric_definitions(key),
  is_visible     boolean not null default true,
  display_order  integer not null default 0,
  show_in_kpi    boolean not null default false,
  show_in_table  boolean not null default true,
  show_in_chart  boolean not null default false,
  updated_at     timestamptz default now(),
  unique(client_id, metric_key)
);


-- ---- channel_credentials ----
create table public.channel_credentials (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.clients(id) on delete cascade,
  channel          text not null check (channel in ('meta', 'google', 'tiktok')),
  credentials_enc  text not null,
  is_active        boolean not null default true,
  last_synced_at   timestamptz,
  sync_status      text check (sync_status in ('idle','syncing','success','error')),
  sync_error       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique(client_id, channel)
);


-- ---- campaigns ----
create table public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  channel       text not null check (channel in ('meta', 'google', 'tiktok')),
  external_id   text not null,
  name          text not null,
  status        text,
  objective     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(client_id, channel, external_id)
);


-- ---- daily_stats ----
create table public.daily_stats (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients(id) on delete cascade,
  campaign_id         uuid not null references public.campaigns(id) on delete cascade,
  channel             text not null check (channel in ('meta', 'google', 'tiktok')),
  date                date not null,
  -- Raw metrics
  impressions         bigint,
  clicks              bigint,
  spend               numeric(14,4),
  conversions         numeric(14,4),
  conversions_value   numeric(14,4),
  reach               bigint,
  video_views         bigint,
  video_completions   bigint,
  likes               bigint,
  shares              bigint,
  comments            bigint,
  link_clicks         bigint,
  -- Stored derived (for query performance)
  ctr                 numeric(10,6),
  cpc                 numeric(10,4),
  cpm                 numeric(10,4),
  roas                numeric(10,4),
  created_at          timestamptz default now(),
  unique(campaign_id, date)
);

create index idx_daily_stats_client_date  on public.daily_stats(client_id, date desc);
create index idx_daily_stats_campaign     on public.daily_stats(campaign_id, date desc);
create index idx_daily_stats_channel_date on public.daily_stats(client_id, channel, date desc);


-- ---- sync_logs ----
create table public.sync_logs (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id),
  channel        text not null,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  status         text check (status in ('running','success','partial','error')),
  rows_upserted  integer,
  error_detail   text
);
