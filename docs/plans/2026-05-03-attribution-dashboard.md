# Phase 2+ Plan — Unified Traffic Attribution Dashboard

> Branch: `fran/consolidation-reconcile`
> Status: proposed; not yet implementing

## The reframe

Phase 1 thought in "channels" — paid platforms, organic platforms, ecommerce, CRM as sibling categories. The new framing collapses that hierarchy:

**Every platform is a traffic source.** Meta Ads is a source. Instagram organic is a source. Shopify is a source. GHL is a source. They all contribute attention, leads, or revenue to the client's business.

The home view is a **consolidated attribution dashboard** that blends every connected source. Per-source tabs are detail drill-downs. No "ads vs organic" tab switcher — that's an internal categorization that doesn't help the team read performance.

Mental model: **Hyros for SMB**, without the pixel infrastructure. Aggregate platform-reported numbers, surface them per source, give the team an honest read on what's working.

## Operating principles

1. **Only show what's connected.** No empty tabs, no ghost channels. The tab strip and the source leaderboard derive from `cr_channel_credentials.is_active = true`.
2. **Consolidated default; per-source detail.** Land on the consolidated view; click into a source for the drill-down.
3. **Business-type aware.** Ecommerce sees ROAS + AOV + revenue. Local/service sees calls + appointments + cost-per-lead. B2B sees demos + pipeline. KPI defaults driven off `cr_clients.business_type`.
4. **Thin connectors.** Each source = a ~60–150 line module that fetches and normalizes. Sync route owns DB writes + auth.
5. **No pixel tracking.** Aggregate platform-reported numbers. Multi-touch attribution is out of scope.

## Sources to support

| Source | Status | Auth pattern |
|---|---|---|
| Meta Ads | working | Graph v21.0, agency token + per-client account_id |
| Google Ads | wired Phase 1 | OAuth2 refresh-token flow |
| TikTok Ads | wired Phase 1 | Business API v1.3 |
| Instagram organic | not built | IG Insights (Meta token) |
| Facebook organic | not built | Page Insights (Meta token) |
| LinkedIn organic | not built | LinkedIn Marketing API |
| Pinterest organic | not built | Pinterest API |
| TikTok organic | not built | TikTok Login Kit |
| YouTube | not built | YouTube Data + Analytics API |
| GA4 | connector exists, not wired | Google service account |
| Search Console | connector exists, not wired | Google service account |
| GTM | not built | tag/trigger health (Tag Manager API) |
| Shopify | not built | Admin API |
| GHL / CRM | not built | GHL API v2 |
| Email & SMS | not built | mostly via GHL |

## Data model

### Decision: hybrid `cr_source_daily` table

Phase 1's `cr_daily_stats` is paid-shaped (impressions/clicks/spend/conversions/conversions_value). It doesn't fit organic, ecommerce, or CRM. Three options considered:

| Option | Pros | Cons |
|---|---|---|
| Pure JSONB unified table | infinitely flexible, one table | weak indexes, no field types, JSON paths everywhere |
| Multiple typed tables | typed columns per category, fast aggregation | many joins for the consolidated view, repetitive math |
| **Hybrid: normalized columns + JSONB extras** | one consolidated query, typed attribution math, flexible per-source extras | nulls (organic has no cost, GHL has no impressions); semantic mapping varies — that's the connector's job |

Going with the hybrid:

