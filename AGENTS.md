# AGENTS.md - Repository Source of Truth

Read .ai-harness.yaml before any task.

## Repository role

This repository is the frontend consumer of backend contract outputs.

This repository owns:
- Frontend behavior in src.
- Consumer-side adaptations of generated API usage.

This repository consumes:
- API contract via generated client under src/api/generated.

This repository does not own:
- Requirements outside repository evidence.
- Backend API behavior, persistence, or canonical contract decisions.

## Authority order

1. Accepted project specifications and decisions (if present).
2. BDD scenarios (if present).
3. Machine-readable contracts consumed from backend OpenAPI evidence.
4. Tests and CI workflows.
5. Architecture and conventions in repository docs.
6. Existing implementation.
7. External references only when explicitly approved.

## Work modes

- Feature implementation: Behavior changes are allowed with SDD flow and verification gates.
- Bug fix: Add reproduction test first, then fix minimum scope.
- Code-only refactor: Behavior must not change; do not update contracts/spec state.
- Breaking cleanup: Document canonical behavior, migrate callers, then remove compatibility.
- Documentation-only: No code behavior changes.
- Test-only: No product behavior changes.
- Harness maintenance: Edit harness files only.

## Startup flow

1. Classify work mode.
2. Read .ai-harness.yaml.
3. Read this file and .github/copilot-instructions.md.
4. Read only relevant specs/docs/tests/contracts/implementation.
5. Inspect git status and limit scope.
6. Write a concise plan before editing.

## Hard rules

- Do not invent requirements, paths, contracts, or commands.
- Do not manually edit generated files.
- Do not weaken authorization, validation, or tests to force a pass.
- Do not modify unrelated files.
- Do not run watch-mode verification commands.
- Do not claim completion when required checks fail or are not runnable.
- Report assumptions, blockers, risks, and missing evidence.

## Generated code policy

Immutable generated paths:
- src/api/generated/**

To change generated outputs:
1. Update backend OpenAPI source annotations/spec inputs.
2. Regenerate contract/client through repository-approved commands.
3. Update consumers and tests.

## Delivery flow

spec -> BDD -> contract when applicable -> test cases -> failing tests -> minimal implementation -> targeted verification -> review -> full verification -> handoff/progress update

## Completion semantics

Work is complete only when:
- Applicable checkpoints in CHECKPOINTS.md are satisfied.
- Verification status is reported with explicit pass/fail/not-run.
- Final verdict is one of: APPROVED, CHANGES_REQUESTED, BLOCKED.

For owner/consumer changes:
- Backend owner updates contract first.
- This repository uses generated artifacts and must not invent contract behavior.
