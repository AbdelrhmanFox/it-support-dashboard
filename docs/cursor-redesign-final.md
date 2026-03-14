# CURSOR REDESIGN PROMPT — IT Support Operations Dashboard
# Based on: actual screenshot analysis + full PROJECT-DETAILS.md extraction
# DO NOT change any data fetching, Supabase queries, RLS, or route structure.
# ONLY change UI/presentation layer.

---

## WHAT I SAW IN THE CURRENT UI (your reference point)

From the live screenshot, the current UI has these specific problems:

1. **Sidebar** — white background, no visual weight, active item is just a light blue rectangle (`bg-primary/10`). The Admin badge and branch switcher are stacked at the top making it feel cluttered. Nav items are flat with no hierarchy.

2. **Topbar** — "Dashboard" title, branch dropdown, and "Admin" badge are all dumped inline on the left with no structure. Icons (bell, sun, language, user) float on the right ungrouped. Height is h-16 which feels tall and empty.

3. **KPI Cards** — "Open Tickets" and "Low Stock" render full-width (1 column each) while the bottom 4 are in a row. No icons. No color coding per card type. "View" link looks like an afterthought. Cards feel hollow.

4. **Overall** — default shadcn/ui install aesthetic. Everything same color, same weight, same size. No visual hierarchy. Looks unfinished.

---

## DESIGN DIRECTION