```sql
CREATE TABLE cr_source_daily (
  client_id     uuid NOT NULL REFERENCES cr_clients(id) ON DELETE CASCADE,
  source        text NOT NULL,
  date          date NOT NULL,

  -- attribution-universal columns (all nullable; organic has no cost,
  -- some sources don't report impressions, etc.)
  cost          numeric(14,4),    -- 0 for organic, ad spend for paid
  impressions   bigint,           -- views/reach equivalent at impression-level
  visits        bigint,           -- clicks/sessions/profile-visits
  conversions   numeric(14,4),    -- platform-reported outcomes
  revenue       numeric(14,4),    -- attributed/reported revenue
  reach         bigint,           -- unique people if reported
  engagements   bigint,           -- likes+comments+shares / opens+clicks

  -- per-source extras (Instagram followers, Shopify AOV, GHL pipeline_value)
  extra         jsonb NOT NULL DEFAULT '{}',

  synced_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, source, date)
);

CREATE INDEX idx_cr_source_daily_client_date    ON cr_source_daily (client_id, date DESC);
CREATE INDEX idx_cr_source_daily_source_date    ON cr_source_daily (client_id, source, date DESC);
```

Per-campaign data for paid sources stays in `cr_campaigns` + `cr_daily_stats`. Source rollups in `cr_source_daily` are what the consolidated view reads.

### Source-key naming

Move from raw channel keys to a fully namespaced source taxonomy. Renames in one shot, no aliases:

| Today | After Phase 2 |
|---|---|
| `meta` | `meta_ads` |
| `google_ads` | `google_ads` (unchanged) |
| `tiktok` | `tiktok_ads` |
| `ga4` | `google_analytics` |
| `gsc` | `google_search_console` |
| `gtm` | `google_tag_manager` |
| `shopify` | `shopify` (unchanged) |
| `ghl` | `ghl` (unchanged) |
| (new) | `meta_instagram` (organic) |
| (new) | `meta_facebook` (organic) |
| (new) | `linkedin` |
| (new) | `pinterest` |
| (new) | `tiktok` (organic — distinct from `tiktok_ads`) |
| (new) | `youtube` |
| (new) | `email_sms` |

### Business-type column

```sql
ALTER TABLE cr_clients
  ADD COLUMN business_type text NOT NULL DEFAULT 'ecommerce'
  CHECK (business_type IN ('ecommerce', 'local_service', 'b2b_saas'));
```

Drives KPI selection, default chart metric, and source-leaderboard sort weight.

## UI structure

### Consolidated home (`/admin/clients/[clientId]`)

This IS the page — no separate tab. Sections, top to bottom:

1. **KPI band** — 5 cards, business-type aware:
   - Ecommerce: Spend · Revenue · Orders · ROAS · CAC
   - Local/Service: Spend · Calls · Appointments · Cost per Lead · Booking Rate
   - B2B/SaaS: Spend · Leads · MQLs · Demos · Pipeline Value
2. **Source contribution** — donut, share of revenue (or primary outcome) per source
3. **Time series** — primary outcome over time, optionally split by source
4. **Source leaderboard** — table sortable by impact: source · cost · visits · conversions · revenue · ROAS · CAC
5. **Anomaly callouts** — copy that highlights "Meta Ads spend ↑40% but conversions flat" type signals

### Per-source tabs (dynamic)

Tab strip: `[Consolidated] [Meta Ads] [Instagram] [Shopify] [GHL] …` — only sources with `is_active = true` credentials show up.

Each per-source tab is a `<SourceTab>` shell with slots for:
- KPI strip — 4–6 metrics that matter for THIS source
- Time-series — primary metric over time
- Top items table — top campaigns / posts / pages / appointments / orders
- Source-specific extras — IG follower growth, Shopify cart-abandonment funnel, GHL pipeline stages

### Per-source surface sketch

