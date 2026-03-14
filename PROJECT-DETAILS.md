# PROJECT-DETAILS.md — IT Support Operations Dashboard

Full extraction of UI, design, and code structure for use by another AI to plan and execute a UI/UX redesign. **Read-only analysis; no code was changed.**

---

## STEP 1 — Project Structure

**Note:** This project does **not** use an `(dashboard)` route group. All pages live directly under `app/`. Ignored: `node_modules`, `.next`, `.git`.

```
app/
  layout.tsx
  page.tsx
  globals.css
  login/
    page.tsx
  support/
    page.tsx
    actions.ts
  ticket-request/
    page.tsx
  assets/
    page.tsx
    [id]/
      page.tsx
  spare-parts/
    page.tsx
    [id]/
      page.tsx
  inventory/
    page.tsx
  purchase-requests/
    page.tsx
    [id]/
      page.tsx
  suppliers/
    page.tsx
    [id]/
      page.tsx
  tickets/
    page.tsx
    [id]/
      page.tsx
  asset-history/
    page.tsx
  notifications/
    page.tsx
  reports/
    page.tsx
  settings/
    page.tsx
    options/
      page.tsx

components/
  layout/
    dashboard-layout.tsx
    sidebar.tsx
    top-bar.tsx
    notification-dropdown.tsx
  ui/
    button.tsx
    card.tsx
    input.tsx
    label.tsx
    textarea.tsx
    select.tsx
    table.tsx
    badge.tsx
    separator.tsx
    dialog.tsx
    dropdown-menu.tsx
    tabs.tsx
    command.tsx
  branch-provider.tsx
  branch-switcher.tsx
  locale-provider.tsx
  theme-provider.tsx
  role-badge.tsx
  command-bar.tsx
  ticket-form.tsx
  asset-profile-tabs.tsx

modules/
  spare-parts/
    spare-part-form.tsx

lib/
  utils.ts
  constants.ts
  excel-import.ts
  ticket-service.ts
  supabase/
    client.ts
    server.ts
    middleware.ts
    types.ts
    index.ts

services/
  assets.ts
  branches.ts
  profile.ts
  spare-parts.ts
  suppliers.ts
  stock-transactions.ts
  purchase-requests.ts
  tickets.ts
  asset-history.ts
  asset-attachments.ts
  notifications.ts
  dashboard.ts
  activity.ts
  reports.ts
  lookup-options.ts

database/
  schema.sql
  migrations/
    add-multi-branch.sql
    add-lookup-options.sql
    add-support-form-lookup-options.sql
    add-admin-delete-all.sql
    add-spare-part-consumable.sql
    add-spare-part-assets.sql
    add-asset-profile.sql
    add-ticket-attachment.sql
    set-admin-and-support-users.sql
    assign-support-user-branch.sql
  rls-allow-anon.sql

docs/
  UI-UX-and-Functionality-Spec.md
```

---

## STEP 2 — Tech Stack & Dependencies

**Source:** `package.json`

- **Framework:** Next.js ^14.2.35 (App Router)
- **React:** ^18.3.1
- **UI / components:** shadcn/ui-style (Radix primitives), no single version field; components in `components/ui/`
- **Styling:** Tailwind CSS ^3.4.15, tailwindcss-animate ^1.0.7
- **Data / auth:** @supabase/supabase-js ^2.47.10, @supabase/ssr ^0.5.2
- **Forms:** react-hook-form ^7.53.2, @hookform/resolvers ^3.9.1, zod ^3.23.8
- **Charts:** recharts ^2.14.1
- **Icons:** lucide-react ^0.460.0
- **Theme:** next-themes ^0.4.6
- **Command palette:** cmdk ^1.1.1
- **Tables:** @tanstack/react-table ^8.20.5
- **Excel:** xlsx ^0.18.5
- **Utilities:** class-variance-authority ^0.7.0, clsx ^2.1.1, tailwind-merge ^2.5.4, date-fns ^4.1.0
- **Radix:** @radix-ui/react-accordion, alert-dialog, avatar, dialog, dropdown-menu, label, popover, select, separator, slot, tabs, toast

**Dev dependencies:** @types/node, @types/react, @types/react-dom, autoprefixer, eslint, eslint-config-next, postcss, tailwindcss, tailwindcss-animate, typescript

---

