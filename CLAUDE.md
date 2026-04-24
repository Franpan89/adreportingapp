@AGENTS.md

# {{APP_NAME}} — Claude Code Conventions

> **WMM Standalone App** — Part of the Web My Money ecosystem.
> Standards derived from [wmm-agents](https://github.com/Web-My-Money/wmm-agents).

## Project
- Firebase project: `{{FIREBASE_PROJECT}}`
- GitHub repo: `Web-My-Money/{{REPO_NAME}}`
- Region: `us-central1`
- Runtime: Node.js 22 (`.nvmrc` → `22`)
- Cloud Functions: v2 (`firebase-functions/v2`)
- Firestore: Native mode
- Package manager: **npm only** — never Yarn, pnpm, or Bun
- Port: **{{PORT}}** (local dev)
- Owner: {{OWNER_NAME}} ({{OWNER_PERSON_ID}})

## WMM Brand Standards
All WMM apps must follow these visual standards for consistency:

- **Logo**: `public/logo.png` (teal hexagonal WM mark) — included in template
- **Primary color**: Teal `#00C4B4` — buttons, links, focus rings, active states
- **Accent color**: Violet `#7C3AED` — secondary highlights, gradients
- **Sky**: `#0EA5E9` — tertiary accent, charts, info states
- **Background**: Dark `#080b14` (oklch(0.13 0.005 260))
- **Card surface**: `#0f172a` (oklch(0.17 0.005 260))
- **Borders**: `rgba(255, 255, 255, 0.08)` — 8-10% white
- **Font**: Geist Sans + Geist Mono (via next/font/google)
- **Theme**: Always dark mode first. Light mode optional.
- **Theme color** (metadata): `#00C4B4`
- **Header pattern**: Logo (h-7) + app name, teal accent on active nav items
- **Cards**: rounded-xl, bg-card, border-border, 1px border

## Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript strict
- **Styling**: Tailwind CSS (dark theme, oklch tokens)
- **Components**: shadcn/ui from `web/components/ui/` — never build custom UI primitives
- **Icons**: lucide-react
- **State**: TanStack Query for server cache, useState for client state
- **Forms**: react-hook-form + zod (validate all inputs server-side)
- **Backend**: Firebase Cloud Functions v2 (TypeScript)
- **Auth**: Firebase Auth
- **Database**: Firestore (`{{FIREBASE_PROJECT}}` — isolated, never shared)
- **AI**: Claude API via @anthropic-ai/sdk (if needed)

## Directory Structure
```
{{REPO_NAME}}/
  web/                          # Next.js frontend
    app/                        # App Router pages (thin renderers)
      layout.tsx                # Root layout with providers
      page.tsx                  # Home page
      api/                      # Route handlers
    lib/
      firebase.ts               # Firebase client config + USE_MOCK flag
      schema.ts                 # Firestore document types (source of truth)
      helpers.ts                # Pure utility functions (no React, no Firestore)
      types.ts                  # App-specific constants and enums
      services/                 # Firestore read/write logic (no UI)
        firestore.ts            # Shared helpers (subscribe, fetch, add)
        index.ts                # Barrel export
    components/
      ui/                       # shadcn/ui primitives (do not modify)
    package.json
    tsconfig.json
  functions/                    # Cloud Functions backend
    src/
      index.ts                  # Re-exports all functions
    package.json
  firebase.json
  .firebaserc
  firestore.rules
  firestore.indexes.json
  .gitignore
  .nvmrc
  apphosting.yaml
  CLAUDE.md                     # This file
```

## Architecture Layers (follow this order)
1. **Schema** (`lib/schema.ts`) — Canonical Firestore document types. Use `FirestoreTimestamp` (never `any`). Export collection name constants.
2. **Services** (`lib/services/`) — One file per Firestore collection. Handles subscribe, fetch, create, update. No React, no UI.
3. **Hooks** (`lib/use-data.ts` or feature-specific) — React hooks wrapping services with useState/useEffect. Handle mock data switching.
4. **Helpers** (`lib/helpers.ts`) — Pure utility functions. No Firestore, no React.
5. **Pages** (`app/`) — Thin renderers. Call hooks, compose UI. No direct Firestore imports.

## Naming Conventions
| Entity | Convention | Example |
|--------|-----------|---------|
| Files | `kebab-case` | `brain-inputs.ts`, `user-avatar.tsx` |
| Components | `PascalCase` | `UserAvatar`, `CampaignCard` |
| Firestore collections | `snake_case` | `team_roster`, `brain_inputs` |
| Firestore fields | `snake_case` | `person_id`, `created_at` |
| Cloud Functions | `camelCase` | `handleWebhook`, `extractBrief` |
| Env vars | `ALL_CAPS` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |

## Firestore Schema Policy (from wmm-agents)
- **Additive only** — never remove, rename, or change field types without a multi-phase migration
- Allowed without migration: new optional fields with defaults, new subcollections, new collections
- Requires dual-write migration: renaming fields, changing field types
- **Blocked**: removing fields still read by active code, renaming collections
- Always use `FieldValue.serverTimestamp()` for `created_at`/`updated_at`
- Document all composite indexes in `firestore.indexes.json`

## Cloud Functions Standards (from wmm-agents)
- **One function per file** in `functions/src/`
- Re-export all from `functions/src/index.ts`
- **Trigger selection**: `onRequest` (webhooks), `onCall` (authenticated), `onDocumentCreated` (Firestore triggers), `onSchedule` (cron)
- **Idempotency**: Check `_processed/{idempotencyKey}` before execution, mark AFTER success
- **DLQ**: Write failed events to `_dlq` with eventType, eventId, payload, error, retryCount, status
- **Secrets**: Always use `defineSecret()` — never hardcode
- **Error handling**: Structured responses, exponential backoff for transient failures
- **CORS**: Explicit origin allowlist — never `cors: true`
- **Cold starts**: Lazy-import large modules inside function body

```typescript
// Idempotency pattern
const key = `${eventType}_${eventId}`;
const ref = db.doc(`_processed/${key}`);
if ((await ref.get()).exists) return res.status(200).json({ status: 'duplicate' });
// ... business logic ...
await ref.set({ processedAt: FieldValue.serverTimestamp() });
```

```typescript
// DLQ pattern
await db.collection('_dlq').add({
  eventType, eventId, payload,
  error: String(err),
  retryCount: 0,
  status: 'pending',
  createdAt: FieldValue.serverTimestamp(),
});
```

## Frontend Standards (from wmm-agents)
- **App Router only** — no Pages Router
- **Server Components by default** — add `'use client'` only for interactivity
- **Tailwind CSS** exclusively — no CSS Modules, no styled-components
- **TanStack Query** for server cache — never Redux
- **TypeScript strict** — no `any` without justification comment
- **zod** for runtime validation of all API request bodies
- Route handlers validate auth before any Firestore writes

## Security Baseline (from wmm-agents)
- **No secrets in code** — use `process.env` or `defineSecret()`
- **Never commit .env files** — `.env` must be in `.gitignore`
- **Webhook signature verification** — HMAC with `crypto.timingSafeEqual()`, return 401 immediately on failure
- **Input validation** — server-side zod validation for all user inputs
- **Auth checks** — `request.auth` for onCall, Firebase middleware for routes
- **Firestore rules** — least privilege, type validation, `request.auth.uid` anchor
- **Dependency audit** — `npm audit --audit-level=critical` in CI

## AI Generation Rules (from wmm-agents)
- Human review required for: auth code, payment handlers, schema changes, webhook handlers, security rules
- AI must NOT: skip signature verification, weaken security rules, hardcode secrets, deploy to production
- Attribution: comment for AI-generated sections >20 lines
- Use most specific wmm-agent for the task (firebase, fullstack, code-reviewer, tech-writer)

## Auth — WMM SSO Pattern
All WMM internal apps use the same auth flow:
1. Google OAuth via Firebase Auth with `hd: "webmymoney.com"` domain restriction
2. Only @webmymoney.com emails can sign in (enforced at provider + app level)
3. Each app has its OWN Firebase project — auth is independent per app, but same Google account works everywhere
4. After sign-in, app maps `firebaseUser.email` → local user record (Firestore `users` collection or hardcoded config)

**Files included in template:**
- `lib/auth.ts` — signIn/signOut with domain validation
- `lib/firebase.ts` — GoogleAuthProvider with `hd: "webmymoney.com"`
- `context/auth-context.tsx` — AuthProvider + useAuth hook (handles mock mode)
- `components/AuthGuard.tsx` — Wraps protected content with sign-in gate

**To add roles/permissions:**
1. Create a `users` collection in Firestore with `{ email, role, name, ... }`
2. After Firebase Auth, look up user by email in Firestore
3. Store enriched user in context (role, permissions, etc.)

## Secrets Management
- **Client-side** (`NEXT_PUBLIC_*`): Firebase config — intentionally public, security via Firestore rules
- **Server-side** (`process.env`): API keys, webhook secrets — never expose to client
- **Cloud Functions**: Use `defineSecret()` from `firebase-functions/params` for production secrets
- **Local dev**: `.env.local` for all secrets (never committed, in `.gitignore`)
- **Webhook verification**: HMAC-SHA256 with `crypto.timingSafeEqual()` — return 401 before any processing

```typescript
// Cloud Functions secret pattern (recommended for production)
import { defineSecret } from 'firebase-functions/params';
const apiKey = defineSecret('MY_API_KEY');

export const myFunction = onRequest({ secrets: [apiKey] }, async (req, res) => {
  const key = apiKey.value(); // injected at runtime, encrypted at rest
});
```

## Environment Variables
```bash
# Firebase (public — safe to expose, security via Firestore rules)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID={{FIREBASE_PROJECT}}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_USE_MOCK=true

# Server-side only (never expose to client)
# ANTHROPIC_API_KEY=           # if using Claude AI
# WEBHOOK_SECRET=              # if receiving webhooks
```

## Running Locally
```bash
cd web && npm install   # takes 4-5 min first time
cd web && npm run dev   # starts on port {{PORT}}
```

## Before Committing
- Run `npm run typecheck` from `web/`
- Never commit `.env.local` or secrets
- Confirm `firestore.rules` covers new collections

## Commits
- Format: `[SCOPE] description`
- Example: `[AUTH] add Firebase sign-in with Google`

## WMM OS Cross-Project Data Access

Workspace apps need to read team roles, departments, and priorities from wmm-os without having their own copy. This template includes a **secondary Firebase app** pattern for read-only access to wmm-os Firestore.

### Files
- `lib/wmm-os-firebase.ts` — Secondary Firebase app init pointing at wmm-os project
- `lib/wmm-os-data.ts` — Helper functions: `emailToPersonId()`, `getRoleTier()`, `getPosition()`, `getDepartment()`, `getDailyPriorities()`, `canManage()`, plus Firestore reads (`fetchTeamRoster()`, `subscribeTeamRoster()`, `fetchTeamMember()`)

### How it works
1. The workspace has its OWN Firebase project (for auth + local data)
2. A SECOND named Firebase app (`"wmm-os"`) connects to wmm-os Firestore (read-only)
3. Identity lookups (email→person, role, department, priorities) are hardcoded for speed — no Firestore needed
4. Live data (team roster) reads from wmm-os Firestore via the secondary app

### Usage
```typescript
import { emailToPersonId, getRoleTier, getDailyPriorities } from "@/lib/wmm-os-data";

// After Firebase Auth, resolve the user
const personId = emailToPersonId(user.email); // "john"
const role = getRoleTier(personId);           // "manager"
const priorities = getDailyPriorities(personId); // ["Check campaign performance...", ...]
```

### Env vars required
Add to `.env.local` (values from Firebase Console → wmm-os project):
```
NEXT_PUBLIC_WMM_OS_API_KEY=
NEXT_PUBLIC_WMM_OS_AUTH_DOMAIN=webmymoney-dev.firebaseapp.com
NEXT_PUBLIC_WMM_OS_PROJECT_ID=webmymoney-dev
NEXT_PUBLIC_WMM_OS_STORAGE_BUCKET=
NEXT_PUBLIC_WMM_OS_MESSAGING_SENDER_ID=
NEXT_PUBLIC_WMM_OS_APP_ID=
```

### Important
- **Never write to wmm-os Firestore** from a workspace app
- Firestore rules on wmm-os must allow authenticated reads from workspace apps
- When adding a new team member, update both wmm-os/web/lib/types.ts AND wmm-os-data.ts in this template

## Creating a New Workspace

When a team member needs their own customizable dashboard:

1. **Clone this template**: `git clone wmm-app-template → wmm-workspace-{name}`
2. **Replace placeholders**: Search for `{{VARIABLES}}` and fill in:
   - `{{APP_NAME}}` — e.g., "WMM Ads Dashboard"
   - `{{FIREBASE_PROJECT}}` — Create a new Firebase project or reuse existing
   - `{{REPO_NAME}}` — e.g., "wmm-workspace-ads"
   - `{{PORT}}` — Next available (check app registry, currently 3015+)
   - `{{OWNER_NAME}}` / `{{OWNER_PERSON_ID}}` — Who owns this workspace
3. **Set up Firebase**: Create project, enable Auth + Firestore, add env vars
4. **Add wmm-os env vars**: Copy from team shared secrets
5. **Install & run**: `cd web && npm install && npm run dev`
6. **Register in wmm-os**: Add to app registry when ready for production

The workspace owner can then customize freely with Claude Code — their repo, their changes, no risk to wmm-os or other apps.

## WMM Ecosystem
This is a standalone app with its own Firebase project (`{{FIREBASE_PROJECT}}`).
It follows [wmm-agents standards](https://github.com/Web-My-Money/wmm-agents).

| App | Port | Firebase Project |
|-----|------|-----------------|
| wmm-os | 3001 | webmymoney-dev/prod |
| wmm-brain | 3002 | wmm-brain |
| pancho-dapa-crm-assistant | 3003 | dapa-crm-assistant |
| wmm-proposal-gen | 3004 | wmm-proposal-gen |
| wmm-alarms-marketplace | 3005 | wmm-alarms-mkt |
| wmm-wiki | 3006 | wmm-wiki |
| wmm-influ-campaigns | 3007 | wmm-influcampaigns |
| wmm-crawler | 3012 | wmm-crawler |
| wmm-blitz | 3010 | webmymoney-prod |
| wmm-email-lead-gen-app | 3011 | wmm-email-lead-gen |
| wmm-onboarding | 3013 | wmm-onboarding |
| wmm-client-intel | 3014 | wmm-client-intel |
| wmm-mind | 3015 | webmymoney-prod |
| wmm-legacy-leads | 3018 | wmm-legacy-leads |

---

## Ecosystem Awareness

### What This Template Is
The canonical **starter template** for all new WMM standalone apps. When a team member needs their own customizable workspace or a new internal tool is needed, clone this template, replace placeholders, and deploy. It includes the full WMM standard stack, auth pattern, USE_MOCK pattern, and cross-project wmm-os data access pattern pre-wired.

### What This Template Includes (Pre-built)
- **Auth scaffold**: `lib/auth.ts` + `context/auth-context.tsx` + `components/AuthGuard.tsx` — Google OAuth with @webmymoney.com lock
- **USE_MOCK pattern**: `lib/firebase.ts` exports `USE_MOCK` flag — all services check it and return mock data when true
- **wmm-os cross-project access**: `lib/wmm-os-firebase.ts` + `lib/wmm-os-data.ts` — read team roster without local copy
- **Firestore service helpers**: `lib/services/firestore.ts` — `subscribe()`, `fetch()`, `add()`, `update()` helpers
- **Schema pattern**: `lib/schema.ts` — typed Firestore document interfaces with `FirestoreTimestamp`
- **Dark theme**: Tailwind CSS + oklch tokens matching wmm-os visual design

### DO NOT REBUILD — Exists Elsewhere
| What | Lives In | Where Exactly |
|------|---------|--------------|
| Task management | wmm-os | `/tasks`, Cloud Functions |
| Meeting → brief pipeline | wmm-os | `ingestor` → `extractor` → `dispatcher` |
| Team roster (authoritative) | wmm-os | `team_roster` collection |
| Content generation | wmm-mind | ContentEngine, `/api/generate` |
| Cold email campaigns | wmm-email-lead-gen-app | El Pulpo |
| Influencer campaigns | wmm-influ-campaigns | AIAP |
| Knowledge base | wmm-wiki | Google Drive sync |
| Lead scraping | wmm-legacy-leads | Outscraper + Wappalyzer |
| Client analytics | wmm-client-intel | Platform connectors |
| Sales gamification | wmm-blitz | War Board |
| CEO private vault | wmm-brain | Isolated Firebase project |
| Employee onboarding | wmm-onboarding | Config-driven wizard |
| Proposal generation | wmm-proposal-gen | Claude builder |
| Document crawling | wmm-crawler | Multi-source pipeline |

### WMM Team Structure
**5 Departments:** Strategy & Growth | Marketing & Content | Sales | Client Success | Operations
**Key People:** Fran (CEO) · Sabi · Pancho · Milan · Camilo · Pia · Manuel · Linus
**9 Position Types:** CEO · Operations Manager · Sales Rep · Content Creator · Client Success Manager · Developer · Designer · Finance Lead · Marketing Manager

## Security Rules (MANDATORY)
- NEVER run `firebase deploy` from Claude Code — all deploys go through GitHub CI
- NEVER run `git push --force` or `git push --force-with-lease` to any branch
- NEVER modify firestore.rules without explicit approval from admin@webmymoney.com or fran@webmymoney.com
- NEVER modify apphosting.yaml or apphosting.prod.yaml secrets
- NEVER delete Firestore documents — use status:archived pattern instead
- NEVER commit .env.local, service account keys, or API tokens to git
- NEVER modify branch protection rules or GitHub settings
- All security rule changes require review by Fran (fran@webmymoney.com) or Admin (admin@webmymoney.com)