| Source | Primary KPIs | "Top items" view |
|---|---|---|
| Meta Ads | Spend, ROAS, CTR, CPA, CPM | Top campaigns by spend |
| Google Ads | Spend, ROAS, CTR, CPC, conv rate | Top campaigns + top keywords |
| TikTok Ads | Spend, ROAS, CPM, video views | Top campaigns |
| Instagram | Followers, reach, engagement rate, profile visits | Top posts |
| Facebook | Page likes, reach, engagement | Top posts |
| LinkedIn | Followers, impressions, engagement, click-through | Top posts |
| Pinterest | Pins, monthly views, saves, outbound clicks | Top pins |
| TikTok organic | Followers, video views, engagement | Top videos |
| YouTube | Subscribers, watch time, views, retention | Top videos |
| GA4 | Sessions, users, conversion rate, top channels | Top landing pages |
| Search Console | Clicks, impressions, position, CTR | Top queries + pages |
| GTM | Container version, active tags, broken triggers | Tag/trigger health table |
| Shopify | Revenue, orders, AOV, conversion rate, cart abandonment | Top products |
| GHL | New leads, opportunities, appointments, pipeline value | Pipeline by stage, recent appointments |
| Email/SMS | Sends, opens, clicks, unsubscribes | Top campaigns / sequences |

## Implementation phases

### Phase 2 — Source data model

- Migration: add `cr_source_daily` (hybrid shape above)
- Migration: add `cr_clients.business_type`
- Migration: rename channel keys (`meta`→`meta_ads`, `gsc`→`google_search_console`, etc.) in all three tables + CHECK constraints
- Update existing sync handlers (Meta Ads, Google Ads, TikTok Ads) to ALSO write a daily rollup row to `cr_source_daily` after the per-campaign upsert
- Service: `getSourceDailyForClient(clientId, range, sources?)` — feeds the consolidated view

### Phase 3 — Consolidated home + business type

- Replace `<DashboardShell>` with a new shell built around `cr_source_daily`
- Business-type selector on the client detail page; per-type KPI defaults
- Source contribution donut + leaderboard + time-series
- Tab strip rendered from connected sources only — no hardcoded list

### Phase 4 — Build the missing connectors

One commit per connector. Pattern from Meta:
- Pure connector module in `lib/connectors/<source>.ts` (~60–150 lines)
- Sync handler case in `api/sync/[channel]/route.ts`
- Per-source credential form in settings
- Optional per-campaign / per-content rows for paid + social sources

Priority order (by client value):

1. **Shopify Admin API** — biggest signal for ecom clients
2. **GHL** — biggest signal for local/service clients
3. **Meta Page + IG Insights** — same token as Meta Ads, lowest marginal cost
4. **GA4 + Search Console** — connectors exist, schema fits via `extra`
5. LinkedIn organic
6. Pinterest organic
7. TikTok organic
8. YouTube
9. GTM (tag-health is interesting but operational, not performance)
10. Email/SMS — likely just surfaces what GHL already exposes

### Phase 5 — Per-source detail tabs

- `<SourceTab>` shell component with slots
- One per-source content module per source — small, focused, lives in `components/sources/`

### Phase 6 — Polish

- Anomaly detection (rolling z-score per source × metric)
- Export to CSV / PDF
- Period comparison (already partially built in Phase 1)
- Sync scheduler — no cron exists today; sync is manual-button only

## Out of scope

- Pixel-level tracking, server-side conversion APIs, click attribution
- Multi-tenant agency reseller (SaaS surface stays separate)
- Client-facing portal (internal-only per Phase 1 decision)

## Open questions for Fran

1. **Business-type taxonomy** — three categories (ecommerce / local-service / B2B-SaaS) enough, or more granular (medspa vs lawyer vs restaurant within local_service)?
2. **Phase 4 priority** — agree with Shopify-first, or pull GHL ahead since more clients are local/service?
3. **Channel-key rename** — full rename in one migration vs gradual aliasing? Recommendation: full rename, no aliases.
4. **Attribution semantics** — when both Shopify reports orders AND Meta Ads reports conversions, which is "the truth" in the consolidated revenue total? Recommendation: Shopify is canonical for ecom clients; Meta's "conversions" become a per-source metric, not the universal revenue source.
5. **Email/SMS** — assume GHL is the only source (most WMM clients use GHL Mail/SMS)? Or carve out separate connectors for Klaviyo/Mailchimp clients?
