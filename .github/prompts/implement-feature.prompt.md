# Prompt: Implement Feature

## Objective
Implement one approved feature slice with minimal scope and explicit verification.

## Work mode
Feature implementation.

## Required inputs
- Feature folder under specs/<feature>/
- Approved acceptance criteria and BDD scenarios

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- specs/<feature>/<feature>.spec.md
- specs/<feature>/<feature>.bdd.md
- specs/<feature>/<feature>.test-cases.md
- Contract artifact when applicable

## Allowed scope
- Files directly required by the selected feature slice.
- Corresponding tests.
- Spec/progress status updates.

## Do not modify
- Unrelated repositories or modules.
- Generated files in immutable generated paths.

## Phases
1. Confirm work mode and scope.
2. Add tests first or alongside implementation.
3. Implement minimum required changes.
4. Run targeted verification from manifest.
5. Request final review and run full profile before completion.

## Tests-first requirement
Behavior change requires tests before or alongside code changes.

## Verification
- Targeted: commands in .ai-harness.yaml verification_profiles.targeted
- Full: commands in .ai-harness.yaml verification_profiles.full

## Stop conditions
- Missing/contradictory spec requirements.
- Required command unavailable or non-terminating.
- Contract update required but owner artifact not available.

## Final report format
- Changed files and why
- Tests added/updated
- Command results
- Assumptions/blockers/risks
