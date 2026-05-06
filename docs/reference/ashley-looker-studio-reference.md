# UI Reference — Ashley Stambouli Looker Studio Report

> Source: PDF export of the Looker Studio report Fran's team has been delivering.
> Status: **canonical UI target** for `wmm-client-reporting`.
>
> Build this layout in Next.js. Add a consolidated home tab as our differentiator. Fix what Looker can't (Klaviyo). Everything else mirrors this report.

## Why this is the reference

Looker Studio has been the de-facto reporting surface for WMM clients. The team's existing build patterns in `wmm-client-intel` and `wmm-reporting` already match this shape — left-sidebar platform navigation, one full page per platform, KPI cards over charts over tables. The Ashley report is a clean ecommerce example showing how that pattern plays for a client with 6 connected sources.

Replicating this in our app gives us:
- Continuity with what the team already understands and delivers
- An obvious mental model for new clients (one tab per platform)
- A point of differentiation: the consolidated cross-platform home that Looker can't build

## Sidebar — left rail, platform icons

Vertical strip of platform icons, one per source the client has connected. **Sidebar only shows what's connected.** Ashley's sidebar has 6 entries:

```
Google Ads
Google Analytics
Facebook Ads
Shopify
Klaviyo
Go High Level
```

Same pattern in our app: `ChannelTabs` already does this dynamically via `cr_channel_credentials`. No hardcoded list.

## Page anatomy — same shape for every platform

Each platform gets a full page with:
1. **Header**: platform name + date-range picker (top-right)
2. **KPI cards**: 5–10 cards in 2–3 rows, each with a number and a % change vs prior period
3. **Charts**: 2–4 charts — usually a line chart over time, then a donut/breakdown by some dimension, then a region/geo chart
4. **Tables**: 1–3 sortable tables for breakdowns (campaigns, countries, products, demographics)

Density per platform varies. Facebook Ads is the richest (creative thumbnails, demographics). Shopify is mid-density. Klaviyo would be similar density to Shopify if it weren't broken in Looker.

---

## Page 1 — Google Ads Summary

**KPI band (2 rows):**

Row 1: Impressions · Clicks · Avg CPC · Avg CPM · CTR
Row 2: Conversions · Total Conversion Value · Conversion Rate · Cost · Cost per Conversion · ROAS

Each card: big number + small % change indicator (arrow + delta).

Ashley sample values: Impressions 367,907 · Clicks 5,992 · Avg CPC $0.84 · Avg CPM $14 · CTR 2% · Conversions 97 · Conv Value $48,127 · Conv Rate 0.18% · Cost $5,033 · Cost/Conv $51.88 · ROAS 10.

**Charts:**
- **Impressions Breakdown** — line chart, x = date over selected range
- **Cost Distribution by Device** — donut (Mobile 65%, Computer 30.2%, Tablet, Other)
- **Conversions by Region (USA)** — choropleth map of US states
- **Conversions by Campaign** — horizontal bar chart, top campaigns by conversion count

**Tables:**
- **Campaign Analysis** — sortable: Campaign | Impressions | Clicks | CTR | Conversions | Conv Rate | Cost
- **Country Analysis** — sortable: Country/Territory | Region | Impressions | Clicks | CTR | Conversions | Conv Rate | Cost

---

## Page 2 — Facebook Ads Summary

**Densest page in the report.** KPI band is 3 rows, charts are dual-line, and there's a creative-thumbnail table that's the standout custom element.

**KPI band (3 rows):**

Row 1: Impressions · Reach · Clicks · Amount Spent · CTR
Row 2: Frequency · CPM · CPC · Purchase Value · ROAS
Row 3: Website Purchases · Facebook Purchases · Cost per Website Purchase · Landing Page Views · ThruPlay Actions · Cost per LP View · Cost per ThruPlay

Ashley sample: Impressions 1.9M · Reach 728K · Clicks 570K · Spent $24,075 · CTR 3.66% · Frequency 2.64 · CPM $12.53 · CPC $0.34 · Purchase Value $55,658 · ROAS 2.31 · Website Purchases 150 · FB Purchases 7 · Cost per Website Purchase $160.50 · LP Views 48,616 · ThruPlay 59,942 · Cost per LP View $0.50 · Cost per ThruPlay $0.40.

**Charts:**
- **Impressions & Reach Breakdown** — dual-line over time
- **Amount Spent & Link Clicks Breakdown** — dual-line over time, dual y-axis
- **Website Purchases by Campaign** — horizontal bar chart

**Tables:**
- **Campaign Breakdown** — Campaign | Amount Spent | Impressions | Reach | Clicks | CTR | Purchases | LP Views | ThruPlay | Purchase Value | Total Cost | ROAS
- **Demographic Analysis** — age-range table + gender filter pill + "Website Purchase by Age" donut chart laid out side-by-side
- **Creative Ads Breakdown** — table with actual ad creative thumbnails inline: Campaign | Ad Name | **Ad Creative (image)** | Impressions | Reach | Clicks | Purchases | ROAS | Total Cost

The creative thumbnail column is the visual hook of this page. We'll need to fetch the ad's creative thumbnail URL from Meta and render inline.

---

## Page 3 — Shopify Summary

**KPI band (single row, 7 cards):**

Orders · Gross Sales · Net Sales · Average Order Value · Product Quantity · Total Discounts · Tax Amount

Ashley sample: 376 orders · $166,869 gross · $123,660 net · $433 AOV · 421 product qty · $15,594 discounts · $1,692 tax.

