-- =====================================================
-- wmm-client-reporting — Row Level Security Policies
-- =====================================================

-- Helper function: check if current user is admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Helper function: check if user can access a client
create or replace function public.can_access_client(p_client_id uuid)
returns boolean language sql security definer as $$
  select
    public.is_admin()
    or exists (
      select 1 from public.client_users
      where client_users.client_id = p_client_id
        and client_users.user_id = auth.uid()
    );
$$;

-- ---- profiles ----
alter table public.profiles enable row level security;

create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: admin read all"
  on public.profiles for select
  using (public.is_admin());

-- ---- clients ----
alter table public.clients enable row level security;

create policy "clients: admin full access"
  on public.clients for all
  using (public.is_admin());

create policy "clients: client read own"
  on public.clients for select
  using (public.can_access_client(id));

-- ---- client_users ----
alter table public.client_users enable row level security;

create policy "client_users: admin full access"
  on public.client_users for all
  using (public.is_admin());

create policy "client_users: own membership read"
  on public.client_users for select
  using (user_id = auth.uid());

-- ---- metric_definitions (public read) ----
alter table public.metric_definitions enable row level security;

create policy "metric_definitions: anyone can read"
  on public.metric_definitions for select
  using (true);

create policy "metric_definitions: admin can write"
  on public.metric_definitions for all
  using (public.is_admin());

-- ---- client_metric_config ----
alter table public.client_metric_config enable row level security;

create policy "metric_config: admin full access"
  on public.client_metric_config for all
  using (public.is_admin());

create policy "metric_config: client read own"
  on public.client_metric_config for select
  using (public.can_access_client(client_id));

-- ---- channel_credentials (admin only) ----
alter table public.channel_credentials enable row level security;

create policy "credentials: admin only"
  on public.channel_credentials for all
  using (public.is_admin());

-- ---- campaigns ----
alter table public.campaigns enable row level security;

create policy "campaigns: admin full access"
  on public.campaigns for all
  using (public.is_admin());

create policy "campaigns: client read own"
  on public.campaigns for select
  using (public.can_access_client(client_id));

-- ---- daily_stats ----
alter table public.daily_stats enable row level security;

create policy "daily_stats: admin full access"
  on public.daily_stats for all
  using (public.is_admin());

create policy "daily_stats: client read own"
  on public.daily_stats for select
  using (public.can_access_client(client_id));

-- ---- sync_logs (admin only) ----
alter table public.sync_logs enable row level security;

create policy "sync_logs: admin only"
  on public.sync_logs for all
  using (public.is_admin());
