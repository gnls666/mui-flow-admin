# Create Flow Page

This document explains the Flow Composer page: layout, React/MUI components, and the mocked business logic used to create or edit an AI-assisted workflow.

## Page Goal

Create Flow is the workspace where an operator turns an Excel automation idea into a reusable flow. A flow is made of ordered steps. Each step binds to one tool, has inputs and outputs, and can later produce runs that pause for uploads, approvals, passwords, or other human input.

The page answers three questions:

- What flow am I editing?
- How does the workflow move from step to step?
- What exactly should the selected step do?

## ASCII Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ TopBar: logo + primary tabs + user                                           │
├───────────────┬──────────────────────────────────────┬───────────────────────┤
│ Flow brief    │ Workflow canvas                      │ Selected step editor  │
│               │                                      │                       │
│ Title/status  │ ┌──────────────────────────────────┐ │ Step title/status     │
│ Description   │ │ Step graph: 01 -> 02 -> 03 -> 05 │ │ Step fields           │
│ Create run    │ └──────────────────────────────────┘ │ Tool picker           │
│ Back          │ ┌──────────────────────────────────┐ │ Missing inputs        │
│ Excel context │ │ Selected step workspace          │ │ Apply / Refine        │
│               │ │ - AI command                     │ │ AI suggestions        │
│               │ │ - Patch preview                  │ │                       │
│               │ │ - Context / schema / recommends  │ │                       │
│               │ └──────────────────────────────────┘ │                       │
└───────────────┴──────────────────────────────────────┴───────────────────────┘
```

## Route And Navigation

The top-level navigation uses MUI `Tabs` in `TopBar`.

- `Flow` opens the flow product area.
- `FlowLibrary` lists saved templates.
- `Open composer` or `New Flow` switches the secondary flow view to `composer`.
- The URL hash is synced through `#flow/library` and `#flow/composer`.
- `Back to flow list` returns to the library without changing the primary tab.

## Main Components

`FlowWorkspace`

Owns the flow secondary view. It switches between the library and composer and resets composer mode when opening a new flow.

`FlowLibrary`

Shows flow templates in a list/detail layout. It lets users select a flow, create a run from it, or open it in composer.

`FlowComposer`

Owns the editing state for the current flow:

- `steps`: local composer copy of the flow steps
- `selectedComposerStepId`: selected graph node
- `aiCommand`: inline command text
- `patchPreview`: mocked AI patch summary
- `requestedInputs`: missing input labels that the user has marked as requested

`ComposerBriefPanel`

Left column. It keeps only stable flow identity and launch actions:

- breadcrumb
- flow title and status
- description
- `Create run`
- `Back to flow list`
- compact Excel context

It intentionally does not include another prompt editor, because that duplicated the center AI workspace.

`WorkflowGraphCanvas`

Center column. It is the primary workbench.

- Header: page title, step count, add step action
- Graph: horizontal step cards
- Selected step workspace: AI command, patch preview, context, schema hints, AI recommendations

`ComposerStepCard`

One node in the graph. The card is deliberately compact:

- Top row: step number and status
- Body: step name
- Tool row: tool icon and tool name
- Footer: readiness indicator

The tool icon is not placed in the top row because the card is narrow and the status chip also needs space. This prevents icon/status overlap.

`SelectedStepWorkspace`

The AI-native area under the graph. It represents the active edit loop for the selected step:

- `AI command`: user asks AI to change the selected step
- `Patch preview`: mocked diff-style output
- `Apply AI patch`: commits the AI-generated patch to local composer state
- `Add approval pause`: inserts a human approval step after the selected step
- `Ask for files`: converts selected step intent into an upload step
- `Step context`: source files, output, detected sheets
- `Schema hints`: available fields inferred from inputs
- `AI recommendations`: simple validation suggestions

`ComposerInspector`

Right column. It edits the selected step directly:

- current step title and status
- editable `Step title`, `Inputs`, `Output`
- tool contract opener and tool picker
- missing inputs
- `Apply draft` and `Refine`
- AI suggestion callout

## MUI Component Usage

The page uses MUI primitives rather than custom layout systems:

- `Box` for layout containers and CSS grid
- `Stack` for vertical and horizontal spacing
- `Paper` through the local `Panel` wrapper
- `Button`, `IconButton`, and `ButtonBase` for actions and clickable cards
- `TextField` for editable step fields and AI command input
- `Chip` for status and small metadata
- `Divider` for workbench section boundaries
- `Typography` for heading and label hierarchy

Icons come from `@mui/icons-material`, including:

- `AutoAwesomeRounded` for AI actions
- `CheckCircleRounded` for readiness and recommendations
- `UploadFileRounded`, `TableChartRounded`, `ApprovalRounded`, `LockRounded`, `FolderZipRounded` for step types
- `SendRounded` for inline AI command submission

## Business Logic

### Creating A Flow

When the user clicks `New Flow`, the app opens composer mode with seeded steps from the sheet orchestration template. In a real backend, this would start from an empty flow draft or an AI-generated draft based on the user prompt.

The current mock keeps the experience deterministic:

1. Seed steps with `seedStepsForComposer`.
2. Select the first `AI suggested` step.
3. Let the user edit step fields or use inline AI.
4. Let the user apply the draft back to the flow.

### Editing A Step

Selecting a graph card updates `selectedComposerStepId`. Both the center workspace and right inspector read the same selected step.

Manual edits call `patchComposerStep`, which updates only the selected step:

- title changes set status to `Draft`
- input changes set status to `Draft`
- output changes set status to `Draft`
- tool changes refresh kind, inputs, output, and status

### Inline AI Patch

`applyAIInlinePatch` is a deterministic mock of AI behavior. It reads the command text, infers a patch through `inferInlinePatch`, updates the selected step, and shows the patch notice.

Examples:

- A command containing `approve` makes the step an approval checkpoint.
- A command containing `upload` or `file` makes the step an upload step.
- A command containing validation language creates a workbook schema validation step.

### Inserting Human Pauses

`Add approval pause` creates a new step after the selected step:

- tool: `Approval Gate`
- input: selected step output
- output: `approval.receipt.json`
- status: `Needs approval`

The steps are then re-indexed so the graph remains ordered.

### Tool Binding

Every step has a `toolId`. The selected step editor lets the user switch between known tools:

- Upload Files
- Read Sheet
- Sheet Reorder
- Approval Gate
- Zip Password
- Export Package

Changing the tool also changes the step kind and default input/output contracts from the tool registry.

### Creating A Run

`Create run` turns a flow template into a mocked run item. The run tab then displays:

- run list
- run detail
- selected run step detail

This separates flow design from run execution. A flow is reusable; a run is one execution instance.

## Design Notes

The page is intentionally dense but not decorative:

- The left column is identity and navigation only.
- The center column is the workbench.
- The right column is the selected step form.
- No duplicated objective prompt appears in the left column.
- No empty center area remains; lower space is used for selected step context.
- Narrow graph cards avoid top-row icon/status collisions by moving the tool icon into the tool row.

## Restore From Single File

The project can be archived into one JavaScript module:

```bash
npm run bundle
```

Restore it into a fresh directory:

```bash
node scripts/restore-project.mjs project.bundle.mjs restored-project --force
```

The bundle includes source files, docs, config, and package lock. It excludes generated or local-only directories such as `node_modules`, `dist`, `.git`, `.playwright-cli`, and `coverage`.
