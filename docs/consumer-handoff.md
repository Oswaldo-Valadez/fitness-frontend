# Consumer Handoff

Use this checklist when backend contract changes are delivered to this repository.

## Owner delivery package
- Feature identifier and acceptance criteria reference.
- Changed contract source files in backend owner repository.
- Updated contract output path confirmation (storage/api-docs/api-docs.json).
- Verification evidence from owner checks.

## Consumer intake
- Confirm contract output is available and current.
- Regenerate client using repository-approved command when defined.
- Update frontend usage/tests in minimal scope.
- Run targeted and full verification profiles from manifest.

## Blocker policy
If generation command or contract artifact access is missing, mark BLOCKED and request explicit repository guidance.

## Sprint 3 handoff (2026-07-05)

- Recibido de backend: `openapi/api-docs.json` con el módulo diet-quality.
- Regenerado cliente Orval y creado el adapter `src/api/dietQuality.ts`.
- Reglas del consumidor: no recalcular el score, no inventar
  thresholds/estados, no crear metas fuera del catálogo del backend, mostrar
  siempre el disclaimer, el aviso de alcohol y las limitaciones entregadas
  por la API.

## Sprint 4 handoff (2026-07-12)

- Recibido de backend: `openapi/api-docs.json` con el módulo de
  micronutrientes (catálogo de 16 nutrientes, referencias DRI, ingesta
  diaria/por periodo, detalle por nutriente). Regenerado cliente Orval y
  creado el adapter `src/api/nutrients.ts`.
- Ya en vivo para consumidores: tarjeta de cobertura en el dashboard
  (`MicronutrientsCard`), tercer tab "Nutrientes" en Reportes
  (`/reports/nutrients` y `/reports/nutrients/:code`), y visualización de
  micronutrientes en detalle de alimento, formulario de alimento propio y
  detalle/editor de receta — siempre con estado de calidad y fuente, nunca
  sustituyendo valores faltantes por 0.
- Gap de alcance conocido, documentado (no es un bug): los endpoints admin
  de creación/edición de alimentos no fueron extendidos por el backend con
  `nutrients`/`nutrition_basis` en este sprint, así que el formulario admin
  de alimentos todavía no tiene UI de micronutrientes.
