# M3 Audit for RolText

## What is already strong
- Uses Material Design 3 semantic tokens in `styles-m3.css` (`--md-primary`, `--md-surface`, `--md-outline`, etc.).
- Supports light/dark theme with `data-theme` variables.
- Applies M3 typography tokens via `--font-display`, `--font-ui`, `--font-body`.
- Has accessible focus-ring support for many interactive controls.
- Uses elevated modal surfaces and good border radius for dialogs.
- Includes M3-like button states for hover and active interactions.

## Improvements available

### 1. Surface consistency
- Apply a shared surface/background style to `sidebar-block` sections to make all panels look like unified cards.
- Add subtle elevation to `sidebar-block` containers so content sections feel layered.
- Use `--md-surface-c` or `--md-surface-c-high` more consistently for the right-sidebar and left-sidebar cards.

### 2. Topbar and nav controls
- Strengthen `nav-tab` surface states with an M3 tonal container and a clearer active state.
- Add pressed/hover surface layers using `rgba(236,197,111,...)` on buttons and tabs.
- Make icon buttons (`icon-btn`) feel more tactile with a tonal surface.

### 3. Layout and responsiveness
- Convert the main layout grid into `minmax()` columns to preserve responsive behavior across window sizes.
- Add consistent gaps between panels instead of fixed zero spacing.
- Improve mobile section transitions and ensure the bottom nav uses safe-area padding.

### 4. Buttons and controls
- Ensure `qa-btn`, `combat-btn`, `mob-btn`, `menu-option`, `mob-sheet-btn` all share consistent M3 motion and hover treatment.
- Add state-layer or surface feedback for segmented story filters (`.sf-btn`).
- Use M3-style pill shapes and balanced spacing for button groups.

### 5. Patterns and token use
- Prefer `--md-surface-c-high`, `--md-surface-c-low`, and `--md-outline-variant` for borders and backgrounds.
- Reserve accent colors for primary actions and danger states, while keeping text on-surface contrast high.
- Use `--r-md` / `--r-lg` in horizontal groups and cards, and `--r-sm` on smaller chips/controls.

## Changes made in this pass
- Added surface, border, radius, and elevation to `.sidebar-block`.
- Updated `#game` layout to use responsive `minmax()` column sizes with a `gap`.
- Polished topbar nav tabs with hover, active, and focus-visible states.
- Refined segmented story filter button hover/active states.
- Added icon button pressed and keyboard focus visual feedback.

## Next recommended M3 improvements
- Review `#location-hero` cards and buff bar surfaces to improve hero layering.
- Polish `mobile-sheet` dialog surfaces and background blur for an M3 modal experience.
- Make `story-filters` segmented buttons look more like an M3 segmented control.
- Add subtle state layers for `.menu-option` and `.btn-action` pressed states.
- Validate the new styles in both `dark` and `light` themes.
