# Phase 2+ Plan — Unified Traffic Attribution Dashboard

> Branch: `fran/consolidation-reconcile`
> Status: **decisions locked, octopus audit complete, UI reference in hand; Phase 2 implemented**
> Last updated: 2026-05-04

## UI reference

**See [`docs/reference/ashley-looker-studio-reference.md`](../reference/ashley-looker-studio-reference.md)** for the canonical UI target.

It documents the Looker Studio report Fran's team already delivers (Ashley Stambouli — 6-source ecom client). Our app replicates that layout — left sidebar with platform icons, one full page per platform, KPI cards over charts over tables — and adds a consolidated home tab as our differentiator.

## The reframe

Phase 1 thought in "channels" — paid platforms, organic platforms, ecommerce, CRM as sibling categories. The new framing collapses that hierarchy:

**Every platform is a traffic source.** Meta Ads is a source. Instagram organic is a source. Shopify is a source. GHL is a source. Toast POS is a source.

The home view is a **consolidated attribution dashboard** that blends every connected source. Per-source tabs are detail drill-downs (the Looker layout). Mental model: **Hyros for SMB**, without the pixel infrastructure.

## Operating principles

1. **Show what's connected.** This is the only hard rule. Sidebar, tab strip, and source leaderboard derive from `cr_channel_credentials.is_active = true`. No empty tabs, no hardcoded lists.
2. **One full page per platform — Looker layout.** KPI band, charts, tables. Density varies per source.
3. **Consolidated home is our differentiator.** Looker can't blend across sources. We can. First tab, default view.
4. **Business type informs KPI defaults — nothing more.** Don't gate features by niche. Smart defaults, easy overrides.
5. **Thin connectors.** Each source = a focused module that fetches and normalizes. Sync route owns DB writes + auth.
6. **No pixel tracking.** Aggregate platform-reported numbers.
7. **Reuse what octopus already built.** Don't rewrite GHL webhooks, Toast POS, or the canonical-event ingestion path.

---

## Decisions locked

1. **Business types — 5 buckets**: `ecommerce`, `high_ticket_local`, `low_ticket_local`, `b2b`, `restaurant`. Each is a SHORTCUT to a KPI default set and a recommended source priority. **Not a hard gate**.
2. **Build order**: Shopify and GHL **in parallel**. Connector implementation starts after Phase 2.5 (octopus extraction).
3. **Channel-key rename**: full rename in one migration. No aliasing. **Implemented in 0013.**
4. **Revenue source of truth**: Shopify is canonical for ecommerce; Toast for restaurants. Ad-platform "conversions" stay as per-source metrics.
5. **Email & SMS**: support GHL, Klaviyo, **AND** Yotpo as separate sources.

---

## Sources to support

| Source | Status | Origin |
|---|---|---|
| Meta Ads | working in ads-reporting (Graph v21.0) | wired Phase 1 |
| Google Ads | working in ads-reporting (OAuth2 + GAQL) | wired Phase 1 |
| TikTok Ads | working in ads-reporting (Business API v1.3) | wired Phase 1 |
| GHL webhook receiver | reuse | octopus — ContactCreate / Update / OrderCreate / Update events |
| GHL outbound REST | NEW | contacts, opportunities, pipeline, calls, appointments |
| Shopify | NEW | Admin API |
| Klaviyo | NEW | email + SMS lists, flows, campaigns, attributed revenue |
| Yotpo | NEW | reviews, loyalty, SMS, email |
| Toast POS | reuse | octopus bridge — restaurant orders, payments, labor |
| Meta Page (organic) | NEW | Page Insights API (uses Meta token) |
| Meta Instagram (organic) | NEW | IG Insights API (same Meta token) |
| LinkedIn organic | NEW | LinkedIn Marketing API |
| Pinterest organic | NEW | Pinterest API |
| TikTok organic | NEW | TikTok Login Kit |
| YouTube | NEW | YouTube Data + Analytics API |
| GA4 | connector exists, not wired | Google service account |
| Search Console | connector exists, not wired | Google service account |

---

## Reuse from octopus (`octo-functions` repo)

The audit of `D:\WMM_DEV_HUB\APPS_WORKSPACE\octo-functions` found infrastructure and connectors we should extract rather than rewrite. **Phase 2.5 below is the extraction step.**

### Reusable connectors