**Style:** Corporate-professional. Clean, structured, high information density without feeling crowded.
**Inspiration:** Linear.app, Vercel dashboard, Retool — dark sidebar, white content area, strong typographic hierarchy.
**Fonts:** Keep Inter (already installed). Add `font-mono` class for codes/numbers (JetBrains Mono from Google Fonts).
**Colors:** Dark navy sidebar (#0F172A), white content area, blue accent (#2563EB), semantic colors for status badges.

---

## STEP 1 — UPDATE globals.css

Replace the current CSS variable block in `app/globals.css` with these values for the light theme:

```css
:root {
  --background: 0 0% 98%;        /* #FAFAFA — slightly off-white page bg */
  --foreground: 222 47% 11%;     /* #0F172A — near-black text */
  --card: 0 0% 100%;             /* pure white cards */
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 221 83% 53%;        /* #2563EB — blue accent */
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;      /* light gray */
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%; /* #64748B */
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 72% 51%;      /* #DC2626 */
  --destructive-foreground: 0 0% 100%;
  --border: 214 32% 91%;         /* #E2E8F0 */
  --input: 214 32% 91%;
  --ring: 221 83% 53%;
  --radius: 0.5rem;

  /* Custom semantic tokens */
  --sidebar-bg: 222 47% 11%;         /* #0F172A dark navy */
  --sidebar-fg: 0 0% 100%;
  --sidebar-muted: 215 20% 65%;      /* muted nav text */
  --sidebar-active-bg: 221 83% 53%;  /* blue active pill */
  --sidebar-active-fg: 0 0% 100%;
  --sidebar-hover-bg: 217 33% 17%;   /* slightly lighter navy on hover */

  --success: 142 71% 45%;        /* #22C55E */
  --success-light: 138 76% 97%;  /* #F0FDF4 */
  --warning: 38 92% 50%;         /* #F59E0B */
  --warning-light: 48 100% 96%;  /* #FFFBEB */
  --danger: 0 72% 51%;
  --danger-light: 0 86% 97%;

  --topbar-height: 3.5rem;       /* 56px */
  --sidebar-width: 16rem;        /* 256px */
  --sidebar-collapsed-width: 4rem; /* 64px */
}

.dark {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --card: 222 47% 10%;
  --card-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --sidebar-bg: 222 47% 5%;
  --sidebar-hover-bg: 222 47% 9%;
}

/* RTL support */
[dir="rtl"] { text-align: right; }
[dir="rtl"] .rtl\:flip { transform: scaleX(-1); }
[dir="rtl"] .sidebar-slide { left: auto; right: 0; transform: translateX(100%); }
[dir="rtl"] .sidebar-slide.open { transform: translateX(0); }
```

---

## STEP 2 — UPDATE tailwind.config.ts

Extend the config to expose sidebar tokens and add mono font:

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          bg: "hsl(var(--sidebar-bg))",
          fg: "hsl(var(--sidebar-fg))",
          muted: "hsl(var(--sidebar-muted))",
          "active-bg": "hsl(var(--sidebar-active-bg))",
          "active-fg": "hsl(var(--sidebar-active-fg))",
          "hover-bg": "hsl(var(--sidebar-hover-bg))",
        },
        success: { DEFAULT: "hsl(var(--success))", light: "hsl(var(--success-light))" },
        warning: { DEFAULT: "hsl(var(--warning))", light: "hsl(var(--warning-light))" },
        danger: { DEFAULT: "hsl(var(--danger))", light: "hsl(var(--danger-light))" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      height: {
        topbar: "var(--topbar-height)",
      },
      width: {
        sidebar: "var(--sidebar-width)",
        "sidebar-collapsed": "var(--sidebar-collapsed-width)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

Also add JetBrains Mono to `app/layout.tsx`:
```tsx
import { Inter, JetBrains_Mono } from "next/font/google"
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })
// Apply both: className={`${inter.variable} ${mono.variable} font-sans`}
```

---

## STEP 3 — REWRITE components/layout/sidebar.tsx

Complete rewrite. Keep all existing logic (useBranch, usePathname, navItems, mobileOpen/onMobileClose props). Only change the visual output.

### Visual spec:

```
DESKTOP SIDEBAR:
- Background: bg-sidebar-bg (dark navy #0F172A)
- Width: w-sidebar (256px), fixed left-0 top-0 h-screen
- Border: none (no border-r)
- Shadow: shadow-xl on the right edge: shadow-[4px_0_24px_rgba(0,0,0,0.15)]

HEADER BLOCK (top of sidebar):
- Padding: px-4 pt-5 pb-4
- Row 1: Monitor icon (text-sidebar-active-bg, size-5) + "{Branch} Support" in text-sidebar-fg font-semibold text-sm
- Row 2: Role badge pill immediately below — see badge spec below
- Bottom border: border-b border-white/10 mb-3

ROLE BADGE (in sidebar header):
- Admin: bg-amber-500/20 text-amber-300 border border-amber-500/30
- Support: bg-blue-500/20 text-blue-300 border border-blue-500/30
- Viewer: bg-white/10 text-white/60 border border-white/10
- Shape: rounded-full px-2.5 py-0.5 text-xs font-medium inline-flex
- Remove RoleBadge from sidebar header; replace with this inline badge

BRANCH SWITCHER (below header):
- Move OUT of header — place it in a collapsible section at the bottom of nav, above settings
- Style: bg-white/5 border border-white/10 rounded-md text-sidebar-fg text-xs
- Label above: text-sidebar-muted text-[10px] uppercase tracking-wider "Branch"

NAV ITEMS:
- Container: px-3 space-y-0.5 flex-1
- Each item: flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150 w-full
- INACTIVE: text-sidebar-muted hover:bg-sidebar-hover-bg hover:text-sidebar-fg
- ACTIVE: bg-sidebar-active-bg text-sidebar-active-fg font-medium
  (NOT bg-primary/10 — use the full blue pill bg-[hsl(var(--sidebar-active-bg))])
- Icon: size-4, same color as text
- No secondary/ghost button variant — use plain div/button with className

NAV SECTIONS:
Add a subtle section label above certain groups:
- "OPERATIONS" (text-sidebar-muted text-[10px] uppercase tracking-widest px-3 mb-1 mt-4):
  Spare Parts, Inventory, Purchase Requests, Suppliers
- "MANAGEMENT" label:
  Assets, Asset History, Tickets
- "SYSTEM" label:
  Notifications, Reports
- Settings stays at bottom after separator

BOTTOM FOOTER (above settings):
- Border-t border-white/10 pt-3 mt-auto px-3
- Branch switcher here (admin only)
- User info: avatar circle (initials, bg-white/10 text-sidebar-fg, size-8 rounded-full text-xs)
  + email truncated text-sidebar-muted text-xs
  Side by side in a flex row

COLLAPSE TOGGLE:
- Small button at very bottom of sidebar, centered
- ChevronLeft icon, text-sidebar-muted hover:text-sidebar-fg
- On click: toggle localStorage key "sidebar-collapsed"
- When collapsed: sidebar width = w-sidebar-collapsed (64px)
  - Hide all text, section labels, branch switcher, user email
  - Show only icons, centered
  - Show tooltip (title attr) on each nav item with the label
- Transition: transition-all duration-200 ease-in-out on the sidebar width

MOBILE DRAWER:
- Same dark sidebar, slides from left
- Overlay: bg-black/60 backdrop-blur-sm
- Close on: overlay click, Escape key, nav link click
- No collapse toggle in mobile drawer
```

---

## STEP 4 — REWRITE components/layout/top-bar.tsx

Keep all existing logic. Only change visual output.

```
CONTAINER:
- Height: h-topbar (56px) — reduce from current h-16 (64px)
- bg-card border-b border-border
- shadow-sm (subtle bottom shadow)
- sticky top-0 z-30
- flex items-center px-4 lg:px-6 gap-4

LEFT SIDE:
- Mobile menu button (lg:hidden): size-8 ghost icon button, Menu icon
- Page title: text-base font-semibold text-foreground (NOT text-xl — reduce size)
- Remove BranchSwitcher from topbar left — it's now in sidebar footer
- Remove RoleBadge from topbar — it's now in sidebar header

RIGHT SIDE (flex items-center gap-1):
- Notification bell: ghost icon button, size-9, relative
  - Unread badge: absolute -top-0.5 -right-0.5, size-4, bg-destructive text-destructive-foreground
    rounded-full text-[10px] font-bold flex items-center justify-center
  - aria-label="Notifications (X unread)"
- Theme toggle: ghost icon button, size-9
- Language toggle: ghost icon button, size-9, text-xs font-medium (show "EN" or "ع")
- Divider: h-6 w-px bg-border mx-1
- User avatar button: size-8 rounded-full bg-primary/10 text-primary text-xs font-semibold
  flex items-center justify-center cursor-pointer
  → Opens dropdown: name, email, role badge, divider, Sign out

TOPBAR BREADCRUMB (on [id] routes):
- Replace plain title with: 
  <span class="text-muted-foreground">Assets</span>
  <ChevronRight class="size-3.5 text-muted-foreground mx-1" />
  <span class="text-foreground font-semibold">Asset Tag</span>
- Pass `breadcrumb?: { parent: string; parentHref: string; current: string }` prop to TopBar
- Each [id] page passes this prop through DashboardLayout
```

---

## STEP 5 — CREATE components/ui/status-badge.tsx

```tsx
import { cn } from "@/lib/utils"

const statusMap: Record<string, string> = {
  // Ticket status
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-yellow-50 text-yellow-700 border-yellow-200",
  waiting_user: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  // Priority
  low: "bg-gray-100 text-gray-500 border-gray-200",
  medium: "bg-blue-50 text-blue-600 border-blue-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200 font-semibold",
  // Asset status
  active: "bg-green-50 text-green-700 border-green-200",
  in_maintenance: "bg-yellow-50 text-yellow-700 border-yellow-200",
  retired: "bg-red-50 text-red-600 border-red-200",
  lost: "bg-red-50 text-red-600 border-red-200",
  spare: "bg-gray-100 text-gray-600 border-gray-200",
  // Purchase requests
  pending: "bg-blue-50 text-blue-600 border-blue-200",
  ordered: "bg-yellow-50 text-yellow-700 border-yellow-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  // Stock
  ok: "bg-green-50 text-green-700 border-green-200",
  "low stock": "bg-orange-50 text-orange-700 border-orange-200",
  "out of stock": "bg-red-50 text-red-700 border-red-200",
}

const labelMap: Record<string, string> = {
  in_progress: "In Progress",
  waiting_user: "Waiting",
  in_maintenance: "Maintenance",
}

interface StatusBadgeProps {
  value: string
  className?: string
}

export function StatusBadge({ value, className }: StatusBadgeProps) {
  const key = value?.toLowerCase()
  const colorClass = statusMap[key] ?? "bg-gray-100 text-gray-600 border-gray-200"
  const label = labelMap[key] ?? (value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ") : "—")
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      colorClass, className
    )}>
      {label}
    </span>
  )
}
```

---

## STEP 6 — CREATE components/ui/skeleton-row.tsx

```tsx
import { cn } from "@/lib/utils"

interface SkeletonRowProps {
  columns?: number
  rows?: number
  className?: string
}

export function SkeletonRow({ columns = 5, rows = 5, className }: SkeletonRowProps) {
  const widths = ["w-1/4", "w-1/3", "w-1/5", "w-2/5", "w-1/6", "w-1/2", "w-1/4"]
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className={cn("border-b border-border", className)}>
          {Array.from({ length: columns }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div className={cn(
                "h-4 rounded-md bg-muted animate-pulse",
                widths[(ri + ci) % widths.length]
              )} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
```

---

## STEP 7 — CREATE components/ui/empty-state.tsx

```tsx
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon ?? <Inbox className="size-8 text-muted-foreground" />}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
```

---

## STEP 8 — CREATE components/ui/confirm-dialog.tsx

```tsx
"use client"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  loading?: boolean
  confirmLabel?: string
  variant?: "destructive" | "default"
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  onConfirm, loading, confirmLabel = "Confirm", variant = "destructive"
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## STEP 9 — INSTALL SONNER & ADD TOASTER

```bash
npm install sonner
```

In `app/layout.tsx`, import and add:
```tsx
import { Toaster } from "sonner"
// Inside BranchProvider, after {children}:
<Toaster position="bottom-right" richColors closeButton duration={3000} />
```

---

## STEP 10 — REPLACE ALL alert() AND confirm()

Search for every occurrence listed below and replace:

**Pattern for DELETE (all list pages):**
```tsx
// BEFORE:
if (!confirm("Delete this asset?")) return
try {
  await deleteAsset(id)
  loadAssets()
} catch (e) {
  alert(e instanceof Error ? e.message : String(e))
}

// AFTER:
// 1. Add state: const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
// 2. Add state: const [deleteLoading, setDeleteLoading] = useState(false)
// 3. Delete button onClick: setDeleteTarget(id)
// 4. Add <ConfirmDialog> at bottom of page JSX:
<ConfirmDialog
  open={!!deleteTarget}
  onOpenChange={(o) => !o && setDeleteTarget(null)}
  title="Delete this item?"
  description="This action cannot be undone."
  loading={deleteLoading}
  confirmLabel="Delete"
  onConfirm={async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteAsset(deleteTarget)
      toast.success("Deleted successfully")
      loadAssets()
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleteLoading(false)
    }
  }}
