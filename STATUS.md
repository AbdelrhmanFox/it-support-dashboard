# Project Status

Last updated: March 2026

---

## Deployment

| Item | Status |
|---|---|
| Live URL | https://itsupportamreicanafoods.netlify.app |
| GitHub | https://github.com/AbdelrhmanFox/it-support-dashboard |
| Branch | `main` |
| Build | `npm run build` |

---

## Feature Completion

### Core Modules

| Module | Status | Notes |
|---|---|---|
| Dashboard (KPI + Charts) | ✅ Done | Drag-reorder + resize; demo mode |
| Login (email/password + magic link) | ✅ Done | |
| Public support form `/support` | ✅ Done | Rate limited; file upload; n8n webhook |
| Tickets list + detail | ✅ Done | Status workflow; Excel import |
| Assets list + detail profile | ✅ Done | 5 tabs; Excel import |
| Spare parts catalog | ✅ Done | Excel import; consumable flag |
| Inventory (stock transactions) | ✅ Done | Undo use; atomic ops |
| Purchase requests | ✅ Done | Status workflow; Excel import |
| Suppliers | ✅ Done | SLA tracking; follow-ups |
| Asset history | ✅ Done | Global maintenance log |
| Notifications | ✅ Done | Unread badge; mark-read |
| Reports + Excel export | ✅ Done | 12-month analytics; 6 exports |
| Settings (theme/language) | ✅ Done | |
| Settings → Dropdown Lists | ✅ Done | Admin only |

### UI/UX

| Item | Status |
|---|---|
| Dark/light/system theme | ✅ Done |
| Arabic RTL mode | ✅ Done |
| Responsive (mobile drawer) | ✅ Done |
| Sidebar collapse + hover tooltips | ✅ Done |
| Redesigned KPI cards with icons | ✅ Done |
| SkeletonRow loading states | ✅ Done |
| EmptyState with actions | ✅ Done |
| ConfirmDialog (replaces browser confirm) | ✅ Done |
| Sonner toast notifications | ✅ Done |
| Dismissible viewer banner | ✅ Done |
| Skip-to-main-content link | ✅ Done |
| aria-labels on icon buttons | ✅ Done |
| ⌘K command palette | ✅ Done |
| StatusBadge (auto-colored) | ✅ Done |

### Database

| Migration | Status |
|---|---|
| `schema.sql` (base) | ✅ Must run |
| `add-multi-branch.sql` | ✅ Must run |
| `add-lookup-options.sql` | ✅ Must run |
| `add-support-form-lookup-options.sql` | ✅ Must run |
| `add-spare-part-assets.sql` | ✅ Must run |
| `add-spare-part-consumable.sql` | ✅ Must run |
| `add-ticket-attachment.sql` | ✅ Must run |
| `add-asset-profile.sql` | ✅ Must run |
| `add-admin-delete-all.sql` | ✅ Must run |
| `rls-allow-anon.sql` | ✅ Must run |

---

## Known Issues / Resolved

| Issue | Resolution |
|---|---|
| `attachment_url` column missing on tickets | Run `add-ticket-attachment.sql` migration |
| Priority check constraint violation on public form | Fixed: priority normalized to lowercase in `app/support/actions.ts` |
| `ERR_NAME_NOT_RESOLVED` on Supabase | Supabase project was paused (free tier) — restore in dashboard |
| Sidebar icons show without labels when collapsed | Fixed: hover tooltips added in `sidebar.tsx` |
| `git push` 403 / SSL errors | Fixed: network issue on operator side |

---

## Documentation

| File | Description |
|---|---|
| `README.md` | Setup, deployment, features, troubleshooting |
| `docs/ARCHITECTURE.md` | Technical deep-dive: auth, data layer, theme, atomic ops |
| `docs/cursor-redesign-final.md` | UI/UX redesign specification (all 18 steps) |
| `docs/UI-UX-and-Functionality-Spec.md` | Original UX requirements |
| `PROJECT-DETAILS.md` | Database schema details + project architecture notes |