## STEP 3 — Tailwind Config

**File:** `tailwind.config.ts`

- **darkMode:** `["class"]`
- **content:** `./pages/**/*.{js,ts,jsx,tsx,mdx}`, `./components/**/*.{js,ts,jsx,tsx,mdx}`, `./app/**/*.{js,ts,jsx,tsx,mdx}`, `./modules/**/*.{js,ts,jsx,tsx,mdx}`
- **theme.extend.colors:** All use CSS variables `hsl(var(--name))`:
  - border, input, ring, background, foreground
  - primary (DEFAULT, foreground), secondary, destructive, muted, accent, popover, card
- **theme.extend.borderRadius:** lg: `var(--radius)`, md: `calc(var(--radius) - 2px)`, sm: `calc(var(--radius) - 4px)`
- **plugins:** `require("tailwindcss-animate")`
- No custom fonts or spacing in config; fonts applied in `app/layout.tsx` (Inter from next/font/google).

---

## STEP 4 — Global Layout

### app/layout.tsx (full content)

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { BranchProvider } from "@/components/branch-provider";
import { CommandBar } from "@/components/command-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Support Operations Dashboard",
  description: "Centralized IT support operations management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LocaleProvider>
            <BranchProvider>
              {children}
              <CommandBar />
            </BranchProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- **Styling:** `inter.className` on body (Inter font). No other layout Tailwind classes in root layout.
- **No** `app/(dashboard)/layout.tsx` exists.

### components/layout/dashboard-layout.tsx (full content)

