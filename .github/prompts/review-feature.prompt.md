# Prompt: Review Feature

## Objective
Perform independent review and produce a verdict.

## Work mode
Review.

## Files to read first
- .ai-harness.yaml
- AGENTS.md
- Relevant specs/contracts/tests
- Proposed diff

## Allowed scope
- Review comments and review reports only.

## Do not modify
- Implementation code during review.

## Phases
1. Validate scope and traceability.
2. Check behavior, security, contract alignment, and tests.
3. Classify findings by severity.
4. Return approved/change-requested/blocked verdict.

## Verification
- Confirm command results from verifier output.
- If missing evidence exists, label as BLOCKED or CHANGES_REQUESTED.

## Stop conditions
- Diff or verification evidence unavailable.

## Final report format
- Verdict
- Findings by severity
- Assumptions
- Missing evidence
- Required fixes
