# UI/UX and Functionality Specification — IT Support Operations Dashboard

This document describes the full UI/UX and functionality of the IT Support Operations Dashboard so that an AI or team can improve usability, fix "not showing" issues, and make the app easier to use.

---

## 1. Overview

- **App name:** IT Support Operations Dashboard  
- **Purpose:** Centralized IT support operations management for multiple branches (e.g. ICAPP, FARMFRITES). Covers assets, spare parts, inventory, purchase requests, suppliers, tickets, notifications, and reporting.  
- **Tech stack:**  
  - Next.js 14 (App Router)  
  - Supabase (Auth, PostgreSQL, RLS, Storage)  
  - shadcn/ui (components), Tailwind CSS  
  - Recharts (dashboard and reports)  
  - React Hook Form + Zod (forms)  
  - RTL and locale support (English / العربية) via LocaleProvider; theme (light/dark/system) via next-themes  

---

## 2. Global layout and navigation

### Sidebar

- **Desktop:** Fixed left sidebar, width `w-64` (256px), hidden on small screens (`lg:flex`).  
- **Content:** Header block with app title ("{Branch} Support"), role badge (Admin / Support / Viewer), short role description, and Branch Switcher (admin only). Main nav and bottom nav below.  
- **Main nav items (in order):** Dashboard, Spare Parts, Inventory, Purchase Requests, Suppliers, Assets, Asset History, Tickets, Notifications, Reports.  
- **Bottom nav:** Separator then Settings.  
- **Active state:** Current route uses `secondary` button variant and `bg-primary/10 text-primary`.  
- **Mobile:** Sidebar becomes a slide-in drawer from the left; overlay (backdrop) when open; close on link click or overlay click. Menu trigger is in the top bar. Branch Switcher is not shown in the mobile drawer header (only in desktop sidebar).  

**File:** `components/layout/sidebar.tsx`

### Top bar

- **Sticky** below the viewport top, border-bottom, backdrop blur.  
- **Left:** Mobile menu button (visible only on small screens), then page title (e.g. "Dashboard", "Assets"), Branch Switcher, Role Badge.  
- **Right:** Notification dropdown (bell icon, unread count badge), Theme toggle (sun/moon, dropdown: Light / Dark / System), Language toggle (dropdown: English / العربية (RTL)), User menu (email, role, branch, Sign out).  

**File:** `components/layout/top-bar.tsx`

### Command bar

- **Shortcut:** Ctrl+K (Windows/Linux) or Cmd+K (Mac) opens a command dialog.  
- **Content:** Search input; list of pages (Dashboard, Spare Parts, Inventory, etc., plus "IT Support Request (public)" → `/support`). Choosing an item navigates and closes the dialog.  
- **Mounted:** In root layout, so available on all authenticated pages.  

**File:** `components/command-bar.tsx`  
**Layout:** `app/layout.tsx` renders `<CommandBar />` inside BranchProvider.

### Breadcrumbs

- **None.** Deep links (e.g. `/assets/[id]`, `/tickets/[id]`) are reached by clicking a row or a link; returning to the list is via browser Back or sidebar.

---

## 3. Roles and permissions

- **Admin**  
  - Sees all branches; Branch Switcher visible in sidebar and top bar.  
  - Full CRUD on all entities; Delete buttons on list pages (Assets, Spare Parts, Suppliers, Purchase Requests, Tickets, Inventory stock transactions).  
  - Access to Settings → "Dropdown lists" (`/settings/options`) to manage lookup options (asset device type/brand/department, spare part category, support form Department / Issue type / Priority).  

- **Support**  
  - Assigned to one branch; no branch switcher; sees only that branch’s data.  
  - Can create and edit (Add/Edit) on list pages; no Delete.  
  - Cannot access Settings → Dropdown lists.  

- **Viewer**  
  - Read-only; same branch scoping as support.  
  - List pages show a banner: "View only. Contact an administrator or support to add or edit [parts|tickets|assets|suppliers|purchase requests]."  
  - Add/Edit/Delete buttons are hidden.  

**Implementation:** `useBranch()` exposes `isAdmin`, `canEdit` (admin or support), `effectiveBranchId`, `userBranchId`, `branchLabel`, `role`. List pages gate actions and Delete with `canEdit` and `isAdmin`.

---

## 4. Page-by-page functionality and UI

### `/` — Dashboard

