# UI Components And Styling

This document is the working reference for shared UI styling. Prefer these primitives before adding new shared components.

## Component Boundaries

Shared UI components should be small, reusable, and free of feature-specific domain behavior.

Use this rule:

- `src/components/ui`: reusable visual primitives and generic overlay/menu/form building blocks.
- `src/components/navigation`: shared navigation controls that own router behavior.
- `src/components/layout`: app shell, desktop/mobile navigation, headers, and global layout composition.
- `src/features/<feature>/components`: feature-owned UI with domain behavior or feature-specific data.

Do not create a new shared component just because a style appears once. Add shared UI only when the pattern repeats or when centralizing it removes real maintenance cost.

## Button

`Button` is the main visual action primitive.

```tsx
<Button variant="primary" size="lg">Book A Tour</Button>
<Button variant="surface" shape="circle" size="control" aria-label="Back">...</Button>
```

### Variants

| Variant | Visual style | Current examples |
|---|---|---|
| `primary` | Dark filled action with inverse text. Use for the main action in a surface. | Desktop listing `Book A Tour`; filter `Show results`; desktop listing save button styling via `ListingSaveButton` override. |
| `secondary` | Light elevated action with border. Use for secondary paired actions. | Filter `Reset`; delete confirmation `Cancel`. |
| `ghost` | Transparent action with hover surface. Use sparingly for low-emphasis actions. | Notifications `Mark all read`; internal default for plain `OverlayCloseButton`. |
| `danger` | Red/destructive filled action. | Delete confirmation `Delete`. |
| `surface` | Flat light-gray action. Use for neutral page actions. | Desktop listing `Share`; listing `Back`; listing `Contact Agent`; desktop Collections trigger. |
| `elevated` | White control with shadow. Use for floating controls and map/filter controls. | Bottom nav side actions; cards mode map/sort; `ControlPillButton`; `MapControlButton`. |
| `overlay` | Light translucent circular control over image/media. | Listing card heart/arrows; listing detail sheet gallery arrows; listing sheet share/save; cards undo/close. |

### Shapes

| Shape | Use |
|---|---|
| `pill` | Text actions and horizontal controls. |
| `circle` | Icon-only actions. |

### Sizes

| Size | Visual size | Current examples |
|---|---|---|
| `xs` | 28px | Listing card image arrows. |
| `sm` | 32px | Small overlay/close controls. |
| `md` | 40px | Desktop header actions. |
| `control` | 44px | Map/filter controls, bottom nav side actions. |
| `lg` | 48px | Large panel/footer actions. |

## ButtonBadge

Use `ButtonBadge` for small count/status badges inside a `Button`.

Current users are compatibility wrappers:

- `ControlPillButton`
- `MapControlButton`

## ActionRow

Use `ActionRow` for full-width row actions inside menus, popovers, sidebars, and sort lists.

Current users:

- Desktop sidebar menu rows.
- Desktop account menu rows.
- Rename/delete popovers.
- Desktop sort menu rows.
- Mobile sort drawer rows.
- Collection tag action rows.
- Mobile menu rows.
- Notification rows.

## Segment Controls

Use `SegmentedControl` for mode switches where one option is selected.

Current users:

- Collection List/Map desktop toggle.
- Collection List/Map mobile bottom toggle.

## Drawer And Popover Components

### MobileDrawer

Use `MobileDrawer` for mobile bottom-sheet surfaces with optional title, footer, backdrop, close button, drag/swipe behavior, and custom height.

Current users:

- Mobile listing detail sheet.
- Mobile filter drawer.
- Mobile sort drawers through `SortOptionsDrawer`.
- Save-to-collection sheet.
- Collection tag panel.
- Saved searches panel.
- Cards mode detail/map/onboarding drawers.

Guidance:

- Prefer `MobileDrawer` for mobile sheet behavior instead of creating a one-off fixed panel.
- Keep feature content inside the feature. The drawer should own shell behavior, not domain logic.
- Use `heightClassName` and `contentClassName` for layout differences before creating a new drawer component.

### AnchoredPopover

