# RolText Design Guidelines

## Purpose
This document captures the design and workflow principles for Pixel Quest Echoes, with a focus on the Material Design 3 skin and responsive game UI.

## Design goals
- Preserve the existing HTML/JS structure while improving visual hierarchy.
- Use Material Design 3 semantic tokens and surface roles.
- Keep the interface readable and immersive for both desktop and mobile players.
- Maintain clear contrast, accessible typography, and consistent spacing.

## Material Design 3 guidance
- Use `--md-primary`, `--md-secondary`, `--md-tertiary`, `--md-surface`, `--md-on-surface`, `--md-outline` for color roles.
- Apply `--r-sm`, `--r-md`, `--r-lg`, `--r-xl` for consistent rounded corners.
- Use elevation shadows with `--elev-1`, `--elev-2`, `--elev-3` to separate layers.
- Use state opacity variables for hover/pressed/focus states: `--md-state-hover`, `--md-state-pressed`, `--md-state-focused`.
- Give grouped controls like `story-filters`, `skill-panel`, `buff-bar`, `enemy-panel`, and `mobile-player-header` clear surface containers.
- Prefer surface-driven palettes over ad-hoc color values.

## Typography
- Brand display: `--font-display` for titles and strong UI identity.
- Section/title font: `--font-title` for panel headings and location names.
- Body: `--font-body` for content, story text, and labels.
- UI/system: `--font-ui` for small controls, selects, and button text.

## Layout and spacing
- Use consistent padding and margin values in multiples of `8px` or `12px`.
- Keep the topbar and sidebar visually distinct with surface and outline contrast.
- Ensure responsive scaling by using fluid widths and hidden mobile-only sections.
- Avoid overcrowding the center game area; keep story panels and buttons separated.

## UI components to prioritize
- Topbar navigation: ensure active tab states are visible and accessible.
- Sidebar vitals: make HP, MP, XP bars clear and meaningful at a glance.
- Location hero: blend image, title, and action button with M3 surface styling.
- Mobile header: preserve compact vitals and avoid hidden content.
- Story log and filters: keep filters visible and maintain readable text flow.

## Workflow recommendations
1. Start by reviewing `PROJECT-OVERVIEW.md` for the overall scope.
2. Inspect `index.html` and `styles-m3.css` before touching JavaScript.
3. When making visual changes:
   - update CSS variables first,
   - add new utility classes only when necessary,
   - document the intention in markdown.
4. When proposing new features or patterns, include examples of the expected HTML/CSS structure.
5. Always test both dark and light themes using `data-theme` toggling.

## Suggested next tasks
- Review the topbar buttons and add subtle M3 hover/pressed styling.
- Improve the `enemy-panel` and `buff-bar` surfaces with distinct elevation.
- Polish the mobile player header for better spacing and visual separation.
- Add clear focus ring styling for keyboard navigation.
- Document any UI components or new patterns in markdown.
