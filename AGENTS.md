# HouseManagement — Agent Instructions

## Project Overview
Modern responsive PWA for personal household management. Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, React Query.

## Key Commands
```bash
pnpm dev            # Start development server
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # Run ESLint
pnpm typecheck      # Run TypeScript type checking (tsc --noEmit)
```

## Tech Stack
- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS v4 + shadcn/ui v2 (@base-ui, render prop pattern)
- **Data:** Supabase (PostgreSQL), React Query (TanStack Query v5)
- **Forms:** react-hook-form + zod
- **Charts:** recharts
- **Other:** sonner (toasts), next-themes (dark/light), cmdk (command palette), date-fns, xlsx

## shadcn/ui v2 Important Notes
The current shadcn/ui (v2, for Tailwind v4) uses `@base-ui/react` primitives and the **`render` prop** pattern instead of `asChild`.

```tsx
// WRONG (old shadcn v1):
<DropdownMenuTrigger asChild>
  <Button>...</Button>
</DropdownMenuTrigger>

// CORRECT (new shadcn v2):
<DropdownMenuTrigger render={<Button />}>
  ...
</DropdownMenuTrigger>
```

Same for Sidebar links:
```tsx
<SidebarMenuButton render={<Link href="/finance" />}>
  <PiggyBank /> <span>Finanzas</span>
</SidebarMenuButton>
```

## Directory Structure
- `src/app/(app)/...` — Authenticated app routes
- `src/app/(auth)/...` — Login/signup/invite pages
- `src/features/<module>/...` — Feature-based code (components, actions, queries, schemas, types)
- `src/components/ui/...` — shadcn/ui primitives
- `src/components/layout/...` — AppShell, Sidebar, Topbar, MobileNav
- `src/components/data/...` — StatCard, EmptyState, LoadingSkeleton
- `src/lib/...` — Utilities, Supabase clients, auth helpers, query keys
- `src/providers/...` — Query, Theme, Toast providers

## Architecture Rules
1. **Server Components for reads** — query Supabase directly in RSC.
2. **Client Components for interactivity** — forms, charts, toggles, optimistic updates.
3. **Server Actions for mutations** — in `features/<x>/actions.ts`, validate with zod, call `requireHousehold()` or `requireAdmin()`, `revalidatePath()`, audit log entry.
4. **React Query** for client-side cache — keys in `lib/query-keys.ts`.
5. **Responsive-first** — Desktop sidebar + topbar, tablet icon-rail, mobile bottom nav.

## Supabase Setup (for real data)
1. Run `db.md` SQL in Supabase SQL Editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. Run `pnpm dlx supabase gen types typescript --project-id <id> --schema public > src/types/db.ts` to generate real types.

## Verification Checklist per Feature
- [ ] zod schema shared + used on client and server
- [ ] Server Action calls `requireHousehold()` and revalidates path
- [ ] RLS policy exists for the table(s) touched
- [ ] Empty / loading / error states present
- [ ] Optimistic update + rollback + toast
- [ ] Mobile layout tested (bottom nav, card list, bottom sheet)
- [ ] Keyboard accessible + visible focus
- [ ] Dark and light themes render correctly
- [ ] `pnpm typecheck` and `pnpm build` pass
