# Prompt: Create Feature Spec

## Objective
Create project-specific SDD artifacts for one feature slice without implementing product code.

## Work mode
Feature implementation planning.

## Required inputs
- Feature name and objective.
- Whether backend-owner handoff is required.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- CHECKPOINTS.md
- Existing files under specs/** and progress/**
- Contract evidence when API behavior is involved

## Allowed scope
- specs/**
- progress/**

## Do not modify
- Product source and tests outside this repository.
- Generated paths in .ai-harness.yaml

## Phases
1. Classify mode and owner/consumer scope.
2. Draft spec, BDD, test-cases, and AI prompts using template naming.
3. Add contract artifact file only when interface change is in scope.
4. Update progress/current.md with status and blockers.

## Tests-first requirement
For behavior changes, define failing test cases in the spec artifacts before implementation starts.

## Verification
- Targeted: validate markdown structure and file naming consistency.
- Full: ensure traceability links across spec -> BDD -> test-cases.

## Stop conditions
- Missing acceptance criteria from requester.
- Missing owner/consumer boundary for contract-touching work.

## Final report format
- Created/updated files
- Scope classification
- Open questions
- Blockers
