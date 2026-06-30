# Prompt: Update Contract and Handoff

## Objective
Execute consumer-side intake after owner contract update handoff.

## Work mode
Feature implementation (consumer side after owner handoff).

## Required inputs
- Owner handoff package and updated contract location.
- Consumer-side acceptance criteria.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- orval.config.ts
- docs/consumer-handoff.md

## Allowed scope
- Consumer integration files in this repository.
- Handoff tracking documentation under docs/.
- Specs/progress updates.

## Do not modify
- Backend owner repository files.
- Generated client files manually.

## Phases
1. Validate owner handoff inputs.
2. Run repository-approved client generation command if available.
3. Update consumer implementation/tests as needed.
4. Record consumer status in progress file.

## Verification
Use targeted and full manifest commands that are available.

## Stop conditions
- Client generation command unavailable.
- Owner handoff artifacts incomplete.

## Final report format
- Consumer files changed
- Handoff inputs consumed
- Verification outcomes
- Blockers and next actions
