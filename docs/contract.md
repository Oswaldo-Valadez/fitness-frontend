# Contract Ownership

## Owner
- External backend repository
- Contract source and canonical output are backend-owned.

## Consumer
- Repository: this repository
- Generated client evidence: src/api/generated/index.ts, src/api/generated/{tag}/**, and src/api/generated/model/**
- Generation configuration evidence: orval.config.ts

## Rules
- Owner controls contract behavior and schema decisions.
- This repository must not invent endpoints or payload models.
- Generated outputs are immutable by hand.
- If owner contract changes, this repository must update through generation flow and adaptation.

## Sprint 3

- Spec sincronizado desde backend con los paths `/diet-quality/*` y schemas
  `DietQuality*`, `Medas14Answers` e `InstrumentVersionOutdatedError`;
  cliente regenerado (`npm run gen`, carpeta
  `src/api/generated/diet-quality/`).
- El 409 `INSTRUMENT_VERSION_OUTDATED` forma parte del contrato del POST de
  evaluaciones: el consumidor recarga el instrumento y pide revisión antes de
  reenviar.
- Export de cuenta: `export_version` ahora es `3.0.0` con secciones
  `diet_quality_assessments`, `diet_quality_goals`, `diet_quality_check_ins`.
