# AI Harness Guide

## Scope
This document defines how AI agents must operate in this repository.

## Repository topology
- This repository consumes backend contract outputs.
- Canonical backend contract ownership is external to this repository.

## Primary authorities
1. .ai-harness.yaml
2. AGENTS.md
3. CHECKPOINTS.md
4. .github/copilot-instructions.md

## Generated boundaries
- Immutable (local): src/api/generated/**
- External backend contract output reference: fitness-backend/storage/api-docs/**

## Work mode summary
- Feature implementation
- Bug fix
- Code-only refactor
- Breaking cleanup
- Documentation-only
- Test-only
- Harness maintenance

## Owner/consumer flow
1. Owner updates backend contract source artifacts.
2. Owner validates behavior and contract outputs.
3. Handoff is documented by owner repository.
4. This repository regenerates/consumes client and validates frontend behavior.

## Search hygiene
Default exclusions are defined in .ai-harness.yaml and must be used for repository scans.

## Missing evidence policy
If command/path/contract details are missing, report BLOCKED or UNKNOWN. Never guess.