/>
```

**Apply the same pattern to:**
- app/assets/page.tsx (line 440, 445)
- app/spare-parts/page.tsx (line 438, 443)
- app/tickets/page.tsx (line 354, 359)
- app/purchase-requests/page.tsx (line 373, 378)
- app/suppliers/page.tsx (line 320, 325)
- app/inventory/page.tsx — Undo use (line 135) and Delete (line 153, 158)
- app/settings/options/page.tsx (line 59)

**For SAVE/CREATE/EDIT dialogs**, after successful submit:
```tsx
toast.success("Saved successfully")
```

---

## STEP 11 — REPLACE ALL "Loading..." TEXT

For every page that currently shows plain "Loading..." text, replace with SkeletonRow inside the table body:

```tsx
// BEFORE:
{loading && <tr><td colSpan={7} className="text-center text-muted-foreground py-8">Loading...</td></tr>}

// AFTER:
{loading && <SkeletonRow columns={7} rows={5} />}
```

Pages to update: assets, spare-parts, inventory, purchase-requests, suppliers, tickets, asset-history, notifications, settings/options, and dashboard (replace "Loading dashboard..." with skeleton card grid).

---

## STEP 12 — REPLACE ALL "No X found." TEXT

```tsx
// BEFORE:
{!loading && data.length === 0 && (
  <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No assets found.</td></tr>
)}

