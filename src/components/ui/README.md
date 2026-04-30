# Shared UI

`src/components/ui` contains reusable UI primitives and small shared controls. Put a component here only when it is useful across multiple features and does not own feature-specific data or domain behavior.

For the full shared styling guide, see `docs/UI_COMPONENTS.md`.

## Button Rules

Button visual consistency starts with `Button` and `buttonStyles.ts`. Prefer `Button` for new clickable controls unless the interaction is a list/menu row or a segmented choice.

## Button Variants

| Variant | Style | Current example |
|---|---|---|
| `primary` | Dark filled pill with inverse text | Desktop listing `Book A Tour`, filter `Show results` |
| `secondary` | Light elevated surface with border | Filter `Reset`, delete confirmation `Cancel` |
| `ghost` | Transparent hover-only action | Notifications `Mark all read`; used internally by plain `OverlayCloseButton` |
| `danger` | Red/destructive filled pill | Delete confirmation `Delete` |
| `surface` | Flat light-gray surface action | Desktop listing `Share`, listing `Back`, desktop listing `Contact Agent`, desktop Collections trigger |
| `elevated` | White shadow control | Map controls and filter/control pills through `MapControlButton` / `ControlPillButton` |
| `overlay` | Light translucent circular overlay | Listing card heart/image arrows, listing detail gallery arrows, listing sheet share/save, cards undo |

Shapes:

- `pill`: text/action button shape.
- `circle`: icon-only button shape.

Sizes:

- `xs`: 28px compact overlay/icon control.
- `sm`: 32px compact control.
- `md`: 40px standard control.
- `control`: 44px map/filter/header control.
- `lg`: 48px large action.

Use the smallest semantic button that matches the interaction:

- `Button`: the visual action primitive. Supports variants like `primary`, `secondary`, `ghost`, `danger`, `surface`, `elevated`, and `overlay`, plus `pill` and `circle` shapes.
- `ActionRow`: full-width row action inside menus, popovers, sidebars, and sort lists.
- `ControlPillButton`: compatibility wrapper around elevated `Button` with active/badge support.
- `MapControlButton`: compatibility wrapper around elevated `Button` for map/list controls.
- `SegmentedControl`: two-or-more option toggles with a shared sliding selected indicator.

Do not add another button component for a new location. Add a `Button` variant only when the visual style repeats across the app, or add a feature-owned wrapper when the behavior is domain-specific.

## Categories

Keep these categories in mind while editing this folder:

- Buttons and style foundations: `Button`, `ButtonBadge`, `ActionRow`, compatibility wrappers, and button class helpers.
- Overlays and menus: `MobileDrawer`, `AnchoredPopover`, `RenameDeletePopover`, sort menus.
- Display primitives: `Avatar`, `AppImageIcon`, `HeartDelight`.
- Form primitives: small reusable controls like `CreateInlineField`.

Feature-specific behavior belongs under `src/features/<feature>`. For example, a component that marks a listing as visited belongs to `src/features/listings`, not shared UI.

Navigation-aware controls belong under `src/components/navigation`, not `src/components/ui`.

## Button Examples

Current examples in the app:

- `Button`: listing detail sheet footer actions in `src/features/listings/components/ListingDetailSheet.tsx`.
- `ActionRow`: desktop sidebar/account menu rows, mobile menu rows, notification rows, and rename/delete popover actions.
- `Button variant="surface"`: listing Back button, desktop Collections trigger, listing detail Contact Agent secondary action.
- `Button variant="overlay"`: listing card save/image-arrow buttons and listing detail sheet image-top share/save actions.
- `ControlPillButton`: desktop and mobile collection controls in `src/features/collections/CollectionPageClient.tsx`.
- `MapControlButton`: explore map Draw, Select Areas, and Clear Areas controls in `src/features/explore/ExplorePageClient.tsx`.
- `SegmentedControl`: collection List/Map view toggles in `src/features/collections/components/CollectionViewToggle.tsx` and `src/features/collections/CollectionPageClient.tsx`.
