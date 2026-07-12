# Current Progress

## Sprint 4 — Micronutrientes y referencias DRI — COMPLETED 2026-07-12

Cliente consumidor del catálogo de 16 nutrientes y referencias DRI del
backend. Detalle completo en `progress/sprint-4-micronutrients.md`.

- Adapter `src/api/nutrients.ts` (generated-client-only), tercer tab
  "Nutrientes" en Reportes, dashboard card, secciones de proveniencia en
  detalle de alimento, formularios de alimento/receta con micronutrientes
  opcionales (blank≠0), sin UL ni copy clínico en ningún componente.
- `e2e/nutrients.spec.ts` nuevo (flujo usuario 25 pasos + flujo admin 9
  pasos), sin llamadas reales a FDC, pasa de forma reproducible.
- Bug real encontrado y corregido: `src/components/ui/Modal.tsx` no tenía
  contenedor de scroll interno — un formulario alto (los 10 campos nuevos)
  podía dejar el botón de envío fuera del viewport sin forma de alcanzarlo.
- 3 bugs de E2E preexistentes corregidos al validar la suite completa
  (versión de export desactualizada en diet-quality.spec.ts, colisión de
  locator en recipes-diary.spec.ts por una nueva caption sr-only de 4G,
  premisa de "DB vacía" desactualizada en admin.spec.ts desde 4E).
- Suites verdes: lint, typecheck, 98/98 tests, build, gen, contract:check,
  test:e2e (28/32 — 4 fallas preexistentes por throttle de login, no
  relacionadas a este sprint, documentadas en docs/verification.md).
- Riesgo conocido documentado (no corregido, decisión de alcance): el
  formulario admin de alimentos no acepta micronutrientes porque el backend
  no extendió ese endpoint en Sprint 4.

## Fase 10 (frontend integration plan) — COMPLETED 2026-07-10

Contract-first closure across `fitness-backend` (owner) and `fitness-frontend`
(consumer), run as three separate sessions per the plan's own rule. Full
details in `progress/frontend-integration.md` (Fase 10A/10B/10C sections)
and `fitness-backend/progress/backend-hardening.md`.

- **10A — backend contract precision**: `required[]` added to every core
  response schema (and several inline ones found while starting 10B/10C);
  fixed `decimal:N` casts serializing as strings across
  `UserProfile`/`NutritionTarget`/`MealLogItem`/`MealTemplateItem`/`Food`/
  `FoodPortion`/`Recipe`/`RecipeIngredient`; found and fixed a real bug
  (`GET /profile/targets` returning Laravel's native paginator while
  documenting `{data, meta}`).
- **10B — frontend type/adapter consolidation**: migrated
  `auth`/`profile`/`account`/`admin` adapters to the generated Orval client;
  removed every `as unknown as LaravelPage<...>` cast and the one `api: any`;
  retired `src/types/models.ts` entirely; fixed `nutrientAmount()` coercing
  unknown macros to `0` for energy/protein/carbs/fat (only fiber/sodium were
  null-safe before) across 7 pages.
- **10C — full-stack acceptance**: 4 new Playwright specs
  (`auth-consent`, `foods-portions`, `recipes-diary`, `templates-reports`)
  plus an expanded `admin.spec.ts` — 27 E2E tests total, all green against a
  locally seeded backend. Found and fixed 3 more real bugs live: the weight
  modal never closed on a failed submit (trapped the user behind the
  backdrop when a 409 CONSENT_REQUIRED fired); `StoreCustomFoodRequest`
  rejected a private food with every macro left blank (`nutrients: []`
  failed Laravel's `required` array check, contradicting the app's own
  "unknown ≠ zero" policy); admin CSV import crashed with a 500 on every
  fresh environment (Laravel 13 moved the `local` disk root to
  `storage/app/private`, but the controller read the file back from
  `storage/app/` directly — added a regression test since no test covered
  CSV import at all before this).
- Contract source: `openapi/api-docs.json` is a **vendored copy** of
  `fitness-backend/storage/api-docs/api-docs.json` (not read via relative
  path) — `fitness-backend` is a private repo, so `npm run gen`/
  `contract:check` must work without cross-repo access. Sync manually when
  the backend contract changes (see README.md).
- Suites green: lint, typecheck, 53 Vitest tests, build, 27 Playwright E2E
  tests (7 spec files). No open blockers.

## Sprint 3 — COMPLETED 2026-07-05

- Módulo de calidad de dieta integrado: tabs en Reportes (`/reports/quality`),
  wizard MEDAS-14 de 14 pasos (respuestas solo en memoria, manejo de 409 por
  versión), detalle histórico, metas opcionales con check-ins y dashboard
  card.
- Cliente Orval regenerado desde el spec Sprint 3; adapter
  `src/api/dietQuality.ts`; sin score en cliente, sin schemas duplicados.
- Suites verdes: lint, typecheck, 53 tests Vitest, build, 7 specs E2E
  (incluye `e2e/diet-quality.spec.ts` con ciclo de consentimiento).
- Sin blockers abiertos.

## Sprint 1 — COMPLETED 2026-06-30

## Status
- React SPA built and functional ✅
- TypeScript: 0 errors ✅
- Orval client generated: `src/api/generated/` (55 files) ✅
- Vite build: passes ✅
- Vitest suite added and passing (9 tests) ✅

## Implemented
- Auth pages: login, register, forgot-password, reset-password
- Onboarding wizard: consents step + profile step
- Dashboard: date navigation, calorie summary, macro bars, meal groups
- Foods: search + category filter, pagination, food detail
- Diary: food search autocomplete, add to meal, items list
- Profile: view + edit mode, target history
- Account: data export (blob), delete account
- Admin: food CRUD, CSV import preview + commit
- Redux auth state, route guards (RequireAuth, RequireGuest, RequireAdmin)
- Axios client with CSRF retry interceptor

## Generate typed client
```
npm run gen
```
(reads from the vendored `openapi/api-docs.json` — see Fase 10 note above)

## Open blockers
- None

## Pending (Sprint 2)
- None
