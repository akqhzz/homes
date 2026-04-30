# Homes

A Next.js real-estate exploration app with an interactive map, listing cards, saved collections, saved searches, filters, and listing detail experiences.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Quality Checks

Run these before handing off structural or UI changes:

```bash
npm test
npm run lint
npm run build
```

## Project Docs

- [Architecture](docs/ARCHITECTURE.md): code ownership, folder boundaries, route/client rules.
- [UI Components](docs/UI_COMPONENTS.md): shared UI primitives, button variants, component styling rules.

## Structure At A Glance

- `src/app`: thin route entry files.
- `src/features`: domain-owned UI, hooks, and logic.
- `src/components/ui`: shared visual primitives.
- `src/components/navigation`: shared router-aware controls.
- `src/components/layout`: app shell, desktop/mobile navigation, and global layout.
- `src/hooks`: shared browser/interaction hooks.
- `src/lib`: shared pure logic and external helpers.
- `src/store`: Zustand adapters.

## Editing Guidance

Before structural edits, read the architecture and UI docs above. This app intentionally uses feature ownership instead of the old atoms/molecules/organisms model.

Before editing Next.js route conventions, read the relevant local Next.js docs under `node_modules/next/dist/docs/`, as required by `AGENTS.md`.

## Manual QA Focus

Tests cover pure helpers, but browser QA is still needed for:

- desktop and mobile explore map
- filters, saved searches, and area selection
- listing card save/unsave
- listing detail page/sheet
- saved collections and collection detail page
- cards mode