```tsx
"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" dir="ltr">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <TopBar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- **Styling:** `min-h-screen bg-background`, main content `lg:pl-64` (256px left padding for sidebar), `p-4 lg:p-6`.
- **dir:** `dir="ltr"` (RTL not applied in dashboard layout; locale sets dir on document).
- **Sidebar width:** 256px (`w-64` = 16rem).

### components/layout/sidebar.tsx (full content)

See file for full JSX. Summary:

- **Desktop sidebar:** `fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r bg-card lg:flex`
- **Mobile:** Overlay `fixed inset-0 z-40 bg-black/50 lg:hidden`; drawer `fixed left-0 top-0 z-50 ... w-64 ... transition-transform duration-200 ease-out lg:hidden`, `translate-x-0` / `-translate-x-full`
- **Colors:** `bg-card`, `border-r`, `text-primary` (icon), `text-xs text-muted-foreground` (role label), `bg-primary/10 text-primary` for active nav
- **Active nav:** `variant={isActive ? "secondary" : "ghost"}`, `className={cn("w-full justify-start gap-3", isActive && "bg-primary/10 text-primary")}`
- **Role-based visibility:** BranchSwitcher shown for all; role label from `useBranch()` (admin / support / viewer). No nav items hidden by role.
- **Animations:** Mobile drawer `transition-transform duration-200 ease-out`

### components/layout/top-bar.tsx (full content)

See file for full JSX. Summary:

- **Container:** `sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6`
- **Height:** h-16 (4rem)
- **Left:** Menu button (lg:hidden), then `text-xl font-semibold` title, BranchSwitcher, RoleBadge
- **Right:** NotificationDropdown, theme dropdown (Sun/Moon), language dropdown, user dropdown (email, role, branch, Sign out)
- **Theme transition:** Sun/Moon `rotate-0 scale-100` / `dark:-rotate-90 dark:scale-0` and inverse for Moon
- **User menu:** Only when `user` is set (auth state)

---

## STEP 5 — Per-Page Analysis

**Convention:** Routes are under `app/` directly (no `(dashboard)`). Dashboard pages use `<DashboardLayout title="...">`; login and support do not.

### Page: / (Dashboard)
**File:** `app/page.tsx`

**Loading state:** "Loading dashboard..." (`text-muted-foreground`).
**Empty state:** Demo-mode banner when no DB; chart placeholders show "No data" in dashed borders.
**Error handling:** Inline demo banner; createError for dialogs where applicable.
**Filters:** None on dashboard; branch from BranchProvider.
**Table columns:** N/A (cards and charts).
**Action buttons:** "Edit layout", "Done" (edit mode); card resize handle.
**Dialogs/Modals:** None.
**Role gating:** `isAdmin` for welcome text; branch affects data.
**Tailwind:** `mb-4 rounded-lg border`, `bg-muted/30`, `text-muted-foreground`, `rounded-md border border-dashed`, `bg-amber-500/10`, `border-amber-500/50`, `bg-primary/10`, `border-muted-foreground/30`.
**Pain points:** Edit layout not discoverable; many cards/charts; localStorage for layout keys.

### Page: /login
**File:** `app/login/page.tsx`

**Loading state:** Suspense fallback with "Loading..." in Card.
**Empty state:** N/A.
**Error handling:** Inline `border-destructive/50 bg-destructive/10 text-destructive`; `setError(err.message)`.
**Filters:** None.
**Action buttons:** Sign in, Send magic link; theme and language in header.
**Dialogs:** None.
**Role gating:** None.
**Tailwind:** `flex min-h-screen flex-col bg-muted/30`, `rounded-md border border-destructive/50`, `bg-card px-2 text-muted-foreground`.
**Pain points:** None.

### Page: /support
**File:** `app/support/page.tsx`

**Loading state:** None (form or success).
**Empty state:** N/A.
**Error handling:** `setError(result.error)` or catch message; shown in TicketForm.
**Filters:** None.
**Action buttons:** Submit Request (in form).
**Dialogs:** None.
**Role gating:** None (public).
**Tailwind:** `min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4`, `max-w-lg`, `border-green-500/50 bg-green-500/10`, `text-green-800 dark:text-green-200`.
**Pain points:** Success replaces entire form; no "Submit another" without refresh.

### Page: /ticket-request
**File:** `app/ticket-request/page.tsx`

Redirect only: `redirect("/support")`. No UI.

### Page: /assets
**File:** `app/assets/page.tsx`

**Loading state:** "Loading..." `text-muted-foreground`.
**Empty state:** "No assets found." (table row, colSpan 7).
**Error handling:** `setCreateError`; delete uses `alert(e instanceof Error ? e.message : String(e))`.
**Filters:** Search (input), Status (Select: all, active, in_maintenance, retired, lost, spare).
**Table columns:** Tag, Type, Brand / Model, Assigned to, Department, Status, Actions.
**Action buttons:** + Add asset, Import from Excel (canEdit); per row: Edit (canEdit), Delete (isAdmin).
**Dialogs:** Add/Edit asset form dialog; Import from Excel dialog (file, preview, Import, template download).
**Role gating:** canEdit for Add/Edit/Import; isAdmin for Delete; banner "View only..." when !canEdit.
**Tailwind:** Card, `rounded-md border`, `border-input`, `bg-destructive/10`, `text-destructive`, `hover:bg-accent`.
**Pain points:** `alert()` on delete; `confirm()` for delete.

### Page: /assets/[id]
**File:** `app/assets/[id]/page.tsx`

Server component. **Loading state:** N/A. **Empty state:** notFound(). **Error handling:** N/A. **Filters:** None. **Action buttons:** Back (Link to /assets). **Dialogs:** None. **Role gating:** None. **Tailwind:** Via AssetProfileTabs and Card. **Pain points:** None.

### Page: /spare-parts
**File:** `app/spare-parts/page.tsx`

**Loading state:** "Loading..." `text-muted-foreground`.
**Empty state:** "No parts found. Add one or adjust filters." (colSpan 9).
**Error handling:** createError banner; Use dialog inline error `border-destructive/50 bg-destructive/10`; delete `alert(e instanceof Error ? e.message : String(e))`.
**Filters:** Search, Category (Select), Supplier (Select), Low stock only (toggle).
**Table columns:** Part name, SKU, Category, Supplier, Stock, Reorder, Price, Type, Actions.
**Action buttons:** + Add part, Import from Excel (canEdit); per row: Edit, Delete (isAdmin), Use (canEdit, disabled when current_stock <= 0).
**Dialogs:** Add/Edit (SparePartForm); Import from Excel; Use spare part (asset Select, quantity, Use part).
**Role gating:** canEdit for Add/Edit/Import/Use; isAdmin for Delete; "View only..." when !canEdit.
**Tailwind:** Same patterns as assets; error box `rounded-md border border-destructive/50 bg-destructive/10`.
**Pain points:** `alert()` on delete; `confirm()` for delete; error message extraction for Use dialog (fixed to avoid [object Object]).

### Page: /spare-parts/[id]
**File:** `app/spare-parts/[id]/page.tsx`

**Loading state:** N/A (data fetch). **Empty state:** notFound if no part. **Error handling:** N/A. **Filters:** None. **Action buttons:** Back. **Dialogs:** None. **Role gating:** None. **Tailwind:** Card, `text-muted-foreground`. **Pain points:** None.

### Page: /inventory
**File:** `app/inventory/page.tsx`

**Loading state:** "Loading..." `text-muted-foreground`.
**Empty state:** "No transactions found." (colSpan 6 or 7).
**Error handling:** `alert(e instanceof Error ? e.message : String(e))` for Undo use and Delete.
**Filters:** Part (Select: All parts + list of parts).
**Table columns:** Date, Part, Type, Quantity, Related asset, Notes, Actions.
**Action buttons:** Undo use (OUT + related_asset_id, canEdit); Delete (isAdmin).
**Dialogs:** None.
**Role gating:** (isAdmin || canEdit) for Actions column.
**Tailwind:** `text-muted-foreground`, `text-destructive hover:text-destructive`.
**Pain points:** `alert()`; `confirm()` for Undo and Delete.

### Page: /purchase-requests
**File:** `app/purchase-requests/page.tsx`

**Loading state:** "Loading..." **Empty state:** "No requests found." **Error handling:** alert on delete; createError inline. **Filters:** Status (All, pending, ordered, delivered, cancelled). **Table columns:** Request #, Part, Quantity, Supplier, Status, Date, Actions. **Action buttons:** + Add request, Import (canEdit); View, Delete (isAdmin). **Dialogs:** Add/Edit request; Import Excel. **Role gating:** canEdit for Add/Import; isAdmin for Delete; "View only..." when !canEdit. **Pain points:** alert(); confirm() for delete.

### Page: /purchase-requests/[id]
**File:** `app/purchase-requests/[id]/page.tsx`

Detail page. **Loading/Empty/Error:** Standard. **Filters:** None. **Actions:** Back. **Dialogs:** None. **Role gating:** None.

### Page: /suppliers
**File:** `app/suppliers/page.tsx`

**Loading state:** "Loading..." **Empty state:** "No suppliers found." **Error handling:** alert on delete; createError inline. **Filters:** Search. **Table columns:** Name, Contact, Email, Phone, Actions. **Action buttons:** + Add supplier (canEdit); Edit, Delete (isAdmin). **Dialogs:** Add/Edit; Import (if present). **Role gating:** canEdit; isAdmin Delete; "View only..." when !canEdit. **Pain points:** alert(); confirm() for delete.

### Page: /suppliers/[id]
**File:** `app/suppliers/[id]/page.tsx`

Detail page. **Pain points:** None.

### Page: /tickets
**File:** `app/tickets/page.tsx`

**Loading state:** "Loading..." **Empty state:** "No tickets found." **Error handling:** alert on delete; createError inline; form errors under fields. **Filters:** Status (All, open, in_progress, waiting_user, resolved, closed). **Table columns:** Ticket #, Requester, Department, Issue type, Priority, Status, Actions. **Action buttons:** + Add ticket, Import (canEdit); View, Edit (in dialog), Delete (isAdmin). **Dialogs:** Add/Edit ticket form; Import Excel. **Role gating:** canEdit; isAdmin Delete; "View only..." when !canEdit. **Pain points:** alert(); confirm() for delete.

### Page: /tickets/[id]
**File:** `app/tickets/[id]/page.tsx`

Detail page. **Pain points:** None.

### Page: /asset-history
**File:** `app/asset-history/page.tsx`

**Loading state:** "Loading..." **Empty state:** "No history entries found." (colSpan 5). **Error handling:** try/catch load, console.error. **Filters:** Asset (Select: All assets + list). **Table columns:** Date, Asset, Action, Description, Part installed. **Action buttons:** None. **Dialogs:** None. **Role gating:** None. **Tailwind:** `text-muted-foreground`, `max-w-[300px] truncate`. **Pain points:** None.

### Page: /notifications
**File:** `app/notifications/page.tsx`

**Loading state:** "Loading..." **Empty state:** "No notifications yet." + short explanation in dashed border. **Error handling:** console.error. **Filters:** None. **Table columns:** N/A (list with title, badge, message, date, Mark as read). **Action buttons:** Mark as read per item. **Dialogs:** None. **Role gating:** None. **Tailwind:** `bg-muted/30` for unread, `text-muted-foreground`. **Pain points:** None.

### Page: /reports
**File:** `app/reports/page.tsx`

**Loading state:** Set during export (Loader2 or similar). **Empty state:** N/A. **Error handling:** `setError(e.message)` on export fail; displayed `text-sm text-destructive`. **Filters:** Report type (Select: tickets, inventory, suppliers, purchase_requests, assets). **Action buttons:** Export to Excel. **Dialogs:** None. **Role gating:** None. **Tailwind:** `bg-muted/50`, `text-muted-foreground`. **Pain points:** None.

### Page: /settings
**File:** `app/settings/page.tsx`

**Loading state:** N/A. **Empty state:** N/A. **Error handling:** N/A. **Filters:** None. **Action buttons:** Theme select, Language select; admin link to "Dropdown lists". **Dialogs:** None. **Role gating:** isAdmin for Dropdown lists link. **Tailwind:** `text-sm font-medium text-muted-foreground`, Card layout, `max-w-3xl`. **Pain points:** None.

### Page: /settings/options
**File:** `app/settings/options/page.tsx`

**Loading state:** "Loading…" text. **Empty state:** Empty list. **Error handling:** Inline `border-destructive/50 bg-destructive/10 text-destructive`. **Filters:** Category (select: device type, brand, department, spare part category, support department/issue type/priority). **Action buttons:** Add (new option); Delete per row; sort_order blur save. **Dialogs:** None. **Role gating:** isAdmin only; else "Admin only" card with Back. **Tailwind:** `flex h-10 w-full rounded-md border border-input bg-background`. **Pain points:** confirm() for Remove option.

---

## STEP 6 — Shared Components Inventory

### Component: DashboardLayout
**File:** `components/layout/dashboard-layout.tsx`
**Props:** children, title?: string
**Styling:** min-h-screen bg-background, lg:pl-64, p-4 lg:p-6
**Used on pages:** All dashboard pages (/, /assets, /spare-parts, /inventory, etc.)
**Issues:** dir="ltr" hardcoded (RTL not applied to main area by layout).

### Component: Sidebar
**File:** `components/layout/sidebar.tsx`
**Props:** mobileOpen?, onMobileClose?
**Styling:** w-64, bg-card, border-r, bg-primary/10 text-primary (active)
**Used on pages:** Via DashboardLayout
**Issues:** None.

### Component: TopBar
**File:** `components/layout/top-bar.tsx`
**Props:** title?, className?, onMenuClick?
**Styling:** h-16, sticky, border-b, bg-background/95, backdrop-blur
**Used on pages:** Via DashboardLayout
**Issues:** None.

### Component: NotificationDropdown
**File:** `components/layout/notification-dropdown.tsx`
**Props:** None
**Styling:** w-[360px], max-h-[320px], bg-destructive for count badge
**Used on pages:** Via TopBar
**Issues:** None.

### Component: BranchProvider / useBranch
**File:** `components/branch-provider.tsx`
**Props:** children
**Used:** Root layout
**Issues:** None.

### Component: BranchSwitcher
**File:** `components/branch-switcher.tsx`
**Used:** Sidebar, TopBar
**Issues:** None.

### Component: RoleBadge
**File:** `components/role-badge.tsx`
**Styling:** bg-primary text-primary-foreground; support: bg-blue-600/90 text-white; viewer: text-muted-foreground
**Used:** Sidebar, TopBar
**Issues:** None.

### Component: LocaleProvider / useLocale
**File:** `components/locale-provider.tsx`
**Used:** Root layout, login, top bar
**Issues:** None.

### Component: ThemeProvider
**File:** `components/theme-provider.tsx`
**Used:** Root layout
**Issues:** None.

### Component: CommandBar
**File:** `components/command-bar.tsx`
**Styling:** Command dialog (cmdk), bg-popover
**Used:** Root layout
**Issues:** CommandEmpty "No results found."

### Component: TicketForm
**File:** `components/ticket-form.tsx`
**Props:** onSubmit, isSubmitting, error, branches, departmentOptions?, issueTypeOptions?, priorityOptions?
**Styling:** border-destructive/50 bg-destructive/10, file:bg-primary file:text-primary-foreground
**Used on pages:** /support
**Issues:** None.

### Component: AssetProfileTabs
**File:** `components/asset-profile-tabs.tsx`
**Props:** asset, maintenanceHistory, ticketsLinked, attachments
**Styling:** Tabs, Card, hover:bg-muted/50
**Used on pages:** /assets/[id]
**Issues:** None.

### UI components (shadcn-style)
**Files:** `components/ui/button.tsx`, card.tsx, input.tsx, label.tsx, textarea.tsx, select.tsx, table.tsx, badge.tsx, separator.tsx, dialog.tsx, dropdown-menu.tsx, tabs.tsx, command.tsx
**Styling:** All use Tailwind with border-input, bg-background, bg-primary, text-primary-foreground, muted, destructive, accent, popover, ring, etc. See grep results in Step 9 for recurring classes.
**Used on pages:** Throughout app
**Issues:** None critical; some focus rings and aria from Radix.

### SparePartForm (module)
**File:** `modules/spare-parts/spare-part-form.tsx`
**Props:** categoryOptions, assets, linkedAssetIdsForForm, onSubmit, initialData, etc.
**Styling:** hover:bg-muted/50, text-muted-foreground
**Used on pages:** /spare-parts (in dialog)
**Issues:** None.

---

## STEP 7 — Hooks & Context

### useBranch()
**File:** `components/branch-provider.tsx`

**Returns:** branches, selectedBranchId, setSelectedBranchId, effectiveBranchId, userBranchId, role, isAdmin, canEdit, branchLabel, loading.

- **effectiveBranchId:** Admin: selected branch or null (all). Support/Viewer: user's branch.
- **canEdit:** true for admin and support; false for viewer.
- **isAdmin:** role === "admin".
- **branchLabel:** Name of effective branch or "All Branches" (admin) or "IT" (no branch).

### useLocale() / LocaleProvider
**File:** `components/locale-provider.tsx`

**Returns:** locale ("en" | "ar"), setLocale, dir ("ltr" | "rtl").
**Behavior:** Persists to localStorage; sets document.documentElement.lang and document.documentElement.dir.

### Other hooks
- **useTheme:** from next-themes (in layout, login, top bar).
- **usePathname:** in sidebar for active state.
- **useRouter:** in top bar (logout), command bar (navigation).
- No other custom hooks in `hooks/` (folder not present; hooks live in components).

---

## STEP 8 — Supabase / Data Layer

### Table names (from lib/supabase/types.ts)

branches, lookup_options, profiles, suppliers, spare_parts, assets, spare_part_assets, stock_transactions, purchase_requests, supplier_followups, asset_history, tickets, notifications, asset_attachments.

### Column patterns

- **branch_id:** Present on: suppliers, spare_parts, assets, stock_transactions, purchase_requests, supplier_followups, asset_history, tickets, notifications; used for RLS and filtering.
- **profiles:** id, email, full_name, role, branch_id, avatar_url, created_at, updated_at.
- **tickets:** ticket_number, requester_name, email, department, issue_type, description, priority, status, assigned_to_id, attachment_url, branch_id, asset_id, etc.
- **asset_history:** asset_id, action_type, description, installed_part_id, performed_by_id, performed_at, branch_id.
- **stock_transactions:** spare_part_id, transaction_type, quantity, related_asset_id, branch_id.

### RLS patterns

- **add-multi-branch.sql:** Policies "X branch or admin" for authenticated: `USING (current_user_is_admin() OR branch_id = current_user_branch_id())`, same WITH CHECK for insert/update.
- **add-admin-delete-all.sql:** "Admin delete all X" FOR DELETE TO authenticated USING (current_user_is_admin()).
- **lookup_options:** anon read; authenticated admin insert/update/delete.
- **asset_history:** anon read/insert/update/delete; authenticated branch or admin.

### Server actions / API

- **app/support/actions.ts:** createPublicTicketAction(FormData) — creates ticket, optional attachment upload to Supabase Storage bucket "ticket-attachments".
- No other API route handlers under app/api; all data via Supabase client or server client from services.

### Client vs server Supabase

- **lib/supabase/client.ts:** createBrowserClient (for Client Components).
- **lib/supabase/server.ts:** createServerClient (cookies) for Server Components / Route Handlers / Server Actions.
- **asset-history.ts, stock-transactions.ts, etc.:** Use createClient from client (browser); when called from Server Components they still use browser client.

---

## STEP 9 — Current Color & Style Audit

### bg- classes (unique)

bg-background, bg-card, bg-primary, bg-primary/10, bg-primary/5, bg-secondary, bg-muted, bg-muted/30, bg-muted/50, bg-accent, bg-destructive, bg-destructive/10, bg-popover, bg-input, bg-transparent, bg-green-500/10, bg-green-600, bg-amber-500/10, bg-amber-500, bg-black/50, bg-black/80, bg-blue-600/90.

### text- color classes

text-foreground, text-primary, text-muted-foreground, text-destructive, text-primary-foreground, text-secondary-foreground, text-accent-foreground, text-card-foreground, text-popover-foreground, text-destructive-foreground, text-green-800, text-green-200 (dark), text-amber-800, text-amber-200 (dark).

### border- color classes

border, border-border, border-r, border-b, border-t, border-input, border-destructive, border-destructive/50, border-green-500/50, border-amber-500/50, border-muted-foreground/30.

### Hardcoded hex / style

None found in app or components (only HSL vars in globals.css).

### alert( occurrences

- app/inventory/page.tsx: 140, 158 (Undo use, Delete — e.message or String(e))
- app/spare-parts/page.tsx: 443 (Delete)
- app/tickets/page.tsx: 359 (Delete)
- app/purchase-requests/page.tsx: 378 (Delete)
- app/suppliers/page.tsx: 325 (Delete)
- app/assets/page.tsx: 445 (Delete)

### window.confirm( occurrences

- app/settings/options/page.tsx: 59 (Remove this option?)
- app/inventory/page.tsx: 135 (Undo this use?), 153 (Delete this stock transaction?)
- app/spare-parts/page.tsx: 438 (Delete spare part?)
- app/tickets/page.tsx: 354 (Delete ticket?)
- app/purchase-requests/page.tsx: 373 (Delete purchase request?)
- app/suppliers/page.tsx: 320 (Delete supplier?)
- app/assets/page.tsx: 440 (Delete asset?)

### [object Object] in code

None (handled in spare-parts Use dialog with e.message / object.message extraction).

### "Loading..." plain text

- app/inventory/page.tsx: 81
- app/spare-parts/page.tsx: 361
- app/tickets/page.tsx: 304
- app/purchase-requests/page.tsx: 323
- app/suppliers/page.tsx: 275
- app/assets/page.tsx: 389
- app/notifications/page.tsx: 53
- app/asset-history/page.tsx: 79
- app/login/page.tsx: 33 (in loginCopy.en.loading)
- app/settings/options/page.tsx: 138 ("Loading…")
- app/page.tsx: 605 ("Loading dashboard...")

### "No X found" plain text

- app/inventory/page.tsx: "No transactions found."
- app/spare-parts/page.tsx: "No parts found. Add one or adjust filters."
- app/tickets/page.tsx: "No tickets found."
- app/purchase-requests/page.tsx: "No requests found."
- app/suppliers/page.tsx: "No suppliers found."
- app/assets/page.tsx: "No assets found."
- app/asset-history/page.tsx: "No history entries found."
- app/notifications/page.tsx: "No notifications yet." (+ explanation)
- components/command-bar.tsx: "No results found."

---

## STEP 10 — RTL & i18n

### dir="rtl"

- **LocaleProvider** sets `document.documentElement.dir = "rtl"` when locale is "ar".
- **DashboardLayout** sets `dir="ltr"` on main wrapper, overriding document dir for dashboard content.
- **globals.css:** `[dir="rtl"] { text-align: right; }`, `[dir="rtl"] .rtl\:flip { transform: scaleX(-1); }`.

### Language keys

- **Login page:** loginCopy.en / loginCopy.ar (title, subtitle, email, password, signIn, signingIn, or, magicLink, magicLinkSent, publicForm, submitTicket, loading).
- No global JSON translation files; copy is in-component.

### RTL-specific handling

- Only globals.css and LocaleProvider; no component uses rtl: prefix or dir checks except layout forcing ltr.

### Missing RTL

- Dashboard layout forces ltr, so dashboard pages do not flip for Arabic.
- Sidebar/top bar do not flip (no rtl: classes).
- Tables and forms not explicitly RTL-aware.

---

**END OF PROJECT-DETAILS.md**