| Octopus component | What it does | Action for ads-reporting |
|---|---|---|
| **GHL webhook receiver** | Receives ContactCreate/Update → `lead_created`, OrderCreate/Update → `purchase_completed`. Functional. | Port directly. Add the outbound REST client separately. |
| **Meta Ads cron pull** | Hourly Graph API v18.0 — campaign-level. Functional. | **Skip** — ours is v21.0 (newer). **Reuse the leadgen webhook**. |
| **Google Ads cron pull** | Hourly GAQL searchStream with token refresh. | **Skip** — ours has same GAQL pattern. **Borrow the token-refresh utility** if cleaner. |
| **Toast POS bridge** | Read-through proxy for restaurant orders/payments/labor. | Port directly. Use as `ServiceConnector` template. |

### Reusable infrastructure

| Octopus component | Use for ads-reporting |
|---|---|
| `CanonicalEvent` schema + `buildCanonicalEvent` + `buildDedupeKey` | Adopt as the canonical event shape for any webhook-driven source. |
| `ingestWithIdempotency()` | Write-once with dedup. Universal ingest entry point for streaming sources. |
| DLQ + replay system | For any cron / webhook ingestion that can fail and need replay. |
| `ConnectorRegistry` + `ServiceConnector` interface | Contract for **all new** connectors. |
| Credential vault + health monitor | Evaluate during extraction. |

### Build pattern decisions

- **Read-through APIs** (Shopify, Klaviyo, Yotpo, GHL outbound): follow Toast `ServiceConnector` pattern.
- **Daily-batch pulls** (organic social, GA4, GSC, YouTube): follow our existing Meta Ads sync pattern.
- **Webhook sources** (GHL events, Meta leadgen): canonical-event ingestion path from octopus → `cr_source_daily`.

---

## Data model — implemented in Phase 2

### `cr_source_daily` — migration 0012

```sql
CREATE TABLE public.cr_source_daily (
  client_id    uuid        NOT NULL REFERENCES public.cr_clients(id) ON DELETE CASCADE,
  source_key   text        NOT NULL,
  date         date        NOT NULL,

  cost         numeric(14,4),    -- 0 for organic, ad spend for paid
  impressions  bigint,
  clicks       bigint,           -- paid-ad clicks
  visits       bigint,           -- organic clicks/sessions/profile-visits
  conversions  numeric(14,4),
  revenue      numeric(14,4),    -- canonical: Shopify for ecom, Toast for restaurant
  reach        bigint,
  engagements  bigint,

  extra        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  synced_at    timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (client_id, source_key, date)
);
```

CHECK on `source_key` allows the 17-source whitelist. Indexes on (client_id, date), (client_id, source_key, date), and (source_key, date). RLS enabled with admin-all + client-read-own policies.

Per-campaign data for paid sources stays in `cr_campaigns` + `cr_daily_stats`. Source rollups in `cr_source_daily` are what the consolidated view reads.

### Source-key rename — migration 0013

Full rename in one migration. No aliases.

| Today | After Phase 2 |
|---|---|
| `meta` | `meta_ads` |
| `google_ads` | `google_ads` (unchanged) |
| `tiktok` | `tiktok_ads` |
| `ga4` | `ga4` (unchanged) |
| `gsc` | `google_search_console` |
| `gtm` | (dropped — not in canonical list) |
| `shopify` | `shopify` (unchanged) |
| `ghl` | `ghl` (unchanged) |
| (new) | `meta_page` (Facebook organic) |
| (new) | `meta_instagram` (organic) |
| (new) | `linkedin` |
| (new) | `pinterest` |
| (new) | `tiktok_organic` (distinct from `tiktok_ads`) |
| (new) | `youtube` |
| (new) | `klaviyo` |
| (new) | `yotpo` |
| (new) | `toast` |
| (new) | `email_sms` |

CHECK constraints on `cr_channel_credentials`, `cr_campaigns`, `cr_daily_stats`, and `cr_source_daily` all align to this whitelist.

### Business-type column — migration 0014

Five buckets. **Used as a shortcut for KPI defaults, not a feature gate.**

```sql
ALTER TABLE public.cr_clients
  ADD COLUMN business_type text NULL
  CHECK (business_type IS NULL OR business_type IN (
    'ecommerce', 'high_ticket_local', 'low_ticket_local', 'b2b', 'restaurant'
  ));
```

Nullable: existing clients get NULL until the team classifies them. Consolidated home falls back to a generic KPI default when null.

What it does:
- Sets the default 5 KPI cards on the consolidated home for new clients
- Suggests a default sort weight on the source leaderboard
- That's it. **No feature gating.**

What overrides it:
- The connected-sources rule.
- The per-client metric-config UI (`/admin/clients/[clientId]/metrics`) — already shipped Phase 1.

---

## Business types & KPI defaults

These are starter defaults, not gates.

