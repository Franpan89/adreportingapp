-- 0005_reports.sql
-- Adds the `reports` table with per-section JSONB columns and RLS policies.
-- Admins CRUD reports for clients they own. Clients can read only published
-- reports for clients they are linked to. Super admins are NOT granted access.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (status in ('draft','published')),
  executive_summary text not null default '',
  top_creatives jsonb not null default '[]'::jsonb,
  spend_vs_results jsonb not null default '[]'::jsonb,
  audiences jsonb not null default '[]'::jsonb,
  social_growth jsonb not null default '[]'::jsonb,
  recommendations text not null default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create index reports_client_id_idx on public.reports(client_id);
create index reports_status_idx on public.reports(status);

create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.update_updated_at();

alter table public.reports enable row level security;

-- Admin: full CRUD for reports of clients they created
create policy reports_admin_all on public.reports
  for all
  using (
    exists (
      select 1 from public.clients c
      where c.id = reports.client_id and c.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.clients c
      where c.id = reports.client_id and c.created_by = auth.uid()
    )
  );

-- Client: read-only on published reports for clients they're linked to
create policy reports_client_select on public.reports
  for select
  using (
    status = 'published'
    and exists (
      select 1 from public.client_users cu
      where cu.client_id = reports.client_id and cu.user_id = auth.uid()
    )
  );
