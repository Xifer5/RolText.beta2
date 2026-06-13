# RolText UI Tasks

## Priority 1 — Core M3 polish ✅ COMPLETE
- [x] Add hover/pressed state layers to topbar buttons and navigation tabs.
- [x] Improve `enemy-panel` surface contrast and elevation.
- [x] Refine the mobile player header spacing and visual separation.
- [x] Ensure story filters and log text remain readable in both dark and light themes.
- [x] Add consistent focus ring styling for keyboard navigation.

### P1 Changes Applied:
- **Icon buttons (.icon-btn)**: Enhanced with scale transforms, border dynamics, and improved active states
- **Enemy panel (#enemy-panel)**: 2px red border, gradient background, elevated shadow, inset gradient overlay
- **Mobile header**: Increased padding, stronger border-bottom, gradient background
- **Story filters (.sf-btn)**: Improved visibility with solid backgrounds, enhanced hover states
- **Focus rings**: Added consistent focus-visible treatment across all interactive elements

## Priority 2 — Visual system consistency ✅ COMPLETE
- [x] Use M3 semantic colors for badges, chips, and status indicators.
- [x] Apply `--r-md` and `--r-lg` consistently on panels and cards.
- [x] Add subtle background surfaces behind `skill-panel` and `buff-bar`.
- [x] Confirm `location-hero` works with image and text overlay spacing.

### P2 Changes Applied:
- **Button state layers**: Enhanced pressed states with inset shadows for .btn-action and .menu-option
- **Skill panel & buff bar**: Gradient backgrounds for visual depth, improved button transitions
- **Badges**: Transparent borders on .rarity-badge, .npc-quest-badge, .profile-role
- **Story log**: Gradient background for better visual separation
- **Modal surfaces**: Enhanced mobile-sheet with backdrop blur and better contrast
- **Location hero button**: Smooth elevation transitions with hover/active feedback

## Priority 3 — Documentation and workflow
- [ ] Document component patterns in `DESIGN-GUIDELINES.md`.
- [ ] Update `PROJECT-OVERVIEW.md` when new UI modules or patterns are introduced.
- [ ] Review JS panel toggles and identify opportunities for smaller UI improvements.
- [ ] Capture design decisions in markdown before making larger style changes.

## Notes
- Prefer small, modular CSS updates that don’t require structural HTML changes.
- Validate both theme modes using the `data-theme` attribute.
- Keep the agent prompt and docs synced with any new workflow changes.