**Charts:**
- **Gross Sales Breakdown** — line chart over time
- **Sales Channel** — donut: Online Store 59.3%, Cortina Supplier 24.1%, Facebook & Instagram 6.5%, Fare Sell Wholesale 5.2%, others

**Tables:**
- **Sales City Breakdown** — City | Order ID | Gross Sales | Net Sales
- **Sales by Products** — Line Item Title | Order Items Qty | Gross Sales | Net Sales — Ashley's "Chloe Dress" tops at $18,850

---

## Page 4 — Klaviyo Summary

**Broken in Looker — Looker Studio system errors render most of this page unusable.** This is an open opportunity for our build.

**Working (KPI band):**
Viewed Form · Submitted Form · Submit Rate

Ashley sample: 105,168 viewed · 635 submitted · 0.60% submit rate.

**Intended structure (to build correctly in our app):**
- Toggle tabs: **Campaigns** vs **Flows**
- Open vs Click charts (line over time)
- Campaign breakdown table (when Campaigns selected): Campaign | Sent | Delivered | Open Rate | Click Rate | Revenue | Unsubscribes
- Flow breakdown table (when Flows selected): Flow | Recipients | Open Rate | Click Rate | Revenue | Conversion Rate

We build this from scratch, not port a broken Looker layout.

---

## Design implications for `wmm-client-reporting`

### 1. The sidebar is already right
`DashboardShell` + `ChannelTabs` already renders dynamically from `cr_channel_credentials`. Phase 1 made this dynamic. No change needed there.

### 2. One full page per platform — this is Phase 5
Each `ChannelTab`'s click target is a full per-platform page (not just a metric filter). Phase 5 of the plan is the `<SourceTab>` shell + one content module per source. The Ashley report tells us exactly what each source's page should contain (KPIs + charts + tables — the table above per page).

### 3. Our differentiator: the consolidated home tab
Looker doesn't have one. We do. It's the FIRST tab and the default view. Cross-source ROAS, blended CAC, source contribution, attribution leaderboard — none of which Looker can show because Looker can't blend across data sources cleanly.

### 4. Klaviyo done right
Looker's Klaviyo connector is broken. Build the Campaigns/Flows toggle structure ourselves. This is a clear win for clients on our build.

### 5. Creative thumbnails for paid ads
The Facebook Ads "Creative Ads Breakdown" table with inline ad-creative images is a standout. Meta Graph API provides creative thumbnails — fetch and store the URL alongside ad-level rows. Worth doing for both Meta Ads and Google Ads (responsive search ads have similar previewable creative).

### 6. Density varies by platform
Facebook Ads page = 17 KPI cards, 3 charts, 3 tables. Shopify page = 7 KPI cards, 2 charts, 2 tables. Per-source content modules are NOT one-size-fits-all — each platform has its own KPI list and table set. The metric-config UI we built (`/admin/clients/[clientId]/metrics`) lets the team override visibility per client.

### 7. Visualization stack confirmed
- Line charts (over time) — recharts already in the deps
- Dual-line / dual-axis charts — recharts handles
- Donuts / pies — recharts
- Choropleth / region maps — NEW — needs `react-simple-maps` or similar (Phase 5 dep)
- Bar charts (horizontal) — recharts
- Sortable tables — already built in `<CampaignTable>`, generalize to `<SourceTable>`

### 8. Date-range picker in the per-page header
Ashley's report has the picker top-right, applied per page. Our `<TimeRangeSelector>` already does this — but it lives in `DashboardShell` today (one selector for the whole dashboard). For Phase 5 keep it shared — same range applies to whichever source tab is open.

### 9. Per-platform "% change vs prior period" on every KPI
Already shipped in Phase 1 (`<KpiCard>` with delta + direction).

---

## What we DON'T copy from Looker

- **Pixel-perfect Looker chrome** — we use shadcn-style cards, not the Looker visual language. WMM brand colors (teal `#00BD7D`) over Looker's blue.
- **The broken Klaviyo layout** — build it correctly.
- **Per-page date pickers as separate controls** — one shared `<TimeRangeSelector>` covers the whole dashboard session.
- **PDF-export-as-the-product** — our reporting is interactive in the browser; PDF export is Phase 6 polish, not the primary surface.
- **Static slide-deck feel** — we're a tool, not a slideshow.

---

## Per-source mapping back to the plan

Where each Ashley page maps to the source-key naming and KPI defaults in the main plan:

| Ashley page | Source key in plan | Phase 4 sprint |
|---|---|---|
| Google Ads | `google_ads` | already wired (Phase 1) |
| Google Analytics | `ga4` | sprint 4 (wire-up) |
| Facebook Ads | `meta_ads` | already wired (Phase 1) |
| Shopify | `shopify` | sprint 1 (build) |
| Klaviyo | `klaviyo` | sprint 2 (build) |
| Go High Level | `ghl` (REST) + `ghl` webhooks | sprint 1 (REST) + Phase 2.5 (webhook receiver) |

Ashley is a 6-source ecom client. Per the 5-bucket business-type table, ecommerce defaults to KPI band: Spend · Revenue · Orders · ROAS · CAC. Top sources: Shopify, Meta Ads, Klaviyo, Yotpo, Google Ads. Ashley doesn't have Yotpo connected; the sidebar reflects that — her page strip has 6 platforms, not 7. The connected-sources logic does the right thing automatically.
