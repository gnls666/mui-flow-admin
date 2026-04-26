# Agentic Workflow Plan

> Status: pinned product and implementation plan  
> Last updated: 2026-04-26  
> Scope: React 19 + TypeScript + MUI prototype

## Goal

Turn the current workflow management prototype into an agentic workflow builder for Excel-heavy automation. The product should let users describe a business process in natural language, then review and edit a structured Flow made of Steps, where every Step uses one existing Tool.

The main product principle is:

> AI is the creation, completion, explanation, and repair layer. The workflow graph remains the source of truth.

## Research Summary

The best workflow platforms are not pure chat products. They use AI to create or improve structured workflows, then keep the workflow visible, inspectable, testable, and editable.

| Platform | Pattern to borrow | Product implication |
| --- | --- | --- |
| Microsoft Power Automate | Copilot creates cloud flows from natural language, but the result becomes trigger/action cards in the designer. Copilot remains available for edits and explanations. | Use chat to generate the draft, then immediately materialize it into editable Flow/Step cards. |
| Zapier | Copilot supports auto-build and guided build modes. Steps still move through setup, configure, and test. | Add an AI mode that can either draft aggressively or ask for confirmation step by step. |
| Make | Scenario debugging exposes per-module input/output bundles after `Run once`. | Step detail should show input files, output files, logs, and run artifacts beside each step. |
| n8n | AI Workflow Builder can create, refine, and debug workflows. Human approval can be required before specific tool calls. | Human-in-the-loop should be step/tool level, not only final publish approval. |
| Dify | Human Input node pauses a workflow and asks for structured user input. | Upload, approve, and password steps should be explicit pause points in Runs. |
| Gumloop | Agents can call workflows as tools. Run Log exposes node status, runtime, cost, and input/output. | A Flow can later become a reusable Tool. Debugging must be node/step scoped. |
| Lindy | Agent tasks expose block-by-block inputs/outputs and can require action confirmation. | The UI should make side-effect risk visible before execution. |
| LangGraph | Interrupts and checkpoints pause execution and resume from saved state. | Runs need resumable state, especially when waiting for user input. |
| OpenAI Agent Builder / AgentKit | Agents, tools, typed inputs/outputs, and control flow are composed on a visual canvas. | Tool definitions need typed schemas, not just names and descriptions. |
| Workato | Recipe copilots help generate automation while the recipe remains the artifact. | Keep the artifact as Flow, not as a chat transcript. |

Sources:

- Microsoft Power Automate Copilot: https://learn.microsoft.com/en-us/power-automate/create-cloud-flow-using-copilot
- Zapier Copilot: https://help.zapier.com/hc/en-us/articles/15703650952077-Use-the-power-of-AI-to-generate-Zaps
- n8n AI Workflow Builder: https://docs.n8n.io/advanced-ai/ai-workflow-builder/
- n8n human-in-the-loop tools: https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/
- Dify Human Input node: https://docs.dify.ai/en/use-dify/nodes/human-input
- Gumloop Agents: https://docs.gumloop.com/core-concepts/agents
- Gumloop Run Log: https://docs.gumloop.com/core-concepts/run_log
- LangGraph interrupts: https://docs.langchain.com/oss/python/langgraph/interrupts
- OpenAI Agent Builder: https://developers.openai.com/api/docs/guides/agent-builder
- Workato AI features: https://docs.workato.com/ai-features/copilot.html

## Product Shape

Current top navigation should stay simple:

```text
Dashboard | Run | Flow | Tools | Insights | User
```

The product should revolve around four objects:

| Object | Meaning |
| --- | --- |
| Flow | A reusable workflow template. |
| Step | One ordered operation inside a Flow. |
| Tool | A reusable capability that a Step can call. |
| Run | One execution instance of a Flow. |

No extra primary entity is needed right now. Agent, prompt, and AI draft can be UI/state concepts before becoming backend objects.

## Flow Builder UX

The Flow page should keep the current 70/30 structure, but the right side becomes a combined Flow detail and AI creation panel.