// AFTER:
{!loading && data.length === 0 && (
  <tr>
    <td colSpan={7}>
      <EmptyState
        title="No assets found"
        description="Add your first asset to get started."
        action={canEdit ? { label: "+ Add asset", onClick: () => setAddOpen(true) } : undefined}
      />
    </td>
  </tr>
)}
```

Apply per page with appropriate title/description/action:
- assets: "No assets found" / "Add your first asset to get started."
- spare-parts: "No parts found" / "Try adjusting your filters or add a new part."
- tickets: "No tickets found" / "No support tickets match the selected filters."
- inventory: "No transactions found" / "Stock transactions will appear here."
- purchase-requests: "No requests found" / "Create a purchase request to get started."
- suppliers: "No suppliers found" / "Add your first supplier."
- asset-history: "No history entries" / "Asset maintenance history will appear here."
- notifications: "You're all caught up" / "No new notifications at the moment."

---

## STEP 13 — REDESIGN KPI CARDS (app/page.tsx)

Find the KPI card rendering and replace with this structure:

```tsx
// Card visual spec:
// - bg-card rounded-xl border border-border shadow-sm
// - p-5 flex flex-col gap-3
// - Top row: icon container (rounded-lg p-2, colored bg) + card label (text-xs font-medium text-muted-foreground uppercase tracking-wide)
// - Value: text-3xl font-bold text-foreground
// - Bottom row: description text-xs text-muted-foreground + "View →" link text-xs text-primary font-medium

