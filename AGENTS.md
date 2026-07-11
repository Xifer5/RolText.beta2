# Custom Agents for RolText

This repository includes a custom Copilot agent for design-driven work and Material Design 3 refinement.

## Available Agents

- `legacy/roltext-m3-agent.agent.md`
  - Title: RolText M3 Design Assistant
  - Purpose: scaffold workflows, analyze UX/UI, and propose M3-consistent improvements for HTML/CSS/JS/MD.
  - Best use: review `docs/PROJECT-OVERVIEW.md` first, then work from `index.html`, `styles-m3.css`, and the `js/` source files.

## Notes

- Use `docs/PROJECT-OVERVIEW.md` as the project knowledge base before making edits.
- Project docs live in `docs/` (story canon: `docs/HISTORIA.md`; spec workflow: `docs/SPEC_WORKFLOW.md` + `specs/`). Archived dumps live in `legacy/`.
- The agent is optimized for design and workflow tasks, not just code fixes.
- Keep changes aligned to the existing Material Design 3 styling and responsive game UI layout.
