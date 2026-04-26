# Design

## Register

Product UI. Use familiar admin patterns with strong hierarchy, predictable grids, and compact but readable density.

## Visual Direction

Restrained light interface with tinted neutrals, one blue primary accent, and small semantic colors for status. The UI should feel like a serious workflow tool, not a marketing page.

## Layout

- Top navigation remains global: Dashboard, Run, Flow, Tools, Insights.
- Flow library and Tools use a 70/30 list-detail layout.
- Run uses three columns: run list, step timeline, wide selected step detail.
- Composer uses a three-part product surface: flow brief, step graph canvas, step inspector.

## Components

- Cards only for distinct selectable items and panels.
- No nested card stacks.
- Step graph nodes use clear connectors, status chips, tool badges, and selected state.
- AI input is an inline floating editor attached to the graph context.

## Motion

Use 150 to 220 ms transitions for selection, hover, and patch feedback. Motion should show state changes only.
