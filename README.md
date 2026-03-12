# IT Support Operations Dashboard

A production-ready **IT Support Operations Dashboard** built with Next.js (App Router), Tailwind CSS, shadcn/ui, and Supabase. It centralizes spare parts, inventory, purchase requests, suppliers, IT assets, asset history, tickets, notifications, and reports.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Tables:** TanStack Table (via components)
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Excel export:** SheetJS (xlsx)
- **Deployment:** Netlify-ready

## Project structure

```
/app                 # App Router pages
/components          # Shared UI (layout, shadcn components)
/modules             # Feature modules (e.g. spare-parts form)
/lib                 # Utils, Supabase client/server
/services            # Data layer (Supabase queries)
/types               # Shared TypeScript types
/database            # schema.sql for Supabase
```

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL in `database/schema.sql` in the Supabase SQL Editor.
   - Copy the project URL and anon key to `.env.local` (see below).

3. **Environment**
   - Copy `.env.example` to `.env.local`.
   - Set:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Main features

- **Dashboard:** KPIs (open tickets, low stock, delayed suppliers, pending requests), tickets-per-month chart, inventory status pie chart, recent activity.
- **Spare parts:** List, filters (category, supplier, low stock), search, create/edit form, detail page.
- **Inventory:** Stock transactions list, filter by part; current stock overview.
- **Purchase requests:** List by status, create (part, supplier, quantity, dates), detail page.
- **Suppliers:** List, search, create/edit, detail.
- **Assets:** List, filters, create/edit (tag, type, status, assignment, warranty dates), detail.
- **Asset history:** List of maintenance entries, filter by asset.
- **Tickets:** List by status, create ticket, detail page.
- **Notifications:** Bell dropdown in header, full notifications page, mark as read.
- **Reports:** Export tickets, inventory, suppliers, purchase requests, or assets to Excel.

## Database

The schema is in `database/schema.sql`. It includes:

- `profiles` (extends auth.users)
- `suppliers`, `spare_parts`, `assets`
- `stock_transactions`, `purchase_requests`, `supplier_followups`
- `asset_history`, `tickets`, `notifications`

Plus indexes, foreign keys, RLS policies, and `updated_at` triggers.

## Automation (n8n)

Automation (low stock alerts, supplier reminders, Telegram, etc.) is intended to run on an **external n8n server**. The dashboard only consumes and displays data; it does not implement n8n workflows.

## Deployment (Netlify)

1. **Connect GitHub**
   - In [Netlify](https://app.netlify.com): Add new site → Import an existing project → GitHub.
   - Authorize Netlify and select your repo.

2. **Build settings** (usually auto-detected)
   - Build command: `npm run build`
   - Publish directory: `.next` (or let the Next.js plugin set it)
   - Use the **Essential Next.js** plugin if offered.

3. **Environment variables**
   - Site settings → Environment variables → Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon (public) key
   - Redeploy after adding them.

## Supabase setup (for Netlify and local)

1. Go to [supabase.com](https://supabase.com) → New project (name, password, region).
2. In the project: **SQL Editor** → New query → paste contents of `database/schema.sql` → Run.
3. **Settings → API**: copy **Project URL** and **anon public** key.
4. Use them in Netlify env vars (above) or in local `.env.local`.

## License

Private / internal use.
