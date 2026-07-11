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

## Changes made in this pass — Priority 1 & 2 (COMPLETE)

### Priority 1 — Core M3 Polish
✅ **Topbar & icon buttons**
- Enhanced `.icon-btn` with dynamic borders, scale transforms (1.05 hover, 0.98 active)
- Added proper focus-visible styling with primary border color
- Improved transitions across color, border-color, box-shadow, transform

✅ **Enemy panel**
- Upgraded from 1px to 2px solid red border (`--md-error-container`)
- Added gradient background for visual depth
- Enhanced shadow: `var(--elev-2)` + inset gradient overlay
- Portrait now has error-red glow on hover

✅ **Mobile player header**
- Padding: 16px → 20px for better breathing room
- Border: 1px → 2px with stronger outline color
- Background: solid → gradient(180deg) for depth effect

✅ **Story filters (.sf-btn)**
- Background: transparent → `var(--md-surface-c)` for better visibility
- Border: 1px → 1.5px for stronger presence
- Added border-color transitions to primary on hover
- Active state: enhanced shadow with `var(--elev-1)`

✅ **Global focus rings**
- Added `.sf-btn:focus-visible` and `.compass-dir-label:focus-visible`
- Consistent outline-offset: 3px for rounded elements

### Priority 2 — Visual System Consistency
✅ **Button state layers**
- `.btn-action`: Added active pressed state with inset shadow, enhanced hover (brightness + elev-2)
- `.menu-option`: Added hover border color change, transform feedback, pressed inset shadow
- Both now follow M3 motion patterns with smooth transitions

✅ **Skill panel & buff bar**
- Both upgraded to gradient backgrounds: `linear-gradient(135deg, --md-surface-c-high, --md-surface-c)`
- Skill buttons: improved hover with border-color change to primary, inset shadow on active
- Better visual hierarchy with elevation

✅ **Story log (.story)**
- Background: solid → gradient for better depth perception
- Heal messages: improved gradient opacity for better visibility
- Better visual separation in both dark and light themes

✅ **Badges & indicators**
- `.rarity-badge`: Added transparent border for consistency
- `.npc-quest-badge`: Added transparent border
- `.profile-role`: Added transparent border
- All use M3 semantic container colors

✅ **Location hero button (.npc-talk-btn)**
- Added smooth transitions with transform feedback
- Elevation scaling: normal → elev-3 on hover → elev-1 on active

✅ **Mobile sheet modal**
- Enhanced backdrop blur: 6px (improved focus)
- Increased background opacity: 0.45 (better modal emphasis)
- Added border to modal-sheet-content for consistency

## Validation Results
✅ **Dark theme**: All components properly visible with excellent contrast and depth
✅ **Light theme**: Maintained readability and visual hierarchy
✅ **Focus accessibility**: Consistent keyboard navigation throughout
✅ **Motion**: Smooth transitions on all interactive elements
✅ **Both themes**: Gradients enhance depth without overwhelming

## Next recommended M3 improvements
- Review component patterns for potential modular CSS utilities
- Consider adding M3 elevation states to more panels for layering effect
- Polish any remaining button/control interactions for complete consistency
- Document final M3 implementation in DESIGN-GUIDELINES.md
