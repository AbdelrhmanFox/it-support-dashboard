# Architecture Reference

Technical deep-dive into the IT Support Operations Dashboard. For setup and usage see [README.md](../README.md).

---

## Table of Contents

1. [Request Lifecycle](#request-lifecycle)
2. [Authentication Flow](#authentication-flow)
3. [Role & Branch System](#role--branch-system)
4. [Component Hierarchy](#component-hierarchy)
5. [Data Layer (Services)](#data-layer-services)
6. [State Management](#state-management)
7. [Theme System](#theme-system)
8. [Sidebar & Layout](#sidebar--layout)
9. [Public Ticket Portal](#public-ticket-portal)
10. [Inventory Atomic Operations](#inventory-atomic-operations)
11. [Excel Import/Export](#excel-importexport)
12. [Dashboard Customization](#dashboard-customization)
13. [Notifications](#notifications)
14. [Database Schema](#database-schema)
15. [Migrations Checklist](#migrations-checklist)

---

## Request Lifecycle

```
Browser Request
      │
      ▼
middleware.ts
  ├── Creates server Supabase client (cookie-based session)
  ├── Calls supabase.auth.getUser()
  ├── If NOT authenticated AND path is protected → redirect /login?redirectTo=<path>
  ├── If authenticated AND path is /login → redirect to redirectTo or /
  └── Pass through (sets session cookie headers)
      │
      ▼
Next.js App Router
  ├── Server Component (e.g. /tickets/[id]/page.tsx)
  │     └── createClient() from lib/supabase/server.ts
  │     └── Direct Supabase query
  │
  └── Client Component (most pages)
        └── useBranch() / service functions using lib/supabase/client.ts
        └── Data fetched inside useEffect or event handlers
```

---

## Authentication Flow

### Login
1. User submits email + password on `/login`.
2. Client calls `supabase.auth.signInWithPassword()`.
3. On success, browser receives a `sb-*` session cookie.
4. Next navigation triggers middleware → user is authenticated → redirected to dashboard or `redirectTo`.

### Magic Link (OTP)
1. User submits email on `/login` (OTP mode).
2. Client calls `supabase.auth.signInWithOtp({ email })`.
3. User receives email with a link → clicking it sets the session.

### Sign Out
1. Top bar user menu → "Sign out".
2. Calls `supabase.auth.signOut()`.
3. App redirects to `/login`.

### Session Refresh
- Every request passes through `middleware.ts` which calls `updateSession()`.
- This refreshes the JWT if it's close to expiry so users stay logged in across page loads.

### Public Routes (no auth)
- `/support` — public ticket form
- `/ticket-request` — alternate public form
- `/login` — login page

---

## Role & Branch System

### Roles (stored in `profiles.role`)

| Role | `isAdmin` | `canEdit` |
|---|---|---|
| `admin` | true | true |
| `support` | false | true |
| `viewer` | false | false |

### BranchProvider
`components/branch-provider.tsx` is mounted at root level. On every `onAuthStateChange` event:
1. Calls `supabase.auth.getUser()` to get the logged-in user.
2. Queries `profiles` to get `role` and `branch_id`.
3. Loads the `branches` list.
4. Exposes via React context: `role`, `isAdmin`, `canEdit`, `branches`, `selectedBranchId` (admin filter), `effectiveBranchId`, `branchLabel`, `userBranchId`.

### effectiveBranchId
- **admin**: value of the branch filter they selected in the sidebar (null = all branches)
- **support / viewer**: their own `branch_id` from `profiles` (locked)

All service queries use `effectiveBranchId` for filtering:
```ts
if (branchId) query = query.eq("branch_id", branchId);
```

### Branch Filter Persistence
Admin's selected branch is stored in `localStorage` key `"it-support-branch"` via `BranchProvider.setSelectedBranchId`.

---

## Component Hierarchy

```
app/layout.tsx
  <html>
    <body>
      <a href="#main-content">Skip to main content</a>   ← accessibility
      <ThemeProvider>
        <LocaleProvider>                                  ← sets html dir/lang
          <BranchProvider>                               ← role + branch context
            {children}                                   ← actual page
            <CommandBar />                               ← ⌘K palette
            <Toaster />                                  ← sonner toasts
          </BranchProvider>
        </LocaleProvider>
      </ThemeProvider>
    </body>
  </html>

Authenticated page (e.g. /tickets):
  <DashboardLayout>                  ← dashboard-layout.tsx
    <Sidebar />                      ← fixed left nav
    <div>                            ← content area (shifts with sidebar)
      <TopBar />                     ← sticky header
      <main id="main-content">      ← page content
        {children}
      </main>
    </div>
  </DashboardLayout>
```

---

## Data Layer (Services)

All service files in `services/` follow the same pattern:

```ts
import { createClient } from "@/lib/supabase/client";

export async function getThings(params?: { branchId?: string }): Promise<Thing[]> {
  const supabase = createClient();
  let query = supabase.from("things").select("*").order("created_at", { ascending: false });
  if (params?.branchId) query = query.eq("branch_id", params.branchId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Thing[];
}
```

Key services and their notable behaviors:

| Service | Notable |
|---|---|
| `dashboard.ts` | All queries are independent; called in a single `Promise.all`. Has an 8-second timeout that triggers demo mode. |
| `stock-transactions.ts` | `useSparePartOnAsset` and `reverseUseSparePartOnAsset` are atomic multi-step operations (not DB transactions). |
| `lookup-options.ts` | Used for all configurable dropdowns; categories are constants in `LOOKUP_CATEGORIES`. |
| `ticket-service.ts` | Rate-limited (2 per email per 5 min); sequential ticket numbering; optional n8n webhook. |
| `reports.ts` | Returns raw arrays; Excel generation happens client-side via SheetJS. |

---

## State Management

No global state library. State is managed via:

| Mechanism | Used for |
|---|---|
| React Context | `BranchProvider`, `LocaleProvider`, `ThemeProvider` |
| `useState` + `useEffect` | All page-level data loading |
| `localStorage` | Sidebar collapsed state, dashboard layout (KPI order + sizes), branch filter, locale |
| `sessionStorage` | Viewer banner dismissed flag |
| Custom events | `"sidebar-toggle"` event fired by Sidebar so DashboardLayout can adjust padding |

---

## Theme System

### CSS Custom Properties
All colors are defined as HSL values in `app/globals.css` under `:root` (light) and `.dark`. Example:

```css
:root {
  --primary: 221 83% 53%;       /* #2563EB */
  --sidebar-bg: 222 47% 11%;    /* #0F172A */
  --topbar-height: 3.5rem;      /* 56px */
}
.dark {
  --background: 222 47% 7%;
  --sidebar-bg: 222 47% 5%;
}
```

### Tailwind Mapping
`tailwind.config.ts` maps CSS variables to Tailwind utilities:

```ts
colors: {
  primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
  sidebar: {
    bg: "hsl(var(--sidebar-bg))",
    "active-bg": "hsl(var(--sidebar-active-bg))",
    ...
  }
},
height: { topbar: "var(--topbar-height)" },
width: { sidebar: "var(--sidebar-width)", "sidebar-collapsed": "var(--sidebar-collapsed-width)" }
```

### Dark Mode
- `next-themes` controls the `.dark` class on `<html>`.
- Default: `"system"` (follows OS preference).
- User can override via theme toggle in the top bar.

---

## Sidebar & Layout

### Sidebar
- **Desktop**: Fixed left, `w-sidebar` (256px) or `w-sidebar-collapsed` (64px).
- **Mobile**: Hidden; slides in as a drawer from left on menu button click.
- Background: `bg-sidebar-bg` (dark navy `#0F172A`).
- Nav sections: OPERATIONS, MANAGEMENT, SYSTEM (shown only when expanded).
- **Collapsed mode**: Shows icons only; hover tooltip shows the label to the right of each icon.
- **Footer**: Branch switcher (admin only) + user email + expand/collapse toggle.

### Collapse Mechanism
1. Sidebar stores state in `localStorage["sidebar-collapsed"]`.
2. On toggle, fires `CustomEvent("sidebar-toggle", { detail: { collapsed } })`.
3. `DashboardLayout` listens for this event and adjusts `lg:pl-sidebar` / `lg:pl-sidebar-collapsed`.
4. Both components also listen to the `storage` event to sync across tabs.

### TopBar
- Height: `h-topbar` (56px, from CSS var).
- Left: Mobile menu button + page title (or breadcrumb for `[id]` routes).
- Right: Notifications bell (with unread count badge) + theme toggle + language toggle (shows EN/ع) + divider + user avatar (initials).

---

## Public Ticket Portal

Route: `/support` (and `/ticket-request`)

### Flow
```
User fills form
      │
      ▼
ticket-form.tsx (client component)
  - Validates with Zod (react-hook-form)
  - Calls onSubmit(values, file)
      │
      ▼
app/support/page.tsx
  - Builds FormData
  - Calls createPublicTicketAction(formData) [Server Action]
      │
      ▼
app/support/actions.ts (Server Action)
  - Validates fields
  - Normalizes priority to lowercase
  - Uploads attachment to Supabase Storage (if provided)
  - Calls createPublicTicket(supabase, input)
      │
      ▼
lib/ticket-service.ts
  - Rate limit check (2 per email per 5 min)
  - Generates ticket number: TCK-YYYY-NNNN
  - Inserts into tickets table
  - Calls n8n webhook (fire-and-forget, best-effort)
      │
      ▼
Returns { success: true, ticket_id, ticket_number }
      │
      ▼
app/support/page.tsx
  - Shows success banner above form
  - Resets form (via key remount)
  - "Submit another" clears banner and form
```

### Priority Normalization
The form shows display labels like "Medium", "High". The DB `CHECK` constraint requires lowercase. The server action normalizes: `priority.toLowerCase()`.

---

## Inventory Atomic Operations

### useSparePartOnAsset
```
services/stock-transactions.ts → useSparePartOnAsset(params)

1. createStockTransaction({ type: "OUT", quantity, spare_part_id, related_asset_id, branch_id })
2. UPDATE spare_parts SET current_stock = current_stock - quantity WHERE id = spare_part_id
3. INSERT INTO asset_history (asset_id, action_type: "part_installed", description, installed_part_id)
```

### reverseUseSparePartOnAsset
```
1. Fetch the OUT stock_transaction by id → get spare_part_id, quantity, related_asset_id
2. createStockTransaction({ type: "IN", quantity, notes: "Reversed..." })
3. UPDATE spare_parts SET current_stock = current_stock + quantity
4. DELETE FROM asset_history WHERE spare_part_id = ... AND asset_id = ... (most recent entry)
5. DELETE FROM stock_transactions WHERE id = originalId
```

> These are sequential Supabase calls, not a Postgres transaction. Partial failure is possible; the UI shows an error toast if any step fails.

---

## Excel Import/Export

### Import
```
lib/excel-import.ts → parseExcelFile(file)

1. FileReader reads file as ArrayBuffer
2. XLSX.read() parses the workbook
3. First sheet's rows are converted to objects keyed by header names
4. Returns Record<string, unknown>[]

Page (e.g. assets/page.tsx):
  - Maps row fields to the insert payload
  - Calls createX() per row
  - Collects { success, failed, errors[] }
  - Shows summary after import
```

### Template Download
```
lib/excel-import.ts → downloadTemplate(headers, filename)

1. Creates a workbook with one sheet
2. First row = headers
3. XLSX.writeFile() triggers browser download
```

### Export (Reports page)
```
services/reports.ts → getReportData(module, params)

Returns raw array of records from the relevant table.

Reports page → exportToExcel(data, filename, sheetName)
1. Converts data array to worksheet (XLSX.utils.json_to_sheet)
2. Creates workbook
3. Downloads as .xlsx
```

---

## Dashboard Customization

The dashboard at `/` is fully user-configurable:

### KPI Cards
- 6 cards: `openTickets`, `lowStock`, `delayedSuppliers`, `pendingRequests`, `devicesMaintenance`, `partsInstalledToday`
- **Reorder**: Drag-and-drop in edit mode → saved to `localStorage["dashboard-kpi-cards-order"]`
- **Resize**: Drag right edge handle → cycles through `lg:col-span-1 / 2 / 3` → saved to `localStorage["dashboard-kpi-sizes"]`

### Chart Sections
- 6 sections: `ticketsPerMonth`, `inventoryStatus`, `mostCommonIssues`, `partsConsumption`, `deviceMaintenance`, `recentActivity`
- **Reorder**: Same drag-and-drop → saved to `localStorage["dashboard-charts-order"]`
- **Resize**: Same resize handle → saved to `localStorage["dashboard-charts-sizes"]`

### Edit Mode
- Toggle via "Edit layout" / "Done" button.
- In edit mode: grip handles appear on cards; resize handles appear on right edges.
- All changes are auto-saved to `localStorage` on drop/resize.

---

## Notifications

### In-App Bell
- `NotificationDropdown` in the top bar fetches unread count + up to 8 recent notifications when opened.
- Unread count badge appears on the bell icon.

### Creating Notifications
Notifications can be created via the service:
```ts
import { createNotification } from "@/services/notifications";
await createNotification({
  user_id: "...",
  title: "Low stock alert",
  message: "Spare part X is below reorder level",
  module: "spare-parts",
  related_record_id: "part-uuid",
  priority: "high",
  branch_id: "...",
});
```

### n8n Integration
The public ticket server action fires a webhook to `N8N_NEW_TICKET_WEBHOOK_URL` (if set) after a ticket is created. The webhook receives the full ticket payload. n8n can then create notifications, send emails, etc.

---

## Database Schema

### Tables (15 total)

```
profiles             → extends auth.users; stores role + branch_id
branches             → branch registry (name, code, location)
suppliers            → vendor directory
spare_parts          → inventory catalog with stock levels
spare_part_assets    → M2M: spare part ↔ compatible assets
assets               → IT device registry
asset_history        → per-asset maintenance log
asset_attachments    → per-asset file attachments
stock_transactions   → IN/OUT inventory movements
purchase_requests    → procurement workflow
supplier_followups   → follow-up notes linked to suppliers/PRs
tickets              → support requests (internal + public)
notifications        → in-app notification feed
lookup_options       → configurable dropdown lists
```

### Key Relationships

```
branches ──< profiles (branch_id)
branches ──< tickets (branch_id)
branches ──< spare_parts (branch_id)
branches ──< assets (branch_id)
branches ──< purchase_requests (branch_id)

suppliers ──< spare_parts (supplier_id)
suppliers ──< purchase_requests (supplier_id)
suppliers ──< supplier_followups (supplier_id)

spare_parts ──< stock_transactions (spare_part_id)
spare_parts ──< purchase_requests (spare_part_id)
spare_parts >──< assets (via spare_part_assets)

assets ──< asset_history (asset_id)
assets ──< asset_attachments (asset_id)
assets ──< tickets (asset_id)

tickets ──< notifications (related_record_id, module = "tickets")
```

### RLS Summary

| Table | Anon (public) | Authenticated |
|---|---|---|
| `tickets` | INSERT only (via `rls-allow-anon.sql`) | Full access |
| All others | No access | Full access |

---

## Migrations Checklist

Before going to production, confirm all of these have been run in your Supabase SQL Editor:

- [ ] `database/schema.sql` — base schema
- [ ] `database/migrations/add-multi-branch.sql`
- [ ] `database/migrations/add-lookup-options.sql`
- [ ] `database/migrations/add-support-form-lookup-options.sql`
- [ ] `database/migrations/add-spare-part-assets.sql`
- [ ] `database/migrations/add-spare-part-consumable.sql`
- [ ] `database/migrations/add-ticket-attachment.sql`
- [ ] `database/migrations/add-asset-profile.sql`
- [ ] `database/migrations/add-admin-delete-all.sql`
- [ ] `database/rls-allow-anon.sql`
- [ ] At least one admin user set up (`set-admin-and-support-users.sql`)
- [ ] At least one branch created in `branches` table
