# wmm-client-reporting

Centralized client performance dashboard for **Web My Money**. Aggregates Meta Ads, Google Ads, GA4, Search Console, and TikTok Ads into one per-client view.

This is the consolidation of:

- `wmm-client-intel` (Firebase Cloud Functions — connectors)
- `octo-functions` (Google Ads OAuth flow)
- `wmm-influ-campaigns` (Meta v21.0 sync)
- the original `ads-reporting` / AdPulse SaaS scaffold

## Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4
- **Database**: Supabase (shared WMM project, `cr_` table prefix)
- **Auth**: Supabase Auth + Google OAuth
- **Hosting**: Vercel
- **Runtime**: Node.js 22 (`.nvmrc`)
- **Package manager**: npm only

## Channels

| Key          | Connector                  | API                |
|--------------|----------------------------|--------------------|
| `meta`       | `lib/connectors/meta`      | Graph API v21.0    |
| `google_ads` | `lib/connectors/google-ads`| Google Ads API v17 |
| `ga4`        | `lib/connectors/ga4`       | Data API v1beta    |
| `gsc`        | `lib/connectors/gsc`       | Search Console v1  |
| `tiktok`     | `lib/connectors/tiktok`    | Business API v1.3  |

Each connector is a pure data-fetching module. The sync route (`api/sync/[channel]`) handles auth, token resolution, and Supabase writes.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + connector credentials
npm run dev                  # http://localhost:3020
```

Without Supabase credentials, services fall back to mock data (`isSupabaseConfigured()` check).

## Reading more

- `CLAUDE.md` — full architectural conventions, channel setup, security rules
- `AGENTS.md` — agent operating rules + project context
- `supabase/migrations/` — schema migrations (run in order, 0001 → 0009)

## Notes on scope

The `(superadmin)/superadmin/*` routes and license/agency surface in this repo are SaaS productization work (the AdPulse brand). They're slated to move to a separate app — do not extend that surface here.