| Business type | Examples | Primary outcome | 5 KPI defaults | Default-priority sources |
|---|---|---|---|---|
| **ecommerce** | DTC brands, Shopify stores | revenue | Spend · Revenue · Orders · ROAS · CAC | Shopify, Meta Ads, Klaviyo, Yotpo, Google Ads |
| **high_ticket_local** | medspa, dentist, lawyer, chiro, clinic | qualified appointment | Spend · New Leads · Booked Appointments · Cost per Lead · Show-up Rate | GHL, Meta Ads, Google Ads, Meta Page+IG, GA4 |
| **low_ticket_local** | hair salon, gym, auto detailer, locksmith | call / walk-in / booking | Spend · Calls · Bookings · Cost per Lead · CAC | GHL, Meta Ads, Google Ads, Meta Page+IG |
| **b2b** | SaaS, agencies, services to businesses | demo / pipeline | Spend · Leads · MQLs · Demos Booked · Pipeline Value | LinkedIn, GHL, Google Ads, GA4, Meta Ads |
| **restaurant** | dine-in, QSR, food trucks | orders / covers | Spend · Orders · Covers · Average Ticket · Net Sales | Toast, Meta Ads, GHL, Meta Page+IG, Google Ads |

---

## UI structure

**Full UI spec lives in [`docs/reference/ashley-looker-studio-reference.md`](../reference/ashley-looker-studio-reference.md).**

### Consolidated home (`/admin/clients/[clientId]`) — our differentiator

Default tab. Sections:

1. **KPI band** — 5 cards driven by `business_type` defaults, overridable via metric-config
2. **Source contribution** — donut, share of revenue (or primary outcome) per source
3. **Time series** — primary outcome over time, optionally split by source
4. **Source leaderboard** — sortable table: source · cost · visits · conversions · revenue · ROAS · CAC
5. **Anomaly callouts**

### Per-source tabs (one per connected source) — Looker layout

Sidebar / tab strip rendered from `cr_channel_credentials.is_active = true`. Click a source, get its full page following the Ashley pattern: KPI band (5–17 cards), 2–4 charts, 1–3 sortable tables.

---

## Implementation phases

### Phase 2 — Source data model ✅ implemented

- ✅ Migration 0012 — `cr_source_daily` (hybrid shape above)
- ✅ Migration 0013 — full source-key rename + new whitelist
- ✅ Migration 0014 — `cr_clients.business_type`
- ✅ Types: `SourceKey` (17 keys), `Channel = SourceKey` alias, `BusinessType`, `SourceDailyRow`
- ✅ All `Record<Channel, ...>` UI maps cover all 17 sources

Pending Phase 2: update existing sync handlers (Meta Ads, Google Ads, TikTok Ads) to ALSO write a daily rollup row to `cr_source_daily`. Service: `getSourceDailyForClient(clientId, range, sources?)`.

### Phase 2.5 — Extract from octopus

- Port `CanonicalEvent` schema + `buildCanonicalEvent` + `buildDedupeKey` into `lib/events/`
- Port `ingestWithIdempotency()`
- Port DLQ + replay machinery
- Port the `ServiceConnector` interface + registry
- Port the GHL webhook receiver as `/api/webhooks/ghl/route.ts`
- Port the Toast POS bridge as `lib/connectors/toast.ts`
- Evaluate the credential vault

### Phase 3 — Consolidated home + business type

- Replace `<DashboardShell>` with a new shell built around `cr_source_daily`
- Business-type selector on the client detail page
- Source contribution donut + leaderboard + time-series
- Tab strip rendered from connected sources only

### Phase 4 — Build the missing connectors

| Sprint | Connectors |
|---|---|
| 1 | **Shopify** + **GHL outbound REST** (parallel) |
| 2 | **Klaviyo** + **Yotpo** |
| 3 | **Meta Page + Meta Instagram** |
| 4 | **GA4 + Search Console** (wire-ups) |
| 5 | **LinkedIn organic** |
| 6 | Pinterest organic, TikTok organic, YouTube |

### Phase 5 — Per-source detail tabs (Looker layout)

The Ashley reference is the spec.

- `<SourceTab>` shell component
- One per-source content module per source — `components/sources/`
- Charts library additions: choropleth/region map (`react-simple-maps`)
- Creative thumbnail rendering for paid ads

### Phase 6 — Polish

- Anomaly detection
- Export to CSV / PDF
- Period comparison
- Sync scheduler

---

## Out of scope

- Pixel-level tracking, server-side conversion APIs, click attribution
- Multi-tenant agency reseller (SaaS surface stays separate)
- Client-facing portal (internal-only per Phase 1 decision)
- Replacing existing Meta Ads / Google Ads sync with octopus's older versions
- Pixel-perfect Looker chrome — we follow the layout, not the visual language
- Hard-gating features by business type — connected sources is the only gate
