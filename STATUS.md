# Project Status – What’s Done vs Not Finished

## Pushed to GitHub

- **Repo:** https://github.com/AbdelrhmanFox/it-support-dashboard

---

## Completed (all from original spec)

### Dashboard
- **KPIs:** Open Tickets, Low Stock, Delayed Suppliers, Pending Requests, **Devices in Maintenance**, **Parts Installed Today**
- **Charts:** Tickets per month, Inventory status (pie), **Most common issues**, **Parts consumption (OUT per month)**, **Device maintenance (history per month)**

### Asset profile (asset detail)
- **Tabbed profile:** Overview (details, assignment, notes), **Maintenance History**, **Installed Parts**, **Tickets** (linked by `asset_id`), **Attachments**
- **Migrations:** `database/migrations/add-asset-profile.sql` (tickets.asset_id, asset_attachments table + RLS)

### Reports
- **Analytics:** Tickets per month (12 months), Maintenance entries per month (12 months), Supplier performance (Delivered / Delayed counts)
- **Export:** Excel for tickets, inventory, suppliers, purchase requests, assets (unchanged)

### UI/UX
- **Dark mode:** `next-themes` + ThemeProvider; top bar theme toggle (Light / Dark / System)
- **RTL / Arabic:** LocaleProvider + top bar language toggle (English / العربية); `dir` and `lang` on document
- **Command bar:** **⌘K** (or Ctrl+K) global search (cmdk) – open CommandBar, search pages, navigate

### Authentication
- **Login page:** `/login` – email/password and “Send magic link” (Supabase Auth)
- **Middleware:** When `REQUIRE_AUTH=true`, redirect unauthenticated users to `/login`; public routes: `/support`, `/ticket-request`, `/login`
- **Top bar:** User menu + Sign out when logged in

### Public Ticket Portal (existing)
- `/support`, `/ticket-request` → form, optional screenshot upload, rate limit, n8n webhook, ticket number TCK-YYYY-NNNN

---

## Optional / not in app

- **n8n workflows** (low stock, supplier reminders, monthly reports, etc.) – run in n8n; dashboard only exposes “new ticket” webhook.
- **Future enhancements** (Pref.md): mobile app, QR/barcode, AI categorization, supplier scoring, predictive stock, warranty alerts – not implemented.

---

## How to enable auth

1. In Supabase: enable Email auth (and optionally Magic Link).
2. Create a user (Auth → Users → Add user).
3. In `.env.local` (or Netlify): set `REQUIRE_AUTH=true`.
4. Redeploy; dashboard routes require login; `/support` and `/ticket-request` stay public.

## Migrations to run (if not already)

- `database/migrations/add-ticket-attachment.sql` – `attachment_url` on tickets
- `database/migrations/add-asset-profile.sql` – `asset_id` on tickets, `asset_attachments` table + RLS