- **Purpose:** Overview KPIs and charts for the selected branch (or all for admin).  
- **UI:**  
  - **KPI cards:** Open Tickets, Low Stock, Delayed Suppliers, Pending Requests, Devices in Maintenance, Parts Installed Today. Order and size are configurable: "Edit layout" mode lets users drag to reorder and resize cards; persisted in `localStorage` (`dashboard-kpi-cards-order`, `dashboard-kpi-sizes`, `dashboard-charts-order`, `dashboard-charts-sizes`).  
  - **Charts section:** Tickets per month (bar), Inventory status (pie), Most common issues (bar), Parts consumption (bar), Device maintenance (bar), Recent activity (list). Same edit-layout behavior as KPIs.  
- **Loading:** "Loading dashboard..." while data fetches.  
- **Pain points:** Many cards/charts; can feel crowded on small screens; edit-layout mode is not obvious; no hint that layout is persisted.

### `/login` — Login

- **Purpose:** Authenticate via email/password or magic link (no auth required to view this page).  
- **UI:** Card with title "IT Support Dashboard", email and password inputs, "Sign in", "Or", "Send magic link to email". Theme and language dropdowns on the page. Link to public support form: "Submit a ticket" → `/support`.  
- **States:** Loading during sign-in; error message below form; after magic link request, message "Check your email for the sign-in link."  

### `/support` — Public IT support request form

- **Purpose:** Allow anyone to submit a ticket without logging in.  
- **UI:** Centered card "IT Support Request"; form with Full Name, Employee ID, Email (required), Department (dropdown if lookup options exist, else text input), Branch (required dropdown from `branches` table), Issue Type (dropdown), Priority (dropdown), Problem Description (required), optional Screenshot (file, max 5 MB, image types). Submit button.  
- **Success:** Form is replaced by a green success block with ticket number (e.g. TCK-2026-0001); no "Submit another" without refreshing.  
- **Pain points:** Success replaces entire form; no way to submit another request without reload; dropdown options come from lookup_options (admin-editable via Settings → Dropdown lists).

### `/assets` — Assets list

- **Purpose:** List and manage IT assets (devices) for the current branch.  
- **UI:** Filters: search (by name/tag/serial), status (All / active / in_maintenance / retired / lost / spare). Buttons: "Import from Excel", "+ Add asset". Table: Asset tag, Serial, Device type, Brand, Status, Department, Actions (View, Edit, Delete for admin). View links to `/assets/[id]`. Add/Edit open a dialog with form (asset tag, serial, device type, brand, model, status, assigned user name/email, department, location, notes, purchase/warranty dates). Device type, brand, department are dropdowns from lookup_options (Settings → Dropdown lists).  
- **Loading:** "Loading...". **Empty:** "No assets found."  
- **Pain points:** Dense table; filters and actions can be hard to scan; no breadcrumb from detail back to list.

### `/assets/[id]` — Asset detail

- **Purpose:** Show one asset with tabs.  
- **UI:** Tabs: Overview (details, assignment, notes), Maintenance History (asset_history entries with action type, description, spare part name, date), Installed Parts (from history where installed_part_id set), Tickets (linked tickets by asset_id), Attachments (links/files). Link "View all in Asset History" to `/asset-history?assetId=...`.  
- **File:** `components/asset-profile-tabs.tsx` used by `app/assets/[id]/page.tsx`.

### `/spare-parts` — Spare parts list

- **Purpose:** List and manage spare parts and stock.  
- **UI:** Filters: search, category (All / from lookup), supplier (All / list), "Low stock only" toggle. Buttons: "Import from Excel", "+ Add part". Table: Part name, SKU, Category, Supplier, Stock, Reorder, Type (e.g. "One-time use" badge), Price, Actions (Edit, Delete for admin, "Use"). "Use" opens a dialog: select Asset, Quantity; submits to `useSparePartOnAsset` (OUT transaction, decrement stock, log asset_history). Add/Edit open dialog with spare part form (category from lookup, compatible devices, consumable flag, linked assets, etc.).  
- **Loading:** "Loading...". **Empty:** "No parts found. Add one or adjust filters."  
- **Pain points:** Many filters; Use dialog needs asset selection and quantity; error display was fixed to show message instead of `[object Object]`.

### `/spare-parts/[id]` — Spare part detail

- **Purpose:** Show one spare part: name, stock, reorder level, linked device assets (from spare_part_assets), etc.

### `/inventory` — Inventory

- **Purpose:** Show stock transactions and current stock overview.  
- **UI:** "Stock transactions" card: filter by part (dropdown), table (Date, Part, Type IN/OUT, Quantity, Related asset, Notes, Actions). For OUT transactions with related_asset_id, "Undo use" button (reverses the use: IN transaction, restore stock, remove asset_history entry, delete original OUT). Admin also has "Delete" per row. Second card "Current stock overview": table of parts with current stock, reorder level, status (Low stock / OK).  
- **Loading:** "Loading...". **Empty:** "No transactions found."

