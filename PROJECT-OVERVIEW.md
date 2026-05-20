# RolText Project Overview

## Project name
Pixel Quest Echoes (RolText)

## Purpose
A browser-based text RPG with a Material Design 3 visual shell and a responsive dashboard-style interface.

## Core structure
- `index.html` - main UI shell with topbar, left sidebar, center game screen, and mobile-friendly layout.
- `styles-m3.css` - Material Design 3 skin for the existing app. Contains color tokens, typography, shape radius, elevation, and responsive visual system.
- `styles.css` - original app styling (kept separate from the M3 skin).
- `js/` - game logic modules: combat, inventory, crafting, map, dialogue, save system, UI management, audio, and story.
- `img/`, `music/`, `sounds/` - asset folders.

## Design principles
- M3 color system with warm amber/fantasy palette.
- Dark and light theme support via `data-theme` attribute.
- Elevated cards, soft surfaces, and clear visual hierarchy.
- Consistent typography using display/fantasy fonts for brand and serif fonts for body text.
- Focus on readability, accessible contrast, and mobile-first usability.

## Key UI patterns
- Top navigation bar with action buttons and language/theme toggles.
- Left sidebar for character stats, vitals, and quick navigation.
- Central game panel for location, story log, combat, and interactive buttons.
- Mobile player header and compact vitals for smaller screens.
- Persistent floating menu and panel switching.

## Material Design 3 specifics
- Uses M3 semantic tokens: `--md-primary`, `--md-surface`, `--md-on-surface`, `--md-outline`, etc.
- Adapts existing CSS variables for the current project: `--bg`, `--border`, `--c-text`, `--c-hp`, etc.
- Defines M3 shape radii: `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`.
- Includes motion timings and state layer opacities.
- Keeps HTML and JS untouched while mapping visual roles in CSS.

## Workflow guidance
- Always prefer non-destructive design improvements.
- Keep new UI changes consistent with current IDs and class names when possible.
- Use `PROJECT-OVERVIEW.md` as your first reference when planning tasks.
- Propose minimal, modular layout or style changes that improve readability and immersion.
- Document design decisions in markdown when adding new UI patterns.
