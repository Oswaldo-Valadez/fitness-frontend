# Contract Ownership

## Owner
- External backend repository
- Contract source and canonical output are backend-owned.

## Consumer
- Repository: this repository
- Generated client evidence: src/api/generated/fitness-api.ts and src/api/generated/model/**
- Generation configuration evidence: orval.config.ts

## Rules
- Owner controls contract behavior and schema decisions.
- This repository must not invent endpoints or payload models.
- Generated outputs are immutable by hand.
- If owner contract changes, this repository must update through generation flow and adaptation.