```text
┌────────────────────────────── 70% ──────────────────────────────┬────────────── 30% ──────────────┐
│ Flow list / selected flow builder                               │ Flow detail + AI create          │
│                                                                  │                                  │
│ ┌ Flow card ┐ ┌ Flow card ┐ ┌ Flow card ┐                       │ Title                            │
│                                                                  │ Description                      │
│ Selected flow                                                     │                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │ ┌ Inline AI chat ─────────────┐ │
│ │ 1. Upload source workbooks                                  │ │ │ Describe your automation... │ │
│ │    Tool: Upload Files                                       │ │ └─────────────────────────────┘ │
│ │    Status: needs file input                                 │ │                                  │
│ ├──────────────────────────────────────────────────────────────┤ │ Suggested steps                  │
│ │ 2. Read sheet headers                                       │ │ 1. Upload Files                  │
│ │    Tool: Read Sheet                                         │ │ 2. Read Sheet                    │
│ │    Output: headers.json                                     │ │ 3. Sheet Reorder                 │
│ ├──────────────────────────────────────────────────────────────┤ │                                  │
│ │ 3. Reorder and export                                       │ │ Apply draft | Regenerate         │
│ │    Tool: Sheet Reorder + Export Package                     │ │                                  │
│ └──────────────────────────────────────────────────────────────┘ │                                  │
└──────────────────────────────────────────────────────────────────┴──────────────────────────────────┘
```

The inline AI box should support three core actions:

1. Create a new Flow draft from natural language.
2. Improve the selected Flow by adding, removing, or reordering Steps.
3. Explain why each Step and Tool was chosen.

### Composer Interaction Update

The Composer should feel like an AI-assisted inline editor, not a static draft panel. The structured Flow remains the source of truth, and AI proposes patches against the selected Step.

```text
Flow list -> New Flow / Open composer

┌──────────────────────── editable steps ────────────────────────┬──────── AI draft/context ────────┐
│ [01] Upload source workbooks                                    │ Flow title + description          │
│ [02] Inspect sheet headers                                      │ Suggested step plan               │
│ [03] Map and reorder tabs   <selected>                          │ Missing inputs                    │
│      └ inline editor: title / tool / inputs / output             │ Agent trace                       │
│ [04] Approval checkpoint                                        │ Focused step context              │
│ [05] Export board pack                                          │                                  │
└─────────────────────────────────────────────────────────────────┴──────────────────────────────────┘
                         ▲
                         └ floating AI input
                           "validate workbook schema before reorder"
                           Apply patch | Add approval pause | Ask for files
```

Key interaction rules:

- Selecting a Step focuses the Composer on that Step.
- The selected Step expands into an inline editor for title, Tool, inputs, and output.
- The floating AI input applies a local `ComposerStepPatch` to the selected Step.
- Tool changes are resolved from the Tool registry, so the AI output is constrained to known capabilities.
- Right-side AI draft remains useful as context, but the primary AI interaction is now inside the editing flow.

## Run UX

The Run page keeps the three-column layout. The right column should be the largest because it is where the active Step is configured, inspected, and completed.

```text
┌────── Run list ──────┬────── Run steps ──────┬──────────────────── Step detail ────────────────────┐
│ Running              │ 1 Upload Files        │ Overview                                             │
│ Waiting for input    │ 2 Read Sheet          │ Tool: Upload Files                                   │
│ Failed               │ 3 Approval Gate       │                                                      │
│ Completed            │ 4 Export Package      │ Inputs                                               │
│                      │                       │ - upload zone                                        │
│                      │                       │                                                      │
│                      │                       │ Outputs                                              │
│                      │                       │ - source-files.manifest.json                         │
│                      │                       │                                                      │
│                      │                       │ AI help                                              │
│                      │                       │ "This run is waiting because no workbook was added." │
└──────────────────────┴───────────────────────┴──────────────────────────────────────────────────────┘
```

The Run page should make pauses explicit:

- Upload step waits for files.
- Approval step waits for approve/reject.
- Zip password step waits for password input.
- Failed step shows logs, input/output state, and AI repair suggestions.

## Tools UX

The Tools page now follows the Flow layout. Next, each Tool needs a schema so that AI can choose and configure it safely.

Every Tool should show:

- Name
- Category
- Description
- Input schema
- Output schema
- Whether it requires human input
- Whether it has side effects
- Example prompts
- Used-by steps

Example:

```ts
type ToolDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  requiresHumanInput: boolean;
  hasSideEffects: boolean;
  inputs: ToolField[];
  outputs: ToolArtifact[];
  promptHints: string[];
};
```

## Data Model Direction

Keep the frontend model explicit and small:

```ts
type Flow = {
  id: string;
  title: string;
  description: string;
  status: FlowStatus;
  steps: FlowStep[];
};

type FlowStep = {
  id: string;
  name: string;
  toolId: string;
  description: string;
  requiredInputs: string[];
  expectedOutputs: string[];
  humanInput?: HumanInputSpec;
};

type AIDraft = {
  title: string;
  description: string;
  steps: Array<{
    name: string;
    toolId: string;
    reason: string;
  }>;
};

type RunStep = FlowStep & {
  status: RunStepStatus;
  inputFiles: string[];
  outputFiles: string[];
  logs: string[];
};
```

This keeps the prototype close to the future backend contract without adding backend complexity now.

## AI Behavior Rules

AI should not directly execute risky actions. It should draft, suggest, explain, and repair.

Allowed in the prototype:

- Generate Flow title and description.
- Suggest Steps from existing Tools.
- Explain Tool choices.
- Suggest missing configuration.
- Explain failed Run steps.

Not needed yet:

- Real API integration.
- Real file upload persistence.
- Real Excel parsing.
- Real agent execution.
- Real approval or password submission backend.

## Implementation Plan

### Phase 1: Pin the Plan

- Create `docs/agentic-workflow-plan.md`.
- Keep the plan source-controlled and use it as the product reference.
- No UI code changes in this phase.

### Phase 2: Add Tool Schema

Files:

- Modify `src/App.tsx`
- Modify `src/App.test.tsx`

Work:

- Extend current tool mock data with input schema, output schema, side-effect flag, human-input flag, and prompt hints.
- Update Tools detail to display schema and AI prompt hints.
- Add tests for tool schema rendering.

Validation:

```bash
npm run test:run
npm run build
```

### Phase 3: Add AI Flow Draft Panel

Files:

- Modify `src/App.tsx`
- Modify `src/App.test.tsx`

Work:

- Add inline AI chat box to Flow detail.
- Add deterministic mock prompt examples.
- Generate a local `AIDraft` from a prompt.
- Show draft title, description, and suggested steps.
- Add `Apply draft` to turn the draft into selected Flow steps.

Validation:

```bash
npm run test:run
npm run build
```

### Phase 4: Upgrade Flow Step Cards

Files:

- Modify `src/App.tsx`
- Modify `src/App.test.tsx`

Work:

- Render selected Flow steps as ordered cards.
- Show tool, inputs, outputs, and human-input status.
- Add a tool selector pattern that uses existing Tools only.
- Keep editing inline and lightweight.

Validation:

```bash
npm run test:run
npm run build
```

### Phase 5: Connect Run Step Detail to Tool Schema

Files:

- Modify `src/App.tsx`
- Modify `src/App.test.tsx`

Work:

- Use the same step/tool schema in the Run detail column.
- Show overview, tool, input files, output files, logs, and required user action.
- Add AI help copy for waiting and failed states.

Validation:

```bash
npm run test:run
npm run build
```

### Phase 6: Visual Polish

Files:

- Modify `src/App.tsx`
- Modify global styles if needed

Work:

- Tighten spacing rhythm across Flow, Run, and Tools.
- Make inline AI box look like a primary product surface, not a support widget.
- Keep cards compact and operational.
- Avoid marketing-style hero sections.
- Browser-check desktop and narrow widths.

Validation:

```bash
npm run test:run
npm run build
```

Then inspect in browser:

- Dashboard tab
- Run tab
- Flow tab with AI draft
- Tools tab
- Insights tab

## Design Decisions

1. Build graph-first, not chat-first.
2. Keep AI inline and contextual.
3. Force every Step to use an existing Tool.
4. Treat human input as a first-class pause point.
5. Show input/output artifacts close to the Step.
6. Do not add backend, auth, or real AI calls until the interaction model feels right.

## Open Questions

These can wait until after the first frontend prototype:

- Should a Flow be publishable/versioned?
- Should Tools be editable by admins only?
- Should AI drafts have confidence scores?
- Should a Flow be reusable as a Tool?
- Should Run replay be allowed from a failed Step?

## Next Recommended Move

Implement Phase 2 and Phase 3 together:

- Tool schema gives the AI builder real constraints.
- AI Flow Draft panel gives the product its core agentic interaction.

This gives the fastest path to a browser-visible prototype without over-engineering backend execution.
