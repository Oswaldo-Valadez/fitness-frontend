# CHECKPOINTS

## C0 - Work mode
- [ ] Mode is classified and correct rules are applied.

## C1 - Harness readiness
- [ ] AGENTS.md, .ai-harness.yaml, Copilot instructions, prompts, and verification docs exist.
- [ ] Commands match repository scripts/config evidence.
- [ ] Search exclusions and generated paths are configured.

## C2 - Source artifacts
- [ ] Scope is explicit.
- [ ] Spec and BDD exist for behavior changes.
- [ ] Contract evidence exists when external interface changes.
- [ ] Test cases trace to acceptance criteria.

## C3 - Implementation
- [ ] Minimal necessary files changed.
- [ ] Architecture and security boundaries are respected.
- [ ] Generated files were not hand-edited.

## C4 - Tests
- [ ] New behavior or bug reproduction is covered.
- [ ] Failure paths are covered where applicable.
- [ ] Expectations were not weakened without approved behavior change.

## C5 - Verification
- [ ] Targeted checks passed.
- [ ] Full required profile passed, or blockers are explicit.
- [ ] Commands were terminating and run from correct directory.

## C6 - Review and traceability
- [ ] Diff contains no unrelated changes.
- [ ] Spec -> BDD -> contract -> tests -> implementation mapping is documented.
- [ ] Final verdict is APPROVED, CHANGES_REQUESTED, or BLOCKED.
