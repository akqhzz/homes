<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture boundaries

Read `docs/ARCHITECTURE.md` before structural edits. Keep route files thin, domain code in `src/features/*`, shared primitives in `src/components/ui`, shared shell/navigation in `src/components/layout`, reusable hooks in `src/hooks`, and cross-feature pure logic in `src/lib`.

## Project documentation rules

- Keep documentation concise and non-redundant.
- `README.md` is for project onboarding: how to run, verify, and find the main docs.
- `docs/ARCHITECTURE.md` is the source of truth for code ownership, folder boundaries, route/client boundaries, and architecture direction.
- `docs/UI_COMPONENTS.md` is the source of truth for shared UI primitives, button variants, component styling rules, and UI cleanup guidance.
- `src/components/ui/README.md` should stay as a short local guide that points to `docs/UI_COMPONENTS.md`; do not duplicate the full styling guide there.

## Maintainability rules

- Prefer feature-owned components for domain behavior. Promote to `src/components/ui` only when a UI primitive is reused across features and has no domain/store/routing behavior.
- Prefer `Button`, `ActionRow`, `SegmentedControl`, `MobileDrawer`, and `AnchoredPopover` before adding new shared UI primitives.
- Do not add location-named shared buttons like `HeaderButton`, `CardButton`, or `MapButton` when an existing `Button` variant is enough.
- Router-aware controls belong in `src/components/navigation`, not `src/components/ui`.
- Keep wrappers temporary unless they add real behavior such as active/badge semantics. Remove compatibility wrappers once call sites are migrated.
- Avoid reviving `atoms`, `molecules`, `organisms`, or `templates`.
- After UI or architecture edits, run `npm test`, `npm run lint`, and `npm run build`.
