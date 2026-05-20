# Caravan CRM — Product Requirements Document

**Status:** Live · v0.1
**Repo:** [rahullym/Crm_caravan](https://github.com/rahullym/Crm_caravan)
**Stack:** Next.js 16 (App Router) · React 19 · Prisma 7 · PostgreSQL (Neon) · NextAuth · Tailwind v4

---

## 1. Overview

A multi-user CRM for an Australian caravan sales and service business. It captures leads from advertising platforms (Meta and Google), routes them to sales reps, tracks them through a configurable pipeline, and gives admins visibility into the funnel.

### Goals
- **Capture every lead automatically** — webhook integrations with Meta Lead Ads and Google Ads Lead Forms so no enquiry slips through email.
- **One pane of glass for sales** — leads, follow-ups, status changes, and assignment all in one place.
- **Mobile-first for reps in the field** — full app-shell experience on phones (bottom tab bar, tap-to-call, compact lead cards) so sales reps can work without a laptop.
- **Visibility for admins** — pipeline view, reports, and per-rep performance.
- **Soft-configurable pipeline** — admins can rename stages, change colours, hide stages, and reorder them without a code change or migration.

### Non-goals (for now)
- Quote / invoice generation
- Customer-facing self-service portal
- Native mobile apps (the web PWA covers it)
- Marketing automation / email sequences

---

## 2. Personas & Roles

Four roles, each with hard-coded permissions in `Role` enum and enforced at three layers (proxy → server action → DB query).

| Role | What they see and do |
|---|---|
| **ADMIN** | Everything. Manages users, configures pipeline stages, integrations, all leads, all reports. |
| **SALES** | Only leads assigned to them. Can edit/delete their assigned leads, change status, log follow-ups. Reports are scoped to their data. |
| **SERVICE_MANAGER** | Caravans inventory, service requests, technician assignments. No access to leads or reports. |
| **TECHNICIAN** | Only the service requests assigned to them; can update status. No write access to caravans, no access to leads. |

---

## 3. Feature Set (by page)

### `/dashboard`
- 4 KPI cards: Total Leads, Converted (Deposit Paid), Active Deals (Hot Lead + Quote Sent + Decision Pending), Pending Services
- Recent Leads list (top 5)
- Recent Follow-Ups feed (top 5)
- Quick Access sidebar (desktop only — bottom tab bar replaces it on mobile)
- SALES users see only their assigned leads' stats

### `/leads`
- Sortable/filterable table of all leads (admin) or assigned leads (sales)
- Filters: Status, Source, State, Assigned-to (admin)
- Columns: Lead (avatar + name + phone), Model, Source, Status (inline editable), Next Action, Added, Owner, Actions (Edit/Delete)
- Bulk select + bulk reassign (admin)
- Bulk CSV upload (admin)
- Inline Add Lead modal
- Mobile view: single-line cards with avatar, name, phone, source, status pill, and tap-to-call

### `/leads/[id]`
- Full lead detail with editable status, owner assignment (admin)
- Caravan interest, action plan, customer notes, internal notes
- Follow-up entry form
- Reverse-chronological follow-up history with channel + next-action badges
- Edit / Delete buttons (delete is admin-only or sales-assigned-only)

### `/pipeline`
- Kanban board, one column per stage
- Drag-and-drop to change status (server-action backed, optimistic)
- Per-column vertical scroll on tall columns; board scrolls horizontally
- SALES users only see their assigned leads
- **Hidden on mobile** (kanban isn't usable on small touch screens)

### `/reports`
- KPI cards: Total Leads, Conversion Rate, Active Pipeline, This Month + month-over-month delta
- Pipeline breakdown (count + % per stage)
- Lead source breakdown
- Follow-up activity by channel
- Recent wins (Deposit Paid)
- SALES users see only their assigned-leads data (with an amber "My Leads" badge)

### `/services`
- Service requests table (caravan, issue, technician, status)
- Inline status change, inline technician assignment
- ADMIN / SERVICE_MANAGER see all; TECHNICIAN sees only theirs
- Service request creation form

### `/caravans` (ADMIN only)
- Inventory management — add, list, delete

### `/settings/users` (ADMIN only)
- Create user with role
- Edit user email, role, password
- Delete user — nulls FK references then removes; protects against deleting yourself or the last admin

### `/settings/pipeline` (ADMIN only)
- Rename pipeline stages
- Change stage colour
- Toggle stage visibility
- Reorder stages
- Backed by `AppSetting` table (key/value JSON)

### `/settings/integrations` (ADMIN only)
- Meta Lead Ads setup: webhook URL, verify token, env-var status pills, setup steps
- Google Ads Lead Forms setup: webhook URL, key, env-var status, setup steps
- Recent integration leads table (combined Meta + Google Ads)
- Migration-pending warning banner if DB schema is behind

---

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components, server actions, single-deployable |
| Runtime | Node.js | Required for the Postgres driver adapter |
| UI | React 19 + Tailwind v4 + hand-rolled CSS | Tailwind for utility tokens; custom CSS for design system primitives |
| Auth | NextAuth v4 (JWT strategy, Credentials provider) | Stateless sessions; works with any deploy target |
| Password hashing | bcryptjs | |
| DB | PostgreSQL (Neon serverless) | Branch-aware, scales to zero |
| ORM | Prisma 7 + `@prisma/adapter-pg` (driver adapter) | New WASM-based query engine |
| Validation | Zod 4 | Form + webhook payload validation |
| Bundler | Webpack (dev), default (prod) | Pinned via `next dev --webpack` for stability |
| Hosting | AWS Amplify (current production) | |

---

## 5. Architecture

### Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Desktop / Mobile PWA-style)                            │
│  └─ Next.js App Router                                           │
│       ├─ Server Components (DB reads, role checks)               │
│       ├─ Client Components ("use client" — forms, modals)        │
│       └─ Server Actions (mutations, role-checked)                │
└──────────┬─────────────────────────────────┬─────────────────────┘
           │                                  │
           │ HTTPS                            │ HTTPS (webhook)
           ▼                                  ▼
   ┌─────────────────┐               ┌──────────────────┐
   │   Neon Postgres │               │  Meta / Google   │
   │   (Prisma 7)    │◄──────────────│  webhook senders │
   └─────────────────┘   POST /api/  └──────────────────┘
```

### Request lifecycle (a typical authenticated page hit)

1. Browser requests e.g. `/leads`
2. **`proxy.ts`** (Next.js 16 replacement for `middleware.ts`) intercepts → uses NextAuth `withAuth` to check the JWT session cookie. Redirects to `/login` if missing.
3. Route is rendered as a server component:
   - `getServerSession(authOptions)` → role + userId
   - Role-scoped `prisma.*.findMany({ where: leadWhere })` queries
   - Returns HTML
4. Client components inside the page (`LeadsTable`, `StatusSelect`, etc.) hydrate and handle inline interactions via **server actions** (e.g. `updateLeadStatus`, `assignLead`).
5. Each server action re-checks role + ownership before mutating, then calls `revalidatePath` so server components re-render with fresh data.

### Webhook lifecycle

1. Meta or Google POSTs a lead payload to `/api/meta/webhook` or `/api/google-ads/webhook`.
2. These routes are **whitelisted from auth** in `proxy.ts`.
3. Signature verification:
   - Meta: HMAC-SHA256 over the raw body using `META_WEBHOOK_SECRET`
   - Google: static `google_key` field matched against `GOOGLE_ADS_WEBHOOK_KEY`
4. Payload normalised → mapped to CRM fields → `prisma.lead.create({ data })` with `source: META` or `source: GOOGLE_ADS`
5. Duplicate phone numbers skipped (the `phone` column has a unique constraint)
6. Per-lead errors return 200 to the platform so the entire batch isn't retried

---

## 6. Data Model

See [prisma/schema.prisma](prisma/schema.prisma) for the canonical version.

### Core entities

```
User ─┬─ AssignedLeads (Lead.assignedTo)
      ├─ FollowUps (LeadFollowUp.author)
      └─ ServiceRequests (ServiceRequest.technician)

Lead ─┬─ FollowUps (LeadFollowUp.lead) — cascade delete
      └─ AssignedTo (User)

Caravan ─── ServiceRequests (ServiceRequest.caravan)

AppSetting  (key/value JSON — used by pipeline stages editor)
```

### Enums

- `Role`: `ADMIN | SALES | SERVICE_MANAGER | TECHNICIAN`
- `LeadSource`: `META | GOOGLE_ADS | WEBSITE | REFERRAL | SHOW | OTHER`
- `LeadStatus` (the pipeline): `NEW_LEAD → CONTACTED → ENGAGED → QUALIFIED → OPTIONS_SENT → SHORTLISTED → HOT_LEAD → QUOTE_SENT → DECISION_PENDING → DEPOSIT_PAID (won) → LOST`
- `ActionChannel`: `PHONE_CALL | EMAIL | SMS | WALK_IN | SOCIAL_MEDIA | META_PAID | META_ORGANIC | OTHER`
- `NextAction`: `FOLLOW_UP_CALL | SEND_QUOTE | SCHEDULE_DEMO | SEND_EMAIL | SITE_VISIT | CLOSE_DEAL | NO_ACTION`
- `ServiceStatus`: `PENDING | IN_PROGRESS | COMPLETED`

### Migration strategy

This project does **not** use `prisma migrate` — schema evolution is via hand-written, idempotent SQL files in `prisma/*.sql`. Existing examples:
- [prisma/migrate_lead_status.sql](prisma/migrate_lead_status.sql) — replaced the legacy `INQUIRY/DEMO/NEGOTIATION/WON` enum with the 11-stage pipeline
- [prisma/migrate_app_settings.sql](prisma/migrate_app_settings.sql) — added `AppSetting`
- [prisma/migrate_action_channel_meta.sql](prisma/migrate_action_channel_meta.sql) — added `META_PAID` / `META_ORGANIC`
- [prisma/migrate_lead_source_google_ads.sql](prisma/migrate_lead_source_google_ads.sql) — added `GOOGLE_ADS`

Run against Neon manually after deploying schema changes. `prisma generate` regenerates the client.

---

## 7. External Integrations

### Meta Lead Ads
- Endpoint: `POST /api/meta/webhook` + `GET` handshake verification
- Required env vars: `META_VERIFY_TOKEN`, `META_WEBHOOK_SECRET`, `META_PAGE_ACCESS_TOKEN`, optional `META_GRAPH_VERSION` (default `v21.0`)
- Flow: Meta delivers `{ object: "page", entry: [{ changes: [{ field: "leadgen", value: { leadgen_id }}]}]}` → CRM fetches lead details from Graph API → maps `field_data` to CRM columns → creates lead with `source: META`, `actionChannel: META_PAID`
- Accepts a simpler pre-mapped `{name, phone, email}` payload for test scripts / Zapier-style proxies

### Google Ads Lead Forms
- Endpoint: `POST /api/google-ads/webhook`
- Required env var: `GOOGLE_ADS_WEBHOOK_KEY`
- Flow: Google POSTs `{ google_key, user_column_data: [{column_id, string_value}, ...] }` → CRM verifies the key (constant-time match) → maps columns by `column_id` → creates lead with `source: GOOGLE_ADS`
- Test pings (`is_test: true`) accepted but not persisted

### Shared semantics
- AU state names normalised (`"New South Wales"` → `"NSW"`, etc.)
- Phone numbers stripped of non-digit/+ characters before dedup lookup
- Custom form fields stuffed into `customerNotes` so they're not lost
- Idempotent: duplicate-by-phone hits are skipped with HTTP 200 so platforms don't retry

---

## 8. Auth & Security

### Authentication
- NextAuth v4 with **Credentials provider** + bcrypt password verification
- **JWT session strategy** (no DB session table) — stateless, survives restarts
- `NEXTAUTH_SECRET` **required at boot** — server throws if missing, no fallback. This avoids the silent session-invalidation bug from a random fallback.
- `NEXTAUTH_URL` must match the deployment URL (different per env via `.env.local`)

### Authorization (defence in depth)
1. **`proxy.ts`** — `withAuth` matcher excludes only `/api/auth`, the two webhook routes, `/login`, and static assets. Every other request needs a session.
2. **Page-level guards** — server components re-check `session.user.role` and `redirect("/dashboard")` if unauthorised (e.g. `/caravans` is ADMIN-only, `/services` blocks SALES, etc.).
3. **Server-action guards** — every action re-checks role *and* ownership before mutating. SALES users can only mutate leads where `assignedToId === session.user.id`.
4. **Last-admin protection** — `deleteUser` and `updateUser` refuse to demote/delete the final ADMIN.

### Webhook security
- Meta webhooks: HMAC-SHA256 signature check using `timingSafeEqual`
- Google Ads: static key match (constant-time)
- Misconfigured secrets fail closed (return 401/500 — never silently accept)

### Other
- Passwords hashed with bcrypt (cost 10)
- Phone uniqueness at the DB level prevents duplicate-lead races
- `confirm()` dialogs guard destructive actions (delete lead, delete user)

---

## 9. Mobile Experience

Below 1024px the app transforms into a native-feeling mobile shell:

- **Bottom tab bar** (`MobileTabBar`): Home · Leads · Reports · Menu — fixed, iOS safe-area padding
- **Hamburger replaced** by the Menu tab → slides in the sidebar drawer
- **Mobile leads list** (`.lead-row`) — single-line card with avatar, name, phone · source, status pill, tap-to-call (`tel:` link)
- **Bulk-upload + Add Lead** buttons hidden in topbar on mobile
- **Pipeline / Pipeline Stages / Integrations** hidden from mobile drawer
- **Modals** go full-screen on phones (<640px)
- **Dashboard** stats stay 2-up on phones with reduced padding; Quick Access sidebar hidden
- **Tables** wrap in `.table-scroll` for horizontal scroll where they can't collapse

Desktop view (≥1024px) is unchanged — full sidebar, full sortable tables, kanban, etc.

---

## 10. Deployment

### Production
- AWS Amplify pulls from `main` branch
- Env vars set in Amplify console: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `META_*`, `GOOGLE_ADS_WEBHOOK_KEY`
- HTTPS automatic (required for Meta/Google webhooks)

### Local dev
- `.env` for shared defaults
- `.env.local` for per-developer overrides (`NEXTAUTH_URL=http://localhost:3000`) — gitignored
- Tunnel via ngrok/cloudflared if you need to receive live webhooks locally

### Build
```bash
npm run dev      # local dev (webpack)
npm run build    # production build
npm run start    # production start
npx prisma generate     # after schema changes
psql "$DATABASE_URL" -f prisma/<migration>.sql   # apply DB migration
```

---

## 11. Known Limitations & Future Roadmap

### Known limitations
- Manual SQL migrations — no `prisma migrate dev` history, reproducibility relies on ordering files correctly. Move to Prisma Migrate when convenient.
- No cascade deletes — deleting a User triggers a transaction that nulls all FK refs first; safer but slower than `ON DELETE CASCADE`.
- No email/SMS sending — follow-ups are logged-only, not sent.
- No file attachments on leads or service requests.
- No audit log (who-changed-what history).
- Webhook deliveries aren't queued — a slow Graph API call holds the request open. For low volume this is fine; at scale would need a queue (SQS / Inngest).
- No PWA install banner / offline support yet.

### Roadmap candidates (in rough priority)
1. **Quote / proposal generation** — currently the most-requested adjacency
2. **Email + SMS sending** from inside the CRM
3. **Lead scoring** — auto-priority based on response time, follow-up count, model interest
4. **Activity audit log**
5. **PWA install + offline lead capture**
6. **Native Google Calendar sync** for SCHEDULE_DEMO / SITE_VISIT next-actions
7. **WhatsApp Business integration** as a follow-up channel

---

## Appendix: Repo Layout

```
crm/
├─ app/
│  ├─ (app)/              # Auth-protected app routes
│  │  ├─ layout.tsx       # Sidebar + main content + mobile tab bar via AppNav
│  │  ├─ dashboard/
│  │  ├─ leads/
│  │  ├─ pipeline/
│  │  ├─ reports/
│  │  ├─ services/
│  │  ├─ caravans/
│  │  └─ settings/{users,pipeline,integrations}/
│  ├─ actions/            # Server actions (mutations)
│  ├─ api/
│  │  ├─ auth/[...nextauth]/   # NextAuth handlers
│  │  ├─ meta/webhook/         # Meta Lead Ads receiver
│  │  └─ google-ads/webhook/   # Google Ads Lead Form receiver
│  ├─ login/
│  ├─ layout.tsx          # Root html + Providers (SessionProvider)
│  └─ globals.css         # Design system + responsive utilities
├─ components/            # UI primitives (forms, modals, tables, mobile shell)
├─ lib/
│  ├─ auth.ts             # NextAuth config
│  ├─ prisma.ts           # Prisma client singleton (with PgPool adapter)
│  ├─ lead-statuses.ts    # Canonical stage list
│  └─ validations/        # Zod schemas
├─ prisma/
│  ├─ schema.prisma
│  └─ migrate_*.sql       # Hand-written DB migrations
├─ proxy.ts               # Next.js 16 auth middleware (replaces middleware.ts)
├─ next.config.ts
├─ prisma.config.ts
└─ package.json
```