Use `AnchoredPopover` for floating desktop popovers that are positioned from an anchor `DOMRect`.

Current users:

- Collection desktop sort popover.
- Collection tag action popovers.

Guidance:

- Keep positioning in `AnchoredPopover`.
- Keep the menu/list content in the feature or a generic component such as `DesktopSortMenu`.
- Use this for desktop popovers that need viewport-aware repositioning.

### RenameDeletePopover

Use `RenameDeletePopover` for the repeated rename/delete overflow menu with confirmation state.

Current users:

- Saved collection rename/delete.
- Saved search rename/delete.
- Collection tag delete confirmation.

Guidance:

- Keep this shared while the interaction remains exactly rename/delete/confirm.
- If an overflow menu grows beyond rename/delete, prefer a feature-owned menu that composes `ActionRow`.

## Menus And Sorts

### DesktopSortMenu

Use `DesktopSortMenu` for desktop sort menus with selectable rows.

Current users:

- Listings sort menu.
- Collection sort menu.

Internally this should stay composed from `ActionRow`.

### SortOptionsDrawer

Use `SortOptionsDrawer` for mobile sort choices.

Current users:

- Mobile listings sort.
- Mobile collection sort.
- Cards mode sort.

Internally this should stay composed from `MobileDrawer` and `ActionRow`.

## Form And Input Helpers

### CreateInlineField

Use `CreateInlineField` for repeated “collapsed create row -> inline input -> submit” flows.

Current users:

- New collection in desktop collections menu.
- New collection in saved collections page.
- New collection in save-to-collection sheet.
- New tag in collection tag panel.
- Save current search in saved searches panel.

Guidance:

- Keep this shared because the interaction repeats across features.
- Keep the created domain object in the feature/store. This component should only own input mechanics.

## Display Primitives

### Avatar

Use `Avatar` for small circular people/collaborator images with initials fallback.

Current users:

- Saved collection collaborator stack.

### AppImageIcon

Use `AppImageIcon` for small image-backed icons inside app navigation/menus.

Current users:

- Desktop Collections trigger icon.

Guidance:

- Use this when the icon is an app asset/image, not a Lucide icon.
- Prefer Lucide icons directly for simple symbolic actions.

## Navigation Controls

Navigation-aware controls live in `src/components/navigation`, not `src/components/ui`, because they own router behavior.

Current controls:

- `BackButton`: uses `Button variant="surface"` visually and calls `router.back()`.
- `OverlayCloseButton`: uses `Button` visually and handles close/router fallback behavior.

## Compatibility Wrappers

These wrappers remain because they carry active/badge semantics and preserve existing call sites:

- `ControlPillButton`
- `MapControlButton`

Do not add new wrappers for location-specific buttons. Prefer direct `Button` usage with a variant/shape/size.

## Feature-Owned Buttons

Some buttons should stay feature-owned because they include domain behavior:

- `ListingSaveButton`: save/unsave listing behavior, composed from shared `Button` styling internally.
- Filter chips and collection tag chips: feature-specific selection logic.

## Cleanup Suggestions

The shared component layer is intentionally small now. Future cleanup should focus on reducing one-off raw UI patterns inside feature files before adding new primitives.

Recommended next cleanup targets:

- `MapControlButton`: only used by explore map controls and the mobile list map pill. It can stay while it carries badge/shape compatibility, but new map controls can use `Button variant="elevated"` directly.
- `ControlPillButton`: still useful while saved-search/filter/tag controls share active/badge semantics. If badge handling moves fully to `ButtonBadge`, this wrapper can eventually be deleted.
- Feature chips: search chips, filter chips, and collection tag chips should remain feature-owned unless their behavior converges into one repeated chip primitive.
- Raw page buttons can be migrated to `Button` or `ActionRow` when their styling matches an existing primitive.

Avoid:

- Reintroducing atoms/molecules/organisms.
- Creating location-named shared components such as `HeaderButton` or `CardButton` when `Button` with a variant is enough.
- Placing routing, store mutations, or feature-specific state inside `src/components/ui`.
