@AGENTS.md

# wmm-client-reporting — Claude Code Conventions

> **Centralized client performance dashboard for Web My Money** — Meta, Google Ads, GA4, Search Console, TikTok Ads in one app.
> Consolidates the connector logic from wmm-client-intel (Firebase Cloud Functions), octo-functions (Google Ads OAuth), and wmm-influ-campaigns (Meta v21.0 sync) into a single Supabase + Vercel app.
> Standards derived from [wmm-agents](https://github.com/Web-My-Money/wmm-agents).

## Project
- GitHub repo: `Web-My-Money/wmm-client-reporting`
- **No Firebase** — Supabase + Vercel only
- Supabase project: shared WMM hub (table prefix `cr_` to namespace this app's domain)
- Runtime: Node.js 22 (`.nvmrc` → `22`)
- Package manager: **npm only** — never Yarn, pnpm, or Bun
- Port: **3020** (local dev)
- Owner: Fran + Pancho

## Channels

| Channel key   | Source            | API version              | Auth pattern                          |
|---------------|-------------------|--------------------------|---------------------------------------|
| `meta`        | `connectors/meta` | Graph API v21.0          | Per-client token, agency-token fallback |
| `google_ads`  | `connectors/google-ads` | Google Ads API v17 | OAuth2 refresh-token flow             |
| `ga4`         | `connectors/ga4`  | Data API v1beta          | Google service account JSON           |
| `gsc`         | `connectors/gsc`  | Search Console v1        | Google service account JSON (same as GA4) |
| `tiktok`      | `connectors/tiktok` | Business API v1.3      | App ID + secret + access token        |
| `google` (legacy) | inline            | —                    | Pre-consolidation Google channel — slated for migration to `google_ads` |

## Database — `cr_` prefix

This app shares the WMM Supabase project with `wmm-website` (`leads`, `appointments`, …) and `wmm-legacy-leads` (`scrape_jobs`, `legacy_leads`, …). Every reporting table is prefixed `cr_` to keep namespaces disjoint.

| Table                       | Purpose                                            |
|-----------------------------|----------------------------------------------------|
| `cr_clients`                | Client registry — id, name, slug, timezone         |
| `cr_client_users`           | Client → user portal access mapping                |
| `cr_channel_credentials`    | Encrypted API tokens per client + channel          |
| `cr_campaigns`              | Campaign snapshots — id, client, channel, ext_id  |
| `cr_daily_stats`            | Per-campaign per-day metrics (raw + derived)       |
| `cr_sync_logs`              | Sync job history                                   |
| `cr_metric_definitions`     | Metric catalog — key, label, unit, channels        |
| `cr_client_metric_config`   | Per-client metric visibility / order               |
| `cr_reports`                | Client-facing generated reports (draft/published) |

**Not prefixed (intentional):**
- `profiles` — auth cross-cutting, used by Supabase trigger
- `licenses`, `agency_meta_connections` — SaaS-bound, slated for split into a separate app

## SaaS surface (do not extend on this branch)
The Super Admin panel (`/superadmin/*`), license management, license addons, and the agency Meta connection are SaaS concerns that will move to a separate app. **Do not add features to those routes here.** Reporting work goes in the admin and client groups.

## Architecture
```
wmm-client-reporting/
  src/
    app/
      (admin)/admin/                # Admin role routes — clients, metrics, reportes, settings, story-engine
      (client)/dashboard, reportes  # Client portal — read-only, RLS-scoped
      (superadmin)/superadmin/      # SaaS — DO NOT EXTEND, slated for split
      (auth)/login, callback        # Supabase auth flow
      api/
        sync/[channel]/route.ts     # Sync orchestrator — calls connectors, writes cr_* tables
        reports/[clientId]/route.ts # Aggregate cr_daily_stats + period comparison
        client-reports/             # Generated client reports CRUD
        clients/                    # Client CRUD
        agency/meta-connection/     # SaaS — slated for split
        licenses/, superadmin/      # SaaS — slated for split
    components/
      ui/                           # shadcn-style primitives
      dashboard/                    # DashboardShell, ChannelTabs, CampaignTable
      admin/, superadmin/, reports/, layout/
    lib/
      connectors/                   # Pure data-fetching modules — no Supabase, no UI
        meta.ts                     # Graph API v21.0 + agency token verify
        ga4.ts                      # @google-analytics/data
        gsc.ts                      # googleapis (Search Console v1)
        tiktok.ts                   # Business API v1.3 raw fetch
        google-ads.ts               # OAuth2 + GAQL searchStream
      metrics/
        definitions.ts              # METRIC_DEFINITIONS + DEFAULT_METRIC_CONFIG (Spanish labels)
        blended.ts                  # blendMetrics() across paid + organic channels
      supabase/                     # client + server + auth helpers
      data/, reports/               # mock data for unconfigured Supabase
      utils/encrypt.ts              # AES encrypt/decrypt for stored tokens
  supabase/migrations/              # 0001 → 0009
```

## Architecture layers (follow this order)
1. `src/types/index.ts` — Channel, MetricTotals, ClientReport, etc.
2. `src/lib/connectors/*.ts` — pure connector modules (no DB, no auth)
3. `src/lib/supabase/*.ts` — Supabase IO services, USE_MOCK fallback
4. `src/app/api/*/route.ts` — orchestrators: auth, validate, call connector, upsert to cr_* tables
5. `src/app/**/page.tsx` — thin renderers, server components by default

## Connectors are pure
Each `lib/connectors/<channel>.ts` exports `sync<Channel>(creds, since, until)` returning normalized day-stats. No Supabase, no auth, no DOM, no Next.js. The sync route handles all those concerns.

## WMM Brand Standards
- Primary: Teal `#00C4B4`
- Accent: Violet `#7C3AED`
- Background: Dark `#080b14` (oklch(0.13 0.005 260))
- Card surface: `#0f172a` (oklch(0.17 0.005 260))
- Theme: Dark mode first
- UI language: Spanish (existing convention — labels, error messages, page titles)

## Naming Conventions
| Entity      | Convention      | Example                        |
|-------------|-----------------|--------------------------------|
| Files       | `kebab-case`    | `meta.ts`, `campaign-card.tsx` |
| Components  | `PascalCase`    | `CampaignTable`, `DashboardShell` |
| DB tables   | `cr_snake_case` | `cr_clients`, `cr_daily_stats` |
| DB fields   | `snake_case`    | `client_id`, `created_at`      |
| Env vars    | `ALL_CAPS`      | `META_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY` |

## Environment Variables
See `.env.example`. Server-side credential vars are never `NEXT_PUBLIC_`.

## Running Locally
```bash
npm install
cp .env.example .env.local   # fill in credentials
npm run dev                  # starts on port 3020
```

## Before Committing
- Run `npx tsc --noEmit`
- Never commit `.env.local`, service-account JSON, or API tokens
- Per-client tokens live in `cr_channel_credentials` (encrypted), not env vars

## DO NOT REBUILD — Exists Elsewhere
| What                              | Lives in                                       |
|-----------------------------------|------------------------------------------------|
| Influencer campaign management    | wmm-influ-campaigns                            |
| Cold email campaigns              | wmm-email-lead-gen-app (El Pulpo)              |
| Sales gamification / leaderboard  | wmm-blitz                                      |
| Content generation                | wmm-content                                    |
| Team roster                       | wmm-os `team_roster`                           |
| Revenue Intelligence ETL → BigQuery | octo-functions (Junior's — do not modify)    |

## Security Rules (MANDATORY)
- NEVER run `git push --force` to any branch
- NEVER commit `.env.local`, service-account JSON keys, or API tokens to git
- NEVER expose `SUPABASE_SERVICE_ROLE_KEY` to client (never `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`)
- NEVER expose connector secrets to client — all sync routes are server-side API routes only
- All credential or schema changes require review by Fran (fran@webmymoney.com)
