# Architecture

This codebase is organized around feature ownership plus a small shared UI layer. Future edits should preserve these boundaries unless there is a clear reason to change them.

## Top-Level Rules

- `src/app` contains route entry files only. Keep route files thin: load params/data, preserve Next.js server/client boundaries, and delegate rendering to features.
- `src/features/*` owns domain-specific UI, hooks, and private logic.
- `src/components/ui` owns shared reusable UI primitives and shared style foundations.
- `src/components/layout` owns app shell/navigation/header layout pieces.
- `src/components/navigation` owns shared app navigation controls that include routing behavior.
- Client-only side-effect components usually belong to the feature they affect. Only create a shared effects area if the effect is genuinely app-wide.
- `src/hooks` owns shared browser/interaction hooks used by more than one feature.
- `src/lib` owns shared pure logic and external-service helpers used across features.
- `src/store` owns Zustand adapters. Prefer moving domain mutation logic into pure feature/lib helpers, then call those helpers from stores.

## Feature Boundaries

Feature folders are the default home for domain-specific code:

```txt
src/features/collections
src/features/explore
src/features/listings
src/features/map
src/features/saved-searches
src/features/search
```

Use this rule when adding code:

- If only one feature uses it, put it inside that feature.
- If multiple features need it and it is UI, promote it to `src/components/ui` or `src/components/layout`.
- If multiple features need it and it is pure logic, promote it to `src/lib`.
- Avoid importing from another feature's private `components`, `hooks`, or `lib` unless that feature intentionally exposes a shared surface.

## Shared UI

Shared UI belongs in `src/components/ui`. This includes app-wide primitives like:

```txt
Button
ActionRow
SegmentedControl
MobileDrawer
AnchoredPopover
RenameDeletePopover
SortOptionsDrawer
buttonStyles
```

Button style consistency is handled through `src/components/ui/Button.tsx` and `src/components/ui/buttonStyles.ts`. Feature components should use these shared primitives instead of duplicating long button class strings.

Prefer:

- `Button` for visual action controls
- `ActionRow` for menus, sidebars, and sort/list rows
- `SegmentedControl` for mode switches
- feature-owned components for domain behavior

Compatibility wrappers such as `ControlPillButton` and `MapControlButton` can remain while call sites migrate, but new code should usually start with `Button`.

See `docs/UI_COMPONENTS.md` for shared UI styling rules and `src/components/ui/README.md` for the local component folder guide.

## Layout

Shared shell/navigation components live in `src/components/layout`:

```txt
PageShell
DesktopHeader
DesktopSidebar
BottomNav
TopBar
DesktopSearchControl
DesktopFilterControl
DesktopCollectionsMenu
DesktopAccountMenu
```

Layout components may compose features where the UI is global, such as search/filter panels. They should avoid owning domain mutation logic when that logic can live in a feature or store.

## Routes And Client Boundaries

Keep SEO/content-heavy routes server-first. Example: listing detail route stays a Server Component and delegates page rendering to `features/listings/ListingPageContent`.

Highly interactive app surfaces can use client feature shells. Example: the explore map experience uses `features/explore/ExplorePageClient`.

Before editing Next.js route conventions, read the relevant local Next.js docs under `node_modules/next/dist/docs/`, per `AGENTS.md`.

## Pure Logic And Tests

When extracting pure logic, add focused tests next to that helper:

```txt
src/features/collections/lib/*.test.ts
src/features/listings/lib/*.test.ts
src/features/search/lib/*.test.ts
src/features/map/lib/*.test.ts
```

Current test coverage is strongest for pure helpers and store-adjacent domain logic. It does not replace manual QA for rendered UI, drawers, Mapbox, gestures, or browser focus behavior.

Run after architecture changes:

```bash
npm test
npm run lint
npm run build
```

## Manual QA

Manual QA is still needed for:

- desktop explore map
- mobile explore map
- area select/draw/clear
- filter drawer and desktop filter popover
- saved searches panel
- listing save/unsave
- listing detail page
- saved collection page
- cards mode
- menus/popovers

## Naming Guidance

Prefer names that describe ownership:

- `components/ui/*` for shared primitives
- `components/layout/*` for app shell/navigation
- `features/<feature>/components/*` for feature UI
- `features/<feature>/hooks/*` for feature hooks
- `features/<feature>/lib/*` for feature-private pure logic
- `src/lib/*` for cross-feature pure logic

Avoid reviving the old `atoms/molecules/organisms/templates` folders. They were removed because the boundaries were too vague for this app.
