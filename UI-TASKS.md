# RolText UI Tasks

## Priority 1 — Core M3 polish
- [ ] Add hover/pressed state layers to topbar buttons and navigation tabs.
- [ ] Improve `enemy-panel` surface contrast and elevation.
- [ ] Refine the mobile player header spacing and visual separation.
- [ ] Ensure story filters and log text remain readable in both dark and light themes.
- [ ] Add consistent focus ring styling for keyboard navigation.

## Priority 2 — Visual system consistency
- [ ] Use M3 semantic colors for badges, chips, and status indicators.
- [ ] Apply `--r-md` and `--r-lg` consistently on panels and cards.
- [ ] Add subtle background surfaces behind `skill-panel` and `buff-bar`.
- [ ] Confirm `location-hero` works with image and text overlay spacing.

## Priority 3 — Documentation and workflow
- [ ] Document component patterns in `DESIGN-GUIDELINES.md`.
- [ ] Update `PROJECT-OVERVIEW.md` when new UI modules or patterns are introduced.
- [ ] Review JS panel toggles and identify opportunities for smaller UI improvements.
- [ ] Capture design decisions in markdown before making larger style changes.

## Notes
- Prefer small, modular CSS updates that don’t require structural HTML changes.
- Validate both theme modes using the `data-theme` attribute.
- Keep the agent prompt and docs synced with any new workflow changes.
