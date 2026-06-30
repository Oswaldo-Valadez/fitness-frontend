# Prompt: Refactor Code Only

## Objective
Refactor implementation structure without changing observable behavior.

## Work mode
Code-only refactor.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- Existing tests that protect current behavior

## Allowed scope
- Existing implementation and tests for selected area.

## Do not modify
- Specs, contract artifacts, progress state, or generated files.
- Any behavior expectations unless explicitly re-scoped.

## Phases
1. Confirm no behavior change intent.
2. Make minimal structural refactor.
3. Run targeted checks.
4. Run full checks before completion.

## Verification
Use manifest profiles and document all outcomes.

## Stop conditions
- Refactor requires behavior change.
- Existing failing tests are unrelated and cannot be isolated.

## Final report format
- Refactor scope
- Behavior-preservation evidence
- Verification outcomes