### `/purchase-requests` — Purchase requests list

- **Purpose:** List and manage purchase requests for spare parts.  
- **UI:** Status filter (All / pending / ordered / delivered / cancelled). Buttons: "Import from Excel", "+ Add request". Table: Request number, Part, Quantity, Supplier, Status, Date, Actions (View, Delete for admin). Add/Edit via dialog.  
- **Loading:** "Loading...". **Empty:** "No requests found."  
- **Note:** Delivered status does not auto-create stock IN; it only updates status.

### `/purchase-requests/[id]` — Purchase request detail

- **Purpose:** View one purchase request (read-only or edit depending on role).

### `/suppliers` — Suppliers list

- **Purpose:** List and manage suppliers.  
- **UI:** Search, "+ Add supplier". Table: Name, Contact, Email, Phone, Actions (Edit, Delete for admin). Add/Edit in dialog.  
- **Loading:** "Loading...". **Empty:** "No suppliers found."

### `/suppliers/[id]` — Supplier detail

- **Purpose:** View one supplier; may show followups if implemented.

### `/tickets` — Tickets list

- **Purpose:** List and manage support tickets (internal view).  
- **UI:** Status filter (All / open / in_progress / waiting_user / resolved / closed). "Import from Excel", "+ Add ticket". Table: Ticket number, Requester, Department, Issue type, Priority, Status, Created, Actions (View, Edit, Delete for admin). Add/Edit dialog with full form (number, requester, email, department, issue type, description, priority, status).  
- **Loading:** "Loading...". **Empty:** "No tickets found."

### `/tickets/[id]` — Ticket detail

- **Purpose:** View one ticket (details, status, description, attachment link, etc.).

### `/asset-history` — Asset history

- **Purpose:** List asset_history entries (maintenance, spare part used, etc.).  
- **UI:** Filter by asset (dropdown). Table: date, asset, action type, description, part (if any), performed by.  
- **Loading:** "Loading...". **Empty:** "No history entries found."

### `/notifications` — Notifications full page

- **Purpose:** List all notifications for the branch.  
- **UI:** Card "Notification center"; list of items with title, optional priority badge, "New" if unread, message, date. Per-item "Mark as read" (full page only; dropdown in top bar does not mark as read).  
- **Loading:** "Loading...". **Empty:** "No notifications yet." with short explanation.

### Top-bar notifications dropdown

- Opens on bell click; fetches recent notifications (unreadOnly: false, limit 8). Shows "View all" link to `/notifications`. Clicking an item goes to related record (e.g. `/tickets/[id]`) or notifications page. Does not mark as read on click.

### `/reports` — Reports

- **Purpose:** Export data and view simple analytics.  
- **UI:** Report type select: Tickets report, Inventory / spare parts, Suppliers, Purchase requests, IT assets. "Export to Excel" button (uses selected report type and current branch). Analytics section: tickets per month (bar chart), maintenance per month (bar chart), supplier stats (delivered / delayed).  
- **Loading:** During export ("Loading..." or spinner). **Error:** Shown if export fails.

### `/settings` — Settings

- **Purpose:** User preferences and account info.  
- **UI:** Sections: Preferences (Appearance — theme dropdown; Language — English / العربية), Account (email, role, branch from profile), Dashboard & about (app version, info). Admin: link to "Dropdown lists" → `/settings/options`.  
- **File:** `app/settings/page.tsx`

### `/settings/options` — Dropdown lists (admin only)

- **Purpose:** Manage lookup_options used across the app.  
- **UI:** Category dropdown: Device types (assets), Brands (assets), Departments (assets), Categories (spare parts), Department (support form), Issue type (support form), Priority (support form). List of options per category (sort order input, label, Delete). "New option label" input + Add.  
- **Non-admin:** Redirect or message "Admin only" with link back to Settings.  
- **File:** `app/settings/options/page.tsx`

---

## 5. Multi-branch behavior

- All operational data (assets, spare_parts, stock_transactions, purchase_requests, suppliers, tickets, notifications, asset_history, etc.) is scoped by `branch_id`.  
- RLS (Row Level Security) in Supabase enforces: support/viewer see only their branch; admin can see all.  
- Branch Switcher (admin only) sets the "effective" branch for the session; list pages and dashboard pass `effectiveBranchId` (or `userBranchId` for support) to APIs.  
- Sidebar header shows "{Branch} Support" (e.g. "ICAPP Support") or "All Branches" for admin when no branch selected.  
- Public support form: user chooses Branch from dropdown (from `branches` table); ticket is created with that `branch_id`.

