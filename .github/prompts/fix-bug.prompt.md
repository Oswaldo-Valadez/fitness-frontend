# Prompt: Fix Bug

## Objective
Fix a confirmed bug with a reproduction-first workflow.

## Work mode
Bug fix.

## Required inputs
- Bug description and expected behavior.
- Scope repository and affected area.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- Relevant tests and implementation files
- Contract evidence when API output is affected

## Allowed scope
- Minimal files needed for reproduction, fix, and verification.

## Do not modify
- Generated files.
- Unrelated feature code.

## Phases
1. Reproduce with a failing test first.
2. Implement smallest fix.
3. Run targeted verification.
4. Run full verification before completion.

## Verification
Use manifest targeted/full profiles.

## Stop conditions
- Reproduction cannot be established from available evidence.
- Required environment/tooling not available.

## Final report format
- Reproduction test
- Root cause summary
- Files changed
- Verification outcomes
- Residual risks
