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

## UI components to prioritize — STATUS & IMPROVEMENTS
- ✅ **Topbar navigation**: Active tab states with visual feedback, icon buttons with scale & border dynamics
- ✅ **Sidebar vitals**: HP, MP, XP bars clear with color coding and proper contrast
- ✅ **Enemy panel**: Now prominently styled with 2px red border, gradient background, elevated shadow
- ✅ **Location hero**: Gradient overlay with clear button elevation and hover feedback
- ✅ **Mobile header**: Enhanced padding, border emphasis, gradient background for visual separation
- ✅ **Story log & filters**: Visible filters with solid backgrounds, log with gradient for depth
- ✅ **Skill panel & buff bar**: Gradient surfaces with proper elevation and button state feedback
- ✅ **Badges & chips**: Consistent semantic colors with transparent borders for polish

## Implementation Patterns (v2)

### Interactive Controls — Button State Hierarchy
All interactive elements follow this M3 pattern:
1. **Default**: Surface with outline/border
2. **Hover**: Transform: translateY(-1px), enhanced shadow, color/border emphasis
3. **Active**: Transform: translateY(0), inset shadow for pressed feedback
4. **Focus-visible**: Primary colored outline, outline-offset: 3px (or 2px for tight controls)

**Examples**: `.btn-action`, `.menu-option`, `.sf-btn`, `.icon-btn`, `.qa-btn`

### Surface Layers — Depth Via Gradients
Containers now use subtle gradients for visual hierarchy:
- **Single surface**: `var(--md-surface-c)` → solid
- **Elevated surface**: `linear-gradient(135deg, var(--md-surface-c-high), var(--md-surface-c))` → gradient
- **Emphasis container**: `var(--md-error-container)` + gradient overlay for special areas

**Examples**: `#enemy-panel`, `.buff-bar`, `.skill-panel`, `.story`, `.mobile-player-card`

### Focus Accessibility
Keyboard navigation is critical:
- All buttons/inputs have `:focus-visible` states
- Focus ring: 3px solid primary color with 3px offset
- Icon buttons: tighter 2px offset for compact spacing
- No focus-visible state is disabled/invisible

### Color Roles
- **Primary** (`--md-primary`): Main actions, highlights, accent
- **Error/Danger** (`--md-error`): Enemy indicators, damage, alerts
- **Tertiary/Heal** (`--md-tertiary`): Healing, safe zones, positive actions
- **Secondary**: Secondary containers, badges, calm UI sections
- **On-surface variants**: Always use proper `--md-on-*` for text on colored backgrounds

## Workflow recommendations
1. Start by reviewing `PROJECT-OVERVIEW.md` for the overall scope.
2. Inspect `index.html` and `styles-m3.css` before touching JavaScript.
3. When making visual changes:
   - update CSS variables first,
   - add new utility classes only when necessary,
   - document the intention in markdown.
4. When proposing new features or patterns, include examples of the expected HTML/CSS structure.
5. Always test both dark and light themes using `data-theme` toggling.
6. Use the implementation patterns above to maintain consistency.

## Recent polish completions (June 2026)
- ✅ Priority 1: Core M3 Polish — Topbar, enemy panel, mobile header, story filters, focus rings
- ✅ Priority 2: Visual System Consistency — Button state layers, surface gradients, badges, modal polish
- ⏳ Priority 3: Documentation & workflow refinement (in progress)

## Suggested next tasks
- Complete Priority 3 documentation and component pattern guide
- Consider creating reusable CSS utility classes for common patterns (`.surface-elevated`, `.button-state-hover`, etc.)
- Review and document accessibility patterns (keyboard, screen reader, color contrast)
- Plan any remaining visual refinements based on Priority 3 recommendations