---

## 6. Forms and dialogs

- **Pattern:** List page has "Add" and row "Edit" (and sometimes "View"). Clicking Add/Edit opens a modal Dialog containing the form (React Hook Form + Zod). No dedicated create routes (e.g. no `/assets/new`).  
- **Excel import:** Separate dialog: file input, preview (first 5 rows), "Import" runs parsing and insert; result shows success count, failed count, and per-row errors. Template download available on some pages (e.g. spare parts, assets, tickets).  
- **Use spare part dialog (Spare parts):** Select asset from dropdown, quantity; "Use part" calls `useSparePartOnAsset`; errors shown inline in dialog (message extracted from Error or object.message to avoid `[object Object]`).

---

## 7. Loading, empty, and error states

- **Loading:** Most list/dashboard pages show plain text "Loading..." or "Loading dashboard..." with no skeleton or spinner.  
- **Empty:** Tables show a single row with message like "No assets found.", "No tickets found.", "No transactions found.", "No parts found. Add one or adjust filters."  
- **Errors:**  
  - Form validation: inline under fields or in a banner at top of form.  
  - Server/API: sometimes `alert(message)` (e.g. Undo use, Delete), sometimes inline red banner or message in dialog (e.g. Use part). Pattern for API errors: use `e instanceof Error ? e.message : (e?.message ?? String(e))` to avoid showing `[object Object]`.  
- **No global toast/snackbar:** Success is implied by dialog closing and list refreshing; no explicit "Saved" toast.

---

## 8. Public vs authenticated routes

- **Public (no login required):** `/support`, `/ticket-request` (redirects to `/support`), `/login`.  
- **Protected:** All other routes. Middleware redirects unauthenticated users to `/login` when `REQUIRE_AUTH=true`.  
- **Auth:** Supabase Auth (email/password, magic link). Profile (role, branch_id) in `profiles` table; BranchProvider loads profile and exposes role and branch.

---

## 9. Known UI/UX pain points (for improvement brief)

- **Dense lists:** Many list pages are table-heavy with limited visual hierarchy; filters and action buttons can be hard to scan.  
- **No breadcrumbs:** From a detail page (e.g. asset, ticket) back to list is only browser Back or sidebar; context is easy to lose.  
- **Viewer messaging:** Generic "View only. Contact an administrator or support to…" on every list page; could be more contextual or friendlier per page.  
- **Dashboard:** Many KPI cards and charts; on small screens or with many sections it feels crowded; "Edit layout" (drag/reorder/resize) is not discoverable.  
- **Notifications:** Dropdown loads on open; "View all" goes to full page; no mark-as-read in dropdown; unread count can feel disconnected from list.  
- **Support form:** Success state replaces entire form; no "Submit another" without refresh.  
- **No global toasts:** Success feedback is only by closing dialog and seeing updated list; no consistent success message.  
- **RTL:** Locale provider and `dir`/`lang` support RTL for Arabic, but some components may need RTL-specific checks (alignment, icons, spacing).  
- **Mobile:** Sidebar becomes drawer; tables often overflow horizontally; no dedicated mobile card/list view; filters can be cramped.  
- **Accessibility:** Labels and focus management in dialogs and forms could be reviewed; some buttons rely on aria-label only.

---

## 10. Recommendations for the improving AI

- **Improve hierarchy:** Differentiate primary vs secondary actions; group filters; consider collapsible sections or tabs where there are many options.  
- **Consistency:** Unify loading (e.g. skeletons or spinners), empty states (illustration + CTA where appropriate), and error display (inline vs toast vs alert).  
- **Discoverability:** Make dashboard "Edit layout" obvious (e.g. persistent "Customize" or onboarding hint); surface important actions (e.g. "Use" on spare parts).  
- **Navigation:** Add breadcrumbs for detail pages (e.g. Assets > Asset tag); consider "Back to list" link on detail pages.  
- **Mobile/tablet:** Consider horizontal scroll wrappers for tables, or switch to card/list view on small screens; ensure filters and buttons are tappable and readable.  
- **Accessibility:** Ensure form labels are associated, focus is trapped in dialogs and restored on close, and key actions are keyboard reachable.  
- **Success feedback:** Introduce a lightweight toast/snackbar for "Saved" / "Deleted" / "Imported" to confirm actions without relying only on list refresh.  
- **Support form:** After success, offer "Submit another request" without full page refresh.  
- **Notifications:** Optionally mark as read when opening from dropdown or clicking an item; keep unread count in sync.