// Icon colors per card:
// Open Tickets → bg-blue-50 text-blue-600
// Low Stock → bg-orange-50 text-orange-600
// Parts Installed Today → bg-green-50 text-green-600
// Delayed Suppliers → bg-red-50 text-red-600
// Pending Requests → bg-yellow-50 text-yellow-600
// Devices in Maintenance → bg-purple-50 text-purple-600

// Grid: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4
// ALL cards same size — remove the inconsistent 1-column full-width cards

// Example card JSX:
<div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
  <div className="flex items-center justify-between">
    <div className="rounded-lg bg-blue-50 p-2">
      <Ticket className="size-4 text-blue-600" />
    </div>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open Tickets</span>
  </div>
  <div className="text-3xl font-bold text-foreground">{kpi.openTickets}</div>
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground">Active support requests</span>
    <Link href="/tickets" className="text-xs text-primary font-medium hover:underline">View →</Link>
  </div>
</div>
```

---

## STEP 14 — FIX SUPPORT FORM (/support) SUCCESS STATE

In `app/support/page.tsx`, find the success block that replaces the form.

```tsx
// BEFORE: success replaces form entirely
// AFTER: show success banner ABOVE the form, keep form visible but reset it

// Add state: const [successTicket, setSuccessTicket] = useState<string | null>(null)

// On success: setSuccessTicket(ticketNumber); form.reset()

// In JSX, above the form:
{successTicket && (
  <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-start justify-between gap-3">
    <div>
      <p className="text-sm font-semibold text-green-800">Request submitted successfully!</p>
      <p className="text-sm text-green-700 mt-0.5">Ticket number: <span className="font-mono font-bold">{successTicket}</span></p>
    </div>
    <Button size="sm" variant="outline" className="shrink-0 border-green-300 text-green-700 hover:bg-green-100"
      onClick={() => setSuccessTicket(null)}>
      Submit another
    </Button>
  </div>
)}
```

---

## STEP 15 — UPDATE VIEWER BANNER (all list pages)

Find the "View only. Contact an administrator..." banner on every list page.

```tsx
// BEFORE: shown every time, no dismiss
// AFTER: dismissable, shown once per session

