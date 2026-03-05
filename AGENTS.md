# AGENTS.md

## Purpose

This file is the non-negotiable source of truth for how AI agents create, modify, and extend this codebase. If a rule below conflicts with an idea or preference, the rule wins.

## Stack

- React 19.2
- TypeScript
- Vite
- Tailwind CSS v4

## Core principles (enforced)

- Keep things simple and readable.
- Prefer clear structure over clever abstractions.
- Follow existing patterns before introducing new ones.
- Do not add new libraries without strong justification and explicit approval.

## Before adding UI or logic

You must do all of the following before creating any new component, hook, or utility:

1) Search for prior art by both behavior and labels. Search for:
   - Existing component names or similar UI labels (button text, section titles, menu items)
   - Behavior keywords (copy, overflow, menu, tooltip, date range, etc.)

2) Reuse or extend existing abstractions when the differences are only:
   - Text/labels
   - Icons
   - Spacing or layout tweaks
   - Minor visual variants

   If those are the only differences, creating a new component is not allowed.

## Base component rule (strict)

Feature components must never use raw HTML elements to construct UI patterns that belong in a shared base component. All reusable UI primitives (buttons, inputs, cards, lists, badges, panels, etc.) must live as base components in the shared components layer.

- Before building any UI element inside a feature, check whether a base component already exists.
- If one exists, use it — even if it doesn't perfectly match the desired look. Extend or compose it instead of bypassing it.
- If one does not exist, create it as a base component first, then consume it from the feature.
- Raw HTML elements (`<button>`, `<input>`, `<div>` used as a card, etc.) appearing inside feature components as styled, interactive UI are not allowed. They must be replaced by or wrapped in a base component.

This ensures visual consistency, reduces duplication, and keeps the design system scalable.

## Composable architecture rules (enforced)

- Use composition over mode/configuration props.
- If a component needs behavior flags like `isX`, `mode`, `variant`, or `type` to switch structure in more than one region of JSX, split it into:
  - a provider/root that owns state and actions, and
  - composed subcomponents that render only the needed structure.
- Do not build "universal" feature components with optional callbacks for unrelated modes.
- If two modes render materially different trees, they must be separate composed branches, not conditionals spread across one component.
- Generic compound components must expose domain-agnostic slots/subcomponents (`Root`, `Trigger`, `Content`, `Item`, etc.).
- Feature-specific compounds are allowed only when domain coupling is real and unavoidable.

### Required composition pattern for complex UI

When UI has orchestration + multiple interactive parts, use:

1) `Provider` (or root hook) for state, side effects, and actions.
2) Small presentational subcomponents for layout/parts.
3) Context interface that exposes only what subcomponents need.

Subcomponents must depend on the interface, not implementation details.

### Anti-patterns (not allowed)

- Boolean-heavy "mode" components that mix multiple modes in one render function.
- Re-implementing the same interaction pattern in multiple places.
- Duplicating the same popover + loading + error + success rendering flow across components.
- Hiding business logic in utility files that return JSX for feature-specific rendering.

## Reuse vs create (strict)

- Default behavior is reuse. Creating new components is the exception.
- If a UI structure appears in two or more places, it must be a shared component.
- If the same logic appears in two or more places, it must be extracted into a hook or utility.
- If you add a second instance of a duplicated pattern, you must refactor immediately, not later.
- New components must represent a reusable, named abstraction with a clear purpose and explicit props. A block of JSX with click handlers is not a component.

### Duplication threshold (strict)

- First use: inline is acceptable.
- Second use: extract immediately into a reusable component/hook/utility before finishing the task.
- "Mostly similar" counts as duplicate if behavior is the same and only labels/icons/styles differ.

### Component classification

When asked to create a component, first classify the request as either:
- **Generic UI pattern** (switch, segmented control, toggle group, button group, card, list item, etc), or
- **Context-specific component** tied to a single feature.

If it can reasonably be generic, implement the generic component first as a base component and configure it via props. Context-specific components are only allowed when the component is tightly coupled to a specific domain and the structure/behavior does not make sense outside that context.

Never embed domain-specific logic, labels, or icons inside a generic component. Inject everything via props.

### Single-use components (narrow exception)

A new component used only once is allowed only when it is required to keep a parent file within the size limits or to keep responsibilities separate. In that case:

- It must be placed under the relevant feature's component folder.
- It must be strictly presentational.
- It must not contain new logic, formatting, or transformations.

If those conditions are not met, keep the JSX inline in the parent component and refactor only when reuse is required.

## Separation of concerns (strict)

- Components are presentational only.
  - They may accept callbacks and props.
  - They must not fetch data.
  - They must not perform formatting, transformation, or business logic beyond trivial conditional rendering.
  - Event handlers must delegate to hook actions or props; no inline logic beyond calling those functions.
  - **No inline function definitions** inside JSX or render bodies. Extract handlers, callbacks, and closures into named functions declared before the return statement.
- Generic components must be domain-agnostic: no theme handling, feature flags, API calls, or business rules.
- Domain logic must live in hooks, services, or utilities and be injected into components via props.
- Hooks own state, side effects, and orchestration.
- Services own API calls.
- Utilities own pure, reusable logic (formatters, parsers, calculations).

## Structure and placement

- Screens compose features and components.
- Features group domain logic, hooks, services, and related UI.
- Reusable UI components live in the shared base components layer.
- Feature-specific UI, hooks, and utilities live within their respective feature.
- App-level utilities, contexts, hooks, and types each have their own dedicated location.

## Files and naming

- Use kebab-case for all files.
- One component per file.
- Prefer named exports.
- Hooks must start with `use`.
- **Do not** name generic components after the first use case.
  - Bad: `ThemeSelector`
  - Good: `SegmentedControl`, `ToggleGroup`, `Switch`
- Use the `function` keyword for all components (not arrow functions).
- All props must be destructured on a single line in the function signature — do not break props across multiple indented lines.

## State

- Prefer local state (`useState`).
- Use `useReducer` when state becomes complex or action-driven.
- Keep state close to where it is used.
- Lift state only when necessary.
- Avoid global state unless clearly required.

## Data fetching

- API calls live in service files.
- Screens and components never fetch data directly.
- Consume data via hooks (`use-` pattern).

## Styling

- Use Tailwind CSS.
- Avoid inline styles unless unavoidable.
- Prefer composition over custom CSS.
- Keep styles close to components.

## Responsive design

- Application must work on both desktop and mobile browsers.
- UI must be fluid and responsive, not limited to fixed breakpoints.
- Use Tailwind's responsive utilities when needed.
- Mobile-first approach: start with mobile layout, enhance for larger screens.

## TypeScript

- No `any`.
- Use explicit types at function boundaries.
- Define types for API responses.
- Domain-specific types live with their feature.

## File size and readability limits (enforced)

- Component files must not exceed 400 lines.
- Hook files must not exceed 400 lines.
- Utility files must not exceed 150 lines.
- If you exceed these limits, you must split the file into smaller, single-purpose pieces before finishing the task.

## Do not

- Mix UI and business logic.
- Duplicate utilities or markup.
- Introduce one-off UI structures when a reusable component exists or can be composed.
- Use raw HTML elements in feature components when a base component exists or should be created.
- Bypass existing abstractions.
- Refactor unrelated code.

## When unsure

- Match existing code patterns.
- Choose the simplest solution.
- Ask before introducing new structure.
