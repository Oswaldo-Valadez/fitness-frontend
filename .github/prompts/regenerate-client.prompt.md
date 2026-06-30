# Prompt: Regenerate Client

## Objective
Regenerate consumer API client from owner contract outputs without hand-editing generated files.

## Work mode
Harness maintenance or feature implementation support.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- orval.config.ts
- Backend contract output path in manifest

## Allowed scope
- Generated client outputs and minimal consumer adaptation files.

## Do not modify
- Backend repository files directly.
- Generated files by manual edits.

## Phases
1. Validate contract artifact availability.
2. Run repository-approved generation command if available.
3. Update consumer usage/tests as needed.
4. Run targeted verification.

## Stop conditions
- No repository-evidenced generation command.
- Contract artifact endpoint/path unreachable.

## Final report format
- Generation command used
- Files changed
- Verification results
- Blockers if command is unavailable