// Add at top of component:
const [bannerDismissed, setBannerDismissed] = useState(() => {
  if (typeof window !== "undefined") return sessionStorage.getItem("viewer-banner-dismissed") === "true"
  return false
})

// Replace banner JSX:
{!canEdit && !bannerDismissed && (
  <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
    <p className="text-sm text-blue-800">
      You have <strong>read-only access</strong> to this section. To make changes, contact your branch administrator.
    </p>
    <button
      onClick={() => { setBannerDismissed(true); sessionStorage.setItem("viewer-banner-dismissed", "true") }}
      className="ml-4 text-blue-500 hover:text-blue-700 text-lg leading-none shrink-0"
      aria-label="Dismiss"
    >×</button>
  </div>
)}
```

---

## STEP 16 — UPDATE STATUS DISPLAY ON LIST PAGES

On every list page, find where status/priority are displayed as plain text and replace with `<StatusBadge>`:

```tsx
// BEFORE: <span>{row.status}</span> or <Badge>{row.priority}</Badge>
// AFTER: <StatusBadge value={row.status} /> or <StatusBadge value={row.priority} />
```

Pages:
- /tickets → status column + priority column
- /assets → status column
- /purchase-requests → status column
- /inventory → transaction type (IN/OUT) — use StatusBadge or custom colored badge
- /spare-parts → consumable badge in type column

---

## STEP 17 — ADD SKIP LINK (accessibility)

In `app/layout.tsx`, add as the first child of `<body>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-card border border-border rounded-md px-4 py-2 text-sm font-medium shadow-md"
>
  Skip to main content
</a>
```

In `components/layout/dashboard-layout.tsx`, add `id="main-content"` to the `<main>` tag.

---

## STEP 18 — ADD aria-labels TO ALL ICON BUTTONS

Search for icon-only buttons throughout the codebase and add aria-label:

```tsx
// Notification bell:
aria-label={`Notifications (${unreadCount} unread)`}

// Theme toggle:
aria-label="Switch theme"

// Language toggle:
aria-label="Switch language"

// Delete button:
aria-label={`Delete ${item.name ?? item.ticket_number ?? "item"}`}

// Edit button:
aria-label={`Edit ${item.name ?? "item"}`}

// Close dialog X:
aria-label="Close dialog"

// Mobile menu:
aria-label="Open navigation menu"

// Sidebar collapse:
aria-label="Collapse sidebar"
```

---

## EXECUTION ORDER

Apply steps in this exact order:
1. globals.css (Step 1)
2. tailwind.config.ts (Step 2)
3. Sidebar rewrite (Step 3)
4. TopBar rewrite (Step 4)
5. Create all new components: StatusBadge, SkeletonRow, EmptyState, ConfirmDialog (Steps 5-8)
6. Install Sonner (Step 9)
7. Replace alert/confirm (Step 10)
8. Replace Loading text (Step 11)
9. Replace empty state text (Step 12)
10. KPI cards redesign (Step 13)
11. Support form fix (Step 14)
12. Viewer banner fix (Step 15)
13. Status badges on list pages (Step 16)
14. Skip link (Step 17)
15. aria-labels (Step 18)

After each step, run: `npm run build` — fix any TypeScript errors before moving to the next step.

---

## HARD RULES

1. **DO NOT** touch any Supabase query, service file, or RLS logic.
2. **DO NOT** change any route paths or file names under `app/`.
3. **DO NOT** remove any existing functionality — only add/replace UI.
4. **DO NOT** install new UI libraries — use existing shadcn/ui components.
5. **Keep all `useBranch()` calls and role checks** (`isAdmin`, `canEdit`) exactly as they are.
6. **Keep LocaleProvider and RTL logic** — do not break Arabic mode.
7. **Test dark mode** after each visual change — all new colors must work in `.dark`.
8. After ALL steps complete, run `npm run build` one final time and confirm zero errors.
