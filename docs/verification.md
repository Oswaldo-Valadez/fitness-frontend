# Verification

## Evidence sources
- package.json (frontend lint/typecheck/test/build/generation/e2e scripts)
- .github/workflows/ci.yml (static, unit, build jobs; e2e job intentionally
  omitted, see comment in that file)
- .ai-harness.yaml

## Command profiles

### Targeted
1. npm run lint
2. npm run typecheck
3. npm run test

### Full
1. npm ci
2. npm run gen
3. npm run contract:check
4. npm run lint
5. npm run typecheck
6. npm run test
7. npm run build

### E2E (not in CI — see evidence_gaps in .ai-harness.yaml)
1. Seed and serve fitness-backend locally (`php artisan migrate:fresh --seed`,
   `php artisan serve`).
2. `npm run dev` (frontend).
3. `npm run test:e2e`, or `BASE_URL=<url> npx playwright test` against a
   different host.

## Known blockers and unknowns
- Contract source is owned by fitness-backend, but vendored into this repo
  at `openapi/api-docs.json` (not read via relative path) because
  fitness-backend is a private, separate repo — CI here cannot check it
  out. Whoever changes the backend contract copies the updated
  `storage/api-docs/api-docs.json` into `openapi/api-docs.json` here before
  running `npm run gen`.
- Contract *validation* (`npm run contract:check`) runs locally in this
  repo against that vendored copy — it is no longer purely a backend-owner
  responsibility from a tooling standpoint, though the backend still owns
  the contract's content.

## Command rules
- Use terminating, non-watch commands only.
- Run commands from the correct repository directory.
- Do not substitute missing commands with guessed alternatives.

## Sprint 3

- Component tests (`npm run test`): `DietQualityPage.test.tsx`,
  `DietQualityAssessmentPage.test.tsx`, `DietQualityCard.test.tsx`, con
  handlers MSW en `src/test/handlers/dietQuality.ts`.
- E2E (`npm run test:e2e`, backend servido y seedeado con
  `php artisan migrate:fresh --seed`): `e2e/diet-quality.spec.ts` cubre el
  flujo completo — evaluación de 14 pasos → score → meta de leguminosas →
  check-in → pausa/reactivación → dashboard card → export 3.0.0 →
  revocación de consentimiento (mutaciones 409, lecturas OK) →
  re-aceptación.

## Sprint 4

- Component tests (`npm run test`): `NutrientReportPage.test.tsx`,
  `NutrientDetailPage.test.tsx`, `MicronutrientsCard.test.tsx`,
  `FoodDetailPage.test.tsx`, `MyFoodFormModal.test.tsx`,
  `RecipeEditorPage.test.tsx`, `RecipeDetailPage.test.tsx`, using MSW
  handlers in `src/test/handlers/nutrients.ts`.
- E2E (`npm run test:e2e`, backend servido y seedeado): `e2e/nutrients.spec.ts`
  cubre flujo de usuario (detalle de alimento completo/parcial, alta de
  alimento propio con calcio+hierro=0 y vitamina D en blanco, receta mixta
  con estado parcial, diario, dashboard card, reportes de 30 días, detalle
  de nutriente con gráfica/tabla, referencia por rango con perfil sin
  divulgar, export 4.0.0, revocación/reaceptación de consentimiento) y
  flujo admin (mapeos FDC de sistema bloqueados, 422 en intento de mapeo
  incompatible, sin exposición de API key). Nunca llama a FDC real; requiere
  el `DemoFoodSeeder` extendido del backend.
- Riesgo conocido (no es una tarea de código pendiente): `e2e/nutrients.spec.ts`
  agrega 2 logins más a una suite Playwright serial ya larga, contra un
  throttle de login del backend de 10 req/min. Esto puede causar timeouts
  en specs no relacionados que corren más tarde en la misma ejecución —
  mismo tipo de riesgo de flakiness ya señalado para Sprint 3.
