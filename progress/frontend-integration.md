# Frontend integration (PLAN_INTEGRACION_FRONTEND_FITNESS_CODEX.md)

## Sprint 3 — Diet quality (2026-07-05)

Integrado el módulo de calidad de dieta: tabs en Reportes, wizard MEDAS-14,
detalle histórico, metas/check-ins, dashboard card, adapter
`src/api/dietQuality.ts` + cliente Orval regenerado, handlers MSW nuevos,
16 tests nuevos (53 totales) y E2E dedicado. Sin React Query, sin duplicación
de schemas backend, sin score autoritativo en cliente.

Current phase: 1 — Foundation del cliente frontend
Status: done
Backend contract SHA: fitness-backend Fase 0 commit (OpenAPI 60 paths / 80 ops, all core 2xx typed)
Generated client status: regenerated via `npm run gen`; new tags recipes, my-foods,
meal-templates, progress (weight), reports; all functions now route through the
shared Axios instance via an Orval `customInstance` mutator (src/api/mutator.ts).
Decisions:
- Orval `override.mutator` -> src/api/mutator.ts wraps src/api/client.ts's `api`
  instance. Generated functions return plain typed data (Promise<T>), not
  AxiosResponse<T>.
- New src/api/errors.ts normalizes any thrown error into a discriminated
  ApiError (unauthenticated/consent_required/validation/rate_limited/
  not_found/forbidden/network/unknown).
- New src/api/apiEvents.ts (EventTarget-based bus) with 'session-expired' and
  'consent-required' events, emitted from the client.ts response interceptor
  on 401 and 409+CONSENT_REQUIRED respectively. App-level wiring (redirect,
  banner) is Fase 2 scope, not done here.
- Existing hand-written adapters (auth.ts, profile.ts, dashboard.ts, foods.ts,
  meals.ts, account.ts, admin.ts) were left as-is on purpose — they don't use
  Orval today. Migrating them to generated types is Fase 2+ scope, one module
  at a time.
- Added devDependency axios-mock-adapter to unit-test the interceptor without
  hitting the network (no MSW yet — that's Fase 8).
Changed:
- orval.config.ts, src/api/mutator.ts (new), src/api/client.ts, src/api/errors.ts
  (new), src/api/apiEvents.ts (new), src/api/client.test.ts (new),
  src/api/errors.test.ts (new), src/api/generated/** (regenerated),
  package.json (added contract:check script, axios-mock-adapter),
  src/components/ui/Switch.tsx (pre-existing lint error fixed, unrelated).
Passed:
- npm run typecheck, npm run lint, npm run test (24 tests), npm run build.
- npm run gen (regenerates cleanly against ../fitness-backend/storage/api-docs/api-docs.json).
Remaining:
- npm run contract:check will fail until this generated diff is committed
  (expected — same convention as the backend's composer contract:check).

## Fase 2 — Auth, onboarding y consentimientos
Status: done
Decisions:
- **Bug real encontrado y corregido**: `onboardingApi.acceptConsents` enviaba
  `{ consents: [{type, document_version}] }`; el backend valida 3 booleans
  top-level (`terms`, `privacy`, `general_wellness_disclaimer`) y calcula las
  versiones él mismo. El onboarding de consentimientos estaba roto contra el
  contrato real antes de este fix.
- `saveProfile`/`profileApi.update` ahora tipan `active_target` (no `target`,
  que el backend nunca envió), alineado con el contrato canónico de Fase 0.
- `User` (types/models.ts) ahora incluye `is_admin`, `has_profile` y
  `has_active_consents` como campos requeridos (no opcionales) — reflejan
  garantías reales de `/user`. Casts inseguros de `is_admin` eliminados de
  `guards.tsx` y `AppLayout.tsx`.
- `RequireAuth` ya no usa solo `onboarding_completed_at`: también exige
  `has_profile`. `has_active_consents` NO redirige a onboarding (bloquearía
  lecturas) — se maneja de forma reactiva.
- Nuevo flujo reactivo de consentimiento revocado: interceptor (Fase 1) emite
  `consent-required` -> `AppInit` guarda el detalle en Redux
  (`auth.consentRequired`) -> `ConsentBanner` (en `AppLayout`) muestra aviso
  persistente con link a `/onboarding` sin bloquear lecturas ni otras rutas.
- `OnboardingPage` detecta modo "reaccept" (`user.has_profile === true`): tras
  aceptar consentimientos salta el paso de perfil, refresca `/user`, limpia
  `consentRequired` y regresa a `returnPath` (o `/dashboard`).
- `accountApi.getConsents()` eliminado (no hay endpoint que liste consentimientos;
  `/user` solo expone el booleano agregado `has_active_consents`).
Changed:
- src/types/models.ts, src/api/auth.ts, src/api/profile.ts, src/api/account.ts,
  src/store/authSlice.ts (+consentRequired state), src/AppInit.tsx,
  src/router/guards.tsx, src/layouts/AppLayout.tsx, src/layouts/ConsentBanner.tsx
  (new), src/pages/onboarding/OnboardingPage.tsx, src/pages/onboarding/ConsentsStep.tsx,
  src/router/guards.test.tsx, src/store/authSlice.test.ts.
Passed: npm run typecheck, npm run lint, npm run test (27 tests), npm run build.
Remaining: no reaccept UI test with real navigation yet (unit-level only);
E2E smoke for consent revoke/reaccept is Fase 8 scope per the plan.

## Fase 3 — Dashboard, nutrient status y peso real
Status: done
Decisions:
- **Backend bugs found and fixed while building this** (see fitness-backend
  progress/backend-hardening.md "Fase 3 follow-up"): `/dashboard` OpenAPI was
  missing `nutrient_status`; `MealLog::total*()` treated unknown nutrients as
  0 instead of null; `MealLogItem`'s per-item accessors and `BodyWeightLog`'s
  `weight_kg` serialized as JSON strings (decimal casts) contradicting the
  `number` contract — all fixed at the backend, contract regenerated.
- New src/lib/nutrientStatus.ts + src/components/nutrition/{NutrientValue,
  NutrientStatusLegend}.tsx: single place that turns (value, status) into
  "125 g" / "125 g*" (partial, with tooltip) / "Sin dato" (unknown). Never
  `Number(null) → 0`.
- `dashboardApi` migrated to the generated client (`DashboardSummary` type).
  `DashboardPage`/`MacroBar`/`MealGroup` all use `NutrientValue` now.
- `MealGroup` widened to a generic `MealGroupItem`/`MealGroupMeal` shape so
  it works with both `/dashboard`'s `DashboardMealItem` (no food_id at all)
  and `/meals`'s `MealLogItem` (food_id nullable) without duplicating the
  component.
- Undo fixed per plan decision: dashboard's delete-item never offers undo
  (no food_id/recipe_id in that payload — restoring would guess wrong).
  Diary's delete-item offers undo only when `food_id` is a real number.
- `weight.ts` rewritten against `/progress/weight` (GET/POST/PUT/DELETE) via
  the generated client; local random-seed mock deleted. `WeightTrendCard`
  renders the backend's real trend (`daily_points`, `moving_average_7d`,
  `change`) and supports logging + deleting the latest entry.
- `has_demo_foods` now shown as a small notice on the dashboard.
- Streak badge left as-is (still a localStorage mock) — its removal is
  explicitly Fase 4 scope per the plan ("remove production streak").
Changed (frontend): src/lib/nutrientStatus.ts (new), src/components/nutrition/*
(new), src/api/dashboard.ts, src/api/weight.ts, src/pages/dashboard/{DashboardPage,
MacroBar,MealGroup}.tsx, src/pages/diary/DiaryPage.tsx (undo fix only),
src/pages/profile/ProfilePage.tsx (weight source), src/components/weight/WeightTrendCard.tsx,
src/types/models.ts (MealLogItem nullability + NutrientStatusMap).
Changed (backend, contract owner side-quest): see backend progress doc.
Passed: npm run typecheck, npm run lint, npm run test (27 tests), npm run build;
backend: php artisan test (182 tests), pint.
Remaining: not yet smoke-tested against a live running app (static
verification only so far) — planned before final Fase 9 gate.

## Fase 4 — Diario, favoritos, recientes y porciones
Status: done
Decisions:
- **Real bugs found and fixed in the backend while building this** (see
  fitness-backend progress doc "Fase 4 follow-up" x2): `is_favorite` was only
  computed by unified search (not catalog list/detail/recent-items, even
  though there's no separate favorites-list endpoint to fall back on);
  `Food`/`MealLogItem` schemas were missing `portions`/`is_favorite`/
  `food_id`/`recipe_id`/`source_kind`; the legacy classic add-item endpoint
  left `source_kind` as `NULL` instead of `'food'`.
- `foods.ts` migrated to the generated client; added `favorite`/`unfavorite`/
  `createPortion`/`updatePortion`/`deletePortion`. New `unifiedSearchApi` and
  `recentItemsApi` (both real, both replace the old localStorage fakes).
- `meals.ts` migrated to the generated client; added `addItemFromFood`
  (grams or portion_id) and `addItemFromRecipe` (grams or servings). Kept
  the classic `addItem` only for the dashboard's safe undo path.
- `src/lib/nutrients.ts` decoupled from any single `Food` type — it now takes
  a minimal structural `{ nutrients }` shape so both the generated `Food`
  and the legacy admin `Food` (types/models.ts, untouched — Fase 7 scope)
  can share it without a type war.
- Diary now supports: food by grams, food by portion (fetches full detail
  for portions since search/recent responses don't embed them), recipe by
  grams/servings (plumbing only — no recipe exists yet until Fase 5 builds
  recipe CRUD), grouped unified search (foods/my_foods/recipes), real
  favorite toggle, real recent items. `FoodDetailPage` got a portion picker
  and passes portion_id/quantity through to the diary via query params.
- Deleted `src/api/foodPreferences.ts` and `src/api/streaks.ts` (dead code,
  no remaining consumers) — streak badge removed from the dashboard per
  this phase's explicit "remove production streak" instruction.
- `types/models.ts` `MealLog`/`MealLogItem`/`NutrientStatusMap` removed
  (superseded by generated types); `Food`/`FoodNutrient` kept there only
  for the admin pages (Fase 7 scope, not touched).
Changed (frontend): src/api/foods.ts, src/api/meals.ts, src/lib/nutrients.ts,
src/pages/foods/{FoodsPage,FoodDetailPage}.tsx, src/pages/diary/DiaryPage.tsx,
src/pages/dashboard/DashboardPage.tsx (streak removal), src/types/models.ts.
Changed (backend, contract owner side-quest): see backend progress doc
"Fase 4 follow-up" and "follow-up #2".
Passed: npm run typecheck, npm run lint, npm run test (27 tests), npm run build;
backend: php artisan test (183 tests, 555 assertions), pint.
Remaining: recipe-in-diary path is untestable end-to-end until Fase 5 ships
recipe CRUD; still no live-server smoke test (static verification only).

## Fase 5 — Biblioteca: alimentos privados y recetas
Status: done
Decisions:
- New `/library` shell (Tabs: Alimentos/Mis alimentos/Recetas) at
  src/pages/library/LibraryPage.tsx; `/foods` now redirects there. Bottom
  nav/sidebar "Alimentos" renamed to "Biblioteca" (navConfig.ts).
- New adapters src/api/myFoods.ts, src/api/recipes.ts (generated-client only).
- My Foods: list/create/edit/delete(-or-deactivate) via MyFoodFormModal —
  nutrient fields are empty-string-means-unknown (never defaults to 0),
  per_100g vs per_serving label input mode.
- Recipes: list (active/archived), create/edit via RecipeEditorPage with a
  live-debounced preview (calls `POST /recipes/preview`), detail page with
  favorite/archive/delete/edit/"add to diary", ingredient search reusing
  the catalog search endpoint.
- **Live-browser smoke test performed** (Playwright script, not committed —
  scratch-only): started the real Laravel dev server (temp SQLite copy,
  seeded) + Vite dev server, logged in as the seeded demo user, and drove
  Library/My Foods/Recipes/Diary end-to-end. Found and fixed 3 more real
  bugs this static analysis alone would not have caught:
  1. **Login/register response missing `has_profile`** (see backend
     progress "Fase 5 follow-up") — a fully onboarded demo user was bounced
     back to `/onboarding` right after login.
  2. **`GET /health` route was never registered** despite full OpenAPI docs
     (attribute was on the class, not `__invoke`) — fixed backend-side.
  3. **`DiaryPage` never read `recipe_id` from the URL** — `RecipeDetailPage`'s
     "Agregar al diario" button navigated to `/diary?recipe_id=...` but
     nothing consumed that param, so the recipe silently failed to
     preselect. Added the same preselection pattern already used for
     `food_id`/`portion_id`.
  After all three fixes: login → dashboard (no bogus onboarding redirect),
  Biblioteca tabs render real seeded data (a demo recipe, a demo private
  food with an "Datos desconocidos" badge confirming the unknown-nutrient
  UI), recipe editor's live preview works against real ingredients, and
  "Agregar al diario" from a recipe correctly preselects it with a working
  add-to-meal flow.
- Noted, not fixed: `Recipe.yield_weight_g`/`default_servings` (and likely
  other recipe/ingredient decimal fields) serialize as JSON strings, same
  systemic decimal-cast pattern noted in Fase 3/4 — didn't block this
  phase's functionality (JS coerces on arithmetic) but is cosmetically
  imprecise (e.g. "450.00" instead of "450"). Candidate for the same
  dedicated pass mentioned in earlier follow-ups.
Changed (frontend): src/pages/library/** (new), src/pages/recipes/** (new),
src/api/myFoods.ts, src/api/recipes.ts (new), src/router/index.tsx,
src/layouts/navConfig.ts, src/pages/diary/DiaryPage.tsx (recipe_id preselect).
Changed (backend, contract owner side-quest): see backend progress doc
"Fase 5 follow-up".
Passed: npm run typecheck, npm run lint, npm run test (27 tests), npm run
build; backend: php artisan test (185 tests, 575 assertions), pint; live
smoke test via Playwright (not part of the committed test suite).
Remaining: no automated E2E test captures this smoke-test flow yet — that's
Fase 8 (Playwright) scope. Templates tab intentionally not added to
Library yet (Fase 6 builds it).

## Fase 6 — Templates, meal copy y reports
Status: done
Decisions:
- New adapters: src/api/templates.ts (+`newIdempotencyKey()` helper shared
  by copy/apply), src/api/reports.ts.
- Library gets a 4th tab "Plantillas" (src/pages/library/TemplatesPage.tsx +
  TemplateFormModal + ApplyTemplateModal): list, create (manual, searching
  foods/recipes via unified search), apply (date/time/meal_type +
  idempotency key, shows warnings for missing sources), favorite via the
  generic update endpoint (no dedicated favorite/unfavorite pair exists for
  templates, unlike foods/recipes), delete.
- Diary meal cards (`MealGroup`) get two new optional actions, wired only
  from the diary (dashboard doesn't pass them): "save as template"
  (src/pages/diary/DiaryPage.tsx, prompts for an optional name) and "copy to
  another date" (new src/pages/diary/CopyMealModal.tsx). Both use the
  idempotency-key helper and surface backend warnings/differences via toast
  — copy never pretends the copy is nutritionally identical.
- New src/pages/reports/ReportsPage.tsx: period chips (7/14/30/90/custom),
  include-weight toggle, summary stat tiles, a Recharts line (consumed vs.
  target, `connectNulls={false}` for consumed so gaps show as honest gaps),
  a daily table using `NutrientValue` throughout, JSON/CSV export (CSV via
  blob, never parsed as JSON).
- IA change: bottom/sidebar nav now Panel/Diario/Biblioteca/**Reportes**/Perfil
  (5 items, matches the plan's target IA). "Cuenta" moved out of the primary
  nav into the Sidebar footer (desktop, new gear icon) — it was already in
  UserMenu for mobile.
- **Real bug found via live smoke test and fixed**: `GET /reports/nutrition?include_weight=false`
  returned 422 (`validation.boolean`). Axios serializes a JS `false` query
  param as the literal string `"false"`, but Laravel's `boolean` validation
  rule only accepts `true|false|0|1|'0'|'1'` as actual values — the *word*
  "false" is not in that set. Fixed centrally in `src/api/client.ts` with a
  request interceptor that normalizes any boolean GET param to `'1'`/`'0'`,
  so this can't recur for any future endpoint with a `sometimes|boolean`
  query param. Added a regression test in client.test.ts.
- No backend contract changes needed otherwise — Fase 0's report/template/copy
  schemas were already accurate.
Changed: src/api/templates.ts, src/api/reports.ts (new), src/api/meals.ts
(+copy), src/api/client.ts (+boolean param normalization), src/api/client.test.ts,
src/pages/library/{TemplatesPage,TemplateFormModal,ApplyTemplateModal}.tsx (new),
src/pages/reports/ReportsPage.tsx (new), src/pages/diary/CopyMealModal.tsx (new),
src/pages/diary/DiaryPage.tsx, src/pages/dashboard/MealGroup.tsx (+2 optional actions),
src/layouts/navConfig.ts, src/layouts/Sidebar.tsx, src/pages/library/LibraryPage.tsx,
src/router/index.tsx.
Passed: npm run typecheck, npm run lint, npm run test (28 tests), npm run build;
live smoke test via Playwright confirmed Reports (real coverage/averages/chart/
table) and Templates (list/apply) work end-to-end against the seeded demo data.
Remaining: no automated E2E for this flow yet (Fase 8). CSV/JSON export
buttons verified to fire without erroring but the downloaded file contents
weren't independently re-parsed in this smoke pass.

## Fase 7 — Admin completo
Status: done
Decisions:
- Backend contract closed first (see backend progress "Fase 7"): `FdcStatus`,
  `FdcImportSummary`, `FdcError`, `FoodImportBatch`, `ExternalNutrientMapping`,
  `DataAuditEvent`, `FoodSource` schemas, all previously-deferred admin
  requestBodies. Schema-only — no backend behavior changed.
- New `AdminLayout.tsx` (5-tab subnav: Alimentos/Importaciones/FoodData
  Central/Mapeos/Auditoría), matching the plan's IA. Existing
  `AdminFoodsPage`/CRUD/CSV-import left untouched (already worked, not
  migrated to generated types — low value given it's not broken).
- New src/api/adminAdvanced.ts covering FDC status/preview/import, import
  batches, nutrient mappings, audit events. Three of these endpoints
  (`listImportBatches`, `listNutrientMappings`, `listAuditEvents`) return
  Laravel's *native* paginator JSON (not this app's usual `{data, meta}`
  wrapper) — documented and typed as such rather than pretending they match
  the other pattern.
- FDC pages never display the API key (backend already omits it — only
  `api_key_configured`/`ready` booleans). Preview/import disabled client-side
  when `!status.ready`.
- Nutrient mapping "select a local nutrient" is honestly limited: no backend
  endpoint lists all nutrients, so the UI shows the already-assigned
  `nutrient_id` (if any) as read-only and only lets "Mapeado" be selected
  once a nutrient is already assigned — not inventing a picker backed by
  nothing.
- Live smoke test (admin@fitness.local) confirmed: FDC page correctly shows
  "Deshabilitada/Sin API key/No disponible" (matches real local config, no
  FDC_ENABLED/API key set), preview/import correctly disabled; Mapeos/Auditoría
  render clean empty states (no seeded data, as expected since FDC never ran).
Changed (frontend): src/api/adminAdvanced.ts (new), src/pages/admin/{AdminLayout,
FdcPage,ImportBatchesPage,NutrientMappingsPage,AuditPage}.tsx (new), src/router/index.tsx.
Changed (backend, contract owner): see backend progress doc "Fase 7".
Passed: npm run typecheck, npm run lint, npm run test (28 tests), npm run build;
backend: php artisan test (185 tests, 575 assertions), pint; live smoke test
via Playwright as an admin user.
Remaining: FDC preview/import/batch-detail/mapping-update flows only verified
structurally (disabled state) — actually exercising a real FDC import would
need FDC_ENABLED=true and a real API key, out of scope for local dev/CI per
the plan ("no llames FDC real en tests").

## Fase 8 — Testing, CI y E2E
Status: done (e2e job deferred, see Remaining)
Decisions:
- MSW (`src/test/server.ts`, `src/test/handlers/`) added as the primary mocking
  layer for component/integration tests going forward, replacing ad-hoc mocks
  where practical. `axios-mock-adapter` is kept alongside it for the raw
  interceptor-level tests in `client.test.ts`/`errors.test.ts` — it replaces
  axios's adapter before MSW's network-layer interception would apply, so the
  two don't conflict, they just operate at different layers.
- Handlers were written strictly from real backend response shapes already
  verified during Fases 1-7 (e.g. `dashboardSummaryFixture` mirrors the actual
  `DashboardSummary` schema with one complete item, one partial item, and a
  partial day-level nutrient status) — no invented fixtures.
- Playwright added (`playwright.config.ts`, `e2e/`) as real-backend E2E,
  config-driven via `BASE_URL` so it can run against any seeded environment.
  `smoke.spec.ts` covers login→dashboard→library→reports for the seeded demo
  user; `admin.spec.ts` covers the admin guard and the FDC status page never
  leaking the API key.
- `tsconfig.e2e.json` (pre-existing, unreferenced) had a TS5101 error
  (`baseUrl` deprecated in the installed TS version) — fixed with
  `"ignoreDeprecations": "6.0"`, wired into the root `tsconfig.json` references,
  and added `playwright.config.ts` itself to its `include` so ESLint's
  `@typescript-eslint/parser` can resolve `parserOptions.project` for that file
  (mirrors the existing pattern where `tsconfig.node.json` includes
  `vite.config.ts` for the same reason). `eslint.config.mjs`'s e2e override
  block's `files` glob was extended from `['e2e/**/*.{ts,tsx}']` to also match
  `playwright.config.ts` directly, since the file lives at the repo root, not
  under `e2e/`.
- **Contract-check topology fix**: `orval.config.ts` previously pointed at
  `../fitness-backend/storage/api-docs/api-docs.json` — a relative path that
  only resolves when both repos are checked out as siblings on disk. That's
  fine for local dev but breaks in CI: `fitness-backend` and `fitness-frontend`
  are separate GitHub repos, and `fitness-backend` is **private**, so a
  cross-repo checkout would need a PAT stored as a secret — which conflicts
  with the plan's own "CI sin secretos" criterion. Fixed by vendoring a copy of
  the spec into this repo at `openapi/api-docs.json` and repointing
  `orval.config.ts`'s `input.target` at it. The contract is still backend-owned:
  whoever changes it in `fitness-backend` copies the updated
  `storage/api-docs/api-docs.json` into `fitness-frontend/openapi/api-docs.json`
  before running `npm run gen`. This keeps `contract:check` fully local/offline
  and secret-free in CI while preserving drift detection.
- CI (`.github/workflows/ci.yml`) added with `static` (lint + typecheck +
  contract:check), `unit` (test), and `build` jobs, matching the plan's spec.
  The `e2e` job was intentionally **not** added yet — see Remaining.
Changed: src/test/handlers/{auth,dashboard,index}.ts (new), src/test/server.ts
(new), src/test/setup.ts (rewritten for MSW), src/store/authSlice.integration.test.ts
(new), src/api/dashboard.test.ts (new), playwright.config.ts (new), e2e/{smoke,admin}.spec.ts
(new), tsconfig.e2e.json (fixed + extended include), tsconfig.json (+e2e reference),
eslint.config.mjs (e2e override glob), package.json (+test:e2e script),
openapi/api-docs.json (new, vendored spec), orval.config.ts (input target),
.github/workflows/ci.yml (new).
Passed: npm run lint, npm run typecheck, npm run test -- --run (32 tests), npm run build.
Remaining: the `e2e` CI job is deferred — running Playwright's real-backend
smoke/admin specs in CI needs a seeded `fitness-backend` (MySQL) reachable from
this workflow, and since that repo is private and separate, wiring it up would
require the same cross-repo secret this phase just worked around. `npm run
test:e2e` works today against a manually seeded local backend; automating it
in CI is left as follow-up once a reproducible backend+MySQL CI setup exists
(e.g. a shared self-hosted runner, or making a slim seeded-schema fixture
public). Documented directly in `ci.yml` as a comment so the gap isn't silent.

## Fase 9 — Limpieza y gate final
Status: done
Decisions:
- Of the plan's "Eliminar" list, only two files were actually deletable:
  `src/api/notificationPreferences.ts` and its sole dependency
  `src/api/mock/localStore.ts`. There is no backend endpoint for
  notification preferences anywhere (confirmed via grep across
  `routes/api.php` and `app/Http/Controllers`), so this was a pure
  localStorage mock with no contract behind it — removed it (and the
  "Notificaciones" card in `AccountPage.tsx` that was its only consumer)
  rather than inventing a backend contract for a feature nobody asked to
  keep, per the plan's "no inventar endpoints" rule.
- `src/types/models.ts` was **not** deleted — the plan says to remove it
  "cuando ya no existan consumidores," and it still has real consumers:
  `User`/`Food`/`PaginatedResponse`/`NutritionTarget`/`UserProfile` are used
  by `auth.ts`, `admin.ts`, `AdminFoodsPage.tsx`, `FoodFormModal.tsx`,
  `profile.ts`, `guards.test.tsx`, `foods.ts`, `ProfilePage.tsx`, and
  `authSlice.ts`. Checked whether migrating these to the Orval-generated
  equivalents (`src/api/generated/model/*`) would let this file finally
  retire: it wouldn't be a clean win — the generated `User`/`UserProfile`
  types mark every field optional (OpenAPI doesn't know these are always
  present on an authenticated response), while the hand-written versions in
  `models.ts` are non-optional and match what the app's guards/session logic
  actually rely on (e.g. `RequireAdmin` reads `user.is_admin` directly, no
  optional chaining). Forcing that migration would be a speculative
  refactor with a real ergonomic regression, not a cleanup — left as is,
  same call already made for `AdminFoodsPage`/CRUD in Fase 7 ("already
  worked, not migrated to generated types — low value given it's not
  broken").
- `weight.ts` was already migrated to the generated client back in an
  earlier phase (confirmed: it imports `getProgress` from
  `@/api/generated/progress/progress`), matching the plan's "se conserva,
  pero reemplazado por adapter real."
- Updated `README.md` and `docs/architecture.md`: the Orval contract source
  section, quality-gate command list (`typecheck`/`contract:check`/
  `test:e2e` were missing), the CI section (new), and the functional-modules
  list (was still Fase-0-era, missing Library/Recipes/Templates/Reports/FDC
  admin/consent banner entirely).
Changed: src/pages/account/AccountPage.tsx (removed Notificaciones card + its
state), deleted src/api/notificationPreferences.ts, deleted
src/api/mock/localStore.ts (and the now-empty src/api/mock/ dir),
README.md, docs/architecture.md.
Final validation gate — backend: `vendor/bin/pint --test` (passed),
`php artisan test` (185 tests, 575 assertions, passed),
`APP_ENV=testing php artisan testing:verify-upgrade-path` (passed).
`composer contract:check` shows a diff — expected, not a regression: none of
this session's `OpenApiSpec.php`/controller changes across Fases 0-7 have
been committed yet, so the freshly-regenerated `storage/api-docs/api-docs.json`
correctly differs from the last commit. Resolves itself once this work is
committed.
Final validation gate — frontend: `npm run lint` (clean, 1 pre-existing
warning), `npm run typecheck` (clean), `npm run test -- --run` (32 tests
passed), `npm run build` (succeeded). `npm run contract:check` shows a diff
for the same reason as the backend — `src/api/generated/*` (mutator pattern,
health check, all Fase 1-7 schema additions) is uncommitted relative to the
last commit; the diff is pre-existing session work, not new drift from this
phase's orval.config.ts retargeting (verified by re-running `npm run gen`
against the vendored spec and confirming an identical diff stat before and
after the retarget).
Remaining: nothing outstanding for the plan's 9 phases. The only two
follow-ups intentionally deferred, both already called out earlier and not
new: (1) automating the Playwright `e2e` CI job once a public/reproducible
backend+MySQL CI setup exists (Fase 8), and (2) exercising a real FDC
import end-to-end, which needs `FDC_ENABLED=true` and a real API key
(Fase 7) — both out of scope by the plan's own rules, not gaps in this
phase's work.

## Fase 10B — Frontend type and adapter consolidation
Status: done
Mode: consumer contract consolidation. Precondition checked: 10A's spec was
copied to `openapi/api-docs.json` and byte-for-byte hash-matched against
`fitness-backend/storage/api-docs/api-docs.json` before starting (10A itself
wasn't committed yet in the backend repo at session start — flagged, not a
blocker since the file content was verified identical).
Decisions:
- **Backend addendum found while reading generated types** (before touching
  any frontend code): 10A's required-fields pass only covered *named*
  `#/components/schemas/X` schemas. Several *inline* response schemas — the
  ones actually used by the adapters this phase touches — had the identical
  gap: `POST /auth/login`, `POST /auth/register`, `GET /profile`,
  `PUT /profile`, `GET /profile/targets`, `GET /account/export`,
  `GET /foods`, `GET /foods/{id}`, `GET /foods/categories`, `GET /my-foods`,
  `POST /my-foods`, `PUT /my-foods/{food}`, `POST /foods/{food}/portions`,
  `PUT /food-portions/{portion}`, and five `/admin/*` endpoints all had
  `properties` but no `required`. Fixed all of them the same way as 10A
  (verified against unconditional `return response()->json([...])` bodies,
  not guessed), per this phase's explicit instruction: "no soluciones un
  schema incorrecto con casts; vuelve al owner contract."
- **Real runtime bug found via the same read**: `ProfileController::targetHistory`
  (`GET /profile/targets`) returned Laravel's native flat paginator while
  documenting `{data, meta}` like every other public list endpoint — fixed
  in 10A's session but documented here since it directly unblocked
  `profile.ts`'s migration.
- **Second real bug found**: `FoodController`/`MyFoodController`'s CSV
  import preview/commit responses declared `summary: type: object` (no
  shape) and `errors: type: array` when the runtime `errors` is actually a
  PHP associative array keyed by CSV line number (serializes as a JSON
  object, not an array). Added a `FoodImportSummary` schema (6 required
  integer fields) and fixed `errors` to `type: object` with
  `additionalProperties: string`. This is what let `admin.ts` drop its
  untyped `summary`/`errors` handling entirely.
- **Third precision fix**: `Food.data_type` was `type: string` with no
  `enum`, so Orval generated a bare `string` instead of a literal union —
  fixed by adding `enum: ['generic', 'branded', 'manual']` (matches
  `FoodCsvImporter::ALLOWED_DATA_TYPES` and the migration comment).
- Migrated `src/api/auth.ts`, `src/api/profile.ts`, `src/api/account.ts`,
  `src/api/admin.ts` from hand-written `api.get/post/put/delete` calls to
  the generated `getAuth()`/`getProfile()`/`getAccount()`/`getAdmin()`
  functions and their generated request/response types. Kept
  `accountApi.exportData()` on the raw axios instance with an explicit
  `responseType: 'blob'`, per the plan's documented exception (the
  generated client always decodes JSON via the mutator).
- Removed all `as unknown as LaravelPage<...>` casts from
  `src/api/adminAdvanced.ts` — now that `PaginatedFoodImportBatches`/
  `PaginatedNutrientMappings`/`PaginatedAuditEvents` have `required[]`
  matching Laravel's native paginator shape exactly, the generated types
  are usable directly with no cast, and the hand-rolled `LaravelPage<T>`
  interface was deleted as dead code.
- Fixed the one `api: any` in the codebase (`ProfileStep.tsx`) — typed as
  `{ saveProfile: (payload: ProfilePayload) => Promise<unknown> }`, the
  minimal structural shape the component actually calls (it never reads
  the resolved value), satisfied by both `onboardingApi.saveProfile` and
  `profileApi.update`.
- Retired `src/types/models.ts` entirely — its last two consumers
  (`src/api/foods.ts`'s `PaginatedResponse`, `guards.test.tsx`'s `User`)
  migrated to generated equivalents (`ListFoods200`'s inline shape,
  `@/api/generated/model`'s `User`). Confirmed zero remaining imports
  before deleting.
- **Unknown-nutrients-as-zero fix (Task E)**: `src/lib/nutrients.ts`'s
  `nutrientAmount()` returned `0` for energy/protein/carbohydrate/fat when
  the food had no such nutrient row — only fiber/sodium used the
  null-preserving `nutrientAmountOrNull()`. Removed `nutrientAmount()`
  entirely; `getFoodMacros()` now returns `number | null` for all six
  fields. Propagated to every consumer: `FoodsPage.tsx` (list card + table,
  now via `NutrientValue`), `RecipeEditorPage.tsx` (ingredient search row),
  `MyFoodsPage.tsx`, `AdminFoodsPage.tsx`, admin `FoodFormModal.tsx` (form
  pre-fill now leaves the field blank instead of "0" when unknown),
  `DiaryPage.tsx` (quantity preview and search row). `FoodDetailPage.tsx`
  got the most substantial change: per-serving protein/carbs/fat/kcal are
  now `number | null`, the macro-kcal pie chart is only rendered when at
  least one macro is known (never built from `null * factor = NaN`), and
  every displayed value goes through `NutrientValue` so unknown reads
  "Sin dato" instead of "0.00 g". `MyFoodFormModal.tsx` already did this
  correctly for all six fields (used `nutrientAmountOrNull` directly) —
  confirmed as the reference pattern, not changed.
- `ProfilePage.tsx` also migrated off `@/types/models` and dropped its
  `Number(t.target_kcal)`/`Number(t.protein_grams)` etc. workarounds now
  that `NutritionTarget`'s fields are real numbers end-to-end — these
  casts were silently masking the exact decimal-as-string bug 10A fixed at
  the source; the arithmetic (`profile.weight_kg / (profile.height_cm/100)**2`
  for BMI) was already written assuming real numbers, meaning it would
  have produced wrong results in production before the 10A/10B fixes.
Changed: app/Http/Controllers/{Auth/AuthenticatedSessionController,Auth/RegisteredUserController,
Api/AccountController,Api/ProfileController,Api/OnboardingController,Api/FoodController,
Api/MyFoodController,Api/FoodPortionController,Api/Admin/FoodAdminController,
Api/Admin/FoodDataCentralAdminController}.php and app/OpenApi/OpenApiSpec.php
(backend, required[] additions + FoodImportSummary schema + data_type enum),
src/api/{auth,profile,account,admin,adminAdvanced,foods}.ts, src/lib/nutrients.ts
(+nutrients.test.ts, new), src/store/authSlice.ts, src/pages/onboarding/ProfileStep.tsx,
src/pages/profile/ProfilePage.tsx, src/pages/foods/{FoodsPage,FoodDetailPage}.tsx,
src/pages/library/MyFoodsPage.tsx, src/pages/admin/{AdminFoodsPage,FoodFormModal}.tsx,
src/pages/recipes/RecipeEditorPage.tsx, src/pages/diary/DiaryPage.tsx,
src/router/guards.test.tsx, src/test/handlers/dashboard.ts (+fiber_g_total fixture field),
deleted src/types/models.ts.
Passed: backend — vendor/bin/pint --test, php artisan test --no-coverage
(200 tests, 679 assertions), php artisan l5-swagger:generate. Frontend —
npm run gen, npm run lint (clean, 1 pre-existing warning), npm run typecheck
(clean), npm run test -- --run (37 tests, +5 new), npm run build.
`contract:check` on both repos shows a diff — expected/not a regression,
same uncommitted-work reason as every prior phase.
Remaining: none for 10B's scope. Per the plan's explicit "no ejecutar las
tres en una sola sesión" rule, 10C (full-stack acceptance across both
repos, E2E flows, harness/progress updates) is intentionally not started
in this session.

## Fase 10C — Full-stack acceptance and cleanup
Status: done
Mode: integration verification. Both repos, real servers, no FDC real calls,
no new features, contracts only changed where a bug was reproduced live.
Setup: backend served with an isolated MySQL database (`fitness_e2e_10c`,
`DB_DATABASE` env override — never touched the developer's real local
`fitness_app` database, which already had 36 tables of unrelated local
work), `FDC_ENABLED=false`, `php artisan migrate:fresh --seed` per clean
run; frontend `npm run dev` against the default Vite proxy config.
Decisions:
- Confirmed two real product gaps that block a "pure UI" E2E for their
  checklist items, without inventing UI to paper over them (out of scope
  per "no agregues features"): there is no screen to create a food portion
  (`foodsApi.createPortion()` exists, nothing calls it), and no "manage
  consents" screen (by design — no endpoint lists individual consents).
  Both flows are exercised at the API level instead, through the browser's
  own authenticated session (see `e2e/helpers.ts#apiRequest`), so the
  underlying contract is still proven end-to-end.
- `apiRequest()` runs as an in-page `fetch()`, not Playwright's
  `page.request` — Sanctum's stateful-domain check needs `Origin`/`Referer`
  headers that only a same-page fetch sends automatically; `page.request`
  doesn't, and silently gets a false 401 (same root cause as the earlier
  curl-based Sanctum repro gotcha from Fase 5-7 smoke testing).
- **Three real, reproducible bugs found via live E2E and fixed** (all with
  regression coverage):
  1. `WeightTrendCard`'s `handleLog()` had no `catch` — on any failed
     submit (reproduced via a 409 CONSENT_REQUIRED after revoking a
     consent) the modal never closed and its backdrop trapped the user,
     hiding the `ConsentBanner` underneath with zero error feedback. Fixed
     by closing the modal and showing an error toast on failure, matching
     the pattern used elsewhere in the app.
  2. `StoreCustomFoodRequest` validated `nutrients` as `required` (not just
     `present`), so a private food with every macro left blank — the exact
     "fully unknown nutrition" case the UI's own help text promises
     ("se guardará como desconocido, no como cero") — failed with a 422
     the user couldn't interpret. Fixed to `present` (key must exist, may
     be empty); `MyFoodController::normalize()` also directly indexed
     `$validated['nutrients']`, which Laravel's `validated()` omits
     entirely for an empty array (not present-and-empty) — added a `?? []`
     fallback, since the domain layer (`CustomFoodNormalizer::cleanValues`)
     already treats every missing nutrient code as unknown correctly.
  3. Admin CSV import (`FoodAdminController::importPreview`/`importCommit`)
     stored the upload via `Storage::disk('local')` (root
     `storage/app/private` in Laravel 13) but read it back via
     `storage_path("app/{$path}")` (`storage/app`, missing `private/`) —
     a 500 on every environment, not an artifact of this session's setup.
     Fixed both call sites to `Storage::disk('local')->path($path)`. No
     backend test covered CSV import at all before this; added one that
     deliberately does *not* use `Storage::fake()` (a fake disk would have
     masked exactly this class of path-resolution bug) and confirmed it
     fails without the fix before confirming it passes with it.
  4. (Frontend-only, not a contract bug) `FoodFormModal.tsx` (admin) sent
     `food_source_id: Number(form.food_source_id)` unconditionally — on
     edit, that field is hidden and never re-collected, so `Number('')`
     sent `0`, which fails the backend's `exists:food_sources,id` check on
     every edit. Backend already supported omitting the key on update
     ("the edit form doesn't re-collect them" — a pre-existing comment).
     Fixed the frontend to only include `food_source_id` when creating.
- 4 new Playwright specs (`e2e/auth-consent.spec.ts`,
  `e2e/foods-portions.spec.ts`, `e2e/recipes-diary.spec.ts`,
  `e2e/templates-reports.spec.ts`) plus `e2e/admin.spec.ts` extended from 2
  to 8 tests (CRUD, CSV preview, FDC disabled state, batches/mappings empty
  states, audit list). Covers every Fase 10C checklist item except the two
  documented UI gaps above (still covered at the API level).
- Full suite (27 tests across 7 spec files, including the pre-existing
  `smoke.spec.ts`/`diet-quality.spec.ts`) passes green. Two tests failed
  once in a single full-suite run (both pre-existing, both timing out at
  login) and passed cleanly when re-run in isolation immediately after —
  consistent with rate-limit/resource pressure from ~25 sequential logins
  fired during this session's debugging, not a regression; noted here
  rather than silently ignored.
- `.ai-harness.yaml` updated (both repos): `install` now `npm ci`/
  `composer install` stays, `integration_tests`/`e2e_tests`/
  `contract_generate`/`contract_validate` filled in (frontend's were all
  `null`; backend's `contract_validate` was literally `UNKNOWN`),
  `verification_profiles.full` now matches the plan's actual gate.
  `progress/current.md` rewritten — it still described "Sprint 1, 9 tests"
  in one section despite other sections already being newer, and its
  Orval instructions still referenced the pre-Fase-8 relative-path contract
  source instead of the vendored copy.
Changed: app/Http/Requests/Food/StoreCustomFoodRequest.php,
app/Http/Controllers/Api/Admin/FoodAdminController.php (Storage path fix),
tests/Feature/Api/Admin/FoodAdminTest.php (+1 regression test) — backend;
src/components/weight/WeightTrendCard.tsx, src/pages/admin/FoodFormModal.tsx,
e2e/helpers.ts (new), e2e/{auth-consent,foods-portions,recipes-diary,
templates-reports}.spec.ts (new), e2e/admin.spec.ts (extended),
e2e/fixtures/import-preview.csv (new), .ai-harness.yaml, progress/current.md
— frontend. Backend .ai-harness.yaml also updated (contract_validate).
Passed: backend — vendor/bin/pint --test, php artisan test --no-coverage
(287 tests, 992 assertions), APP_ENV=testing php artisan testing:verify-upgrade-path.
Frontend — npm run lint (clean), npm run typecheck (clean), npm run test -- --run
(53 tests), npm run build, npm run test:e2e (27/27 passed).
`contract:check` on both repos shows a diff — expected, not a regression:
this entire Fase 10 body of work (10A + 10B + 10C) is still uncommitted at
the moment this section was written.
Remaining: the two documented UI gaps (portion creation, consent
management) are product decisions for the team, not implementation gaps —
flagged, not fixed, per "no agregues features". The `e2e` CI job is still
not automated (documented reason unchanged since Fase 8/10B: fitness-backend
is a private separate repo).

## Fase 11A — Gestión de porciones de alimento (product gap closed)

Full product-gap audit (see `fitness-backend/PLAN_FASE_11_GAPS_DE_PRODUCTO.md`)
compared all 90 backend `operationId`s against real frontend usage. Found
four backend capabilities with a working adapter but zero UI: portions CRUD,
consent revoke, password change, meal metadata edit. This phase closes the
first: `createFoodPortion`/`updateFoodPortion`/`deleteFoodPortion` (already
present in `src/api/foods.ts`, never called from a component before now).

Changed: `src/pages/foods/PortionFormModal.tsx` (new) — a create/edit modal
for a food portion (`description`, `amount`, `unit_label`, `gram_weight`),
reusing `Modal`/`Input`/`Button`. `src/pages/foods/FoodDetailPage.tsx` — added
a "Mis porciones" section listing the user's own portions
(`food.portions.filter(p => p.is_own)`) with edit/delete icon buttons;
official/manufacturer portions (`is_own: false`) are excluded from this list
since `FoodPortionPolicy` rejects mutations on them — the UI does not offer
an action that would 403. Delete uses the existing `ConfirmDialog`. Data
reloads via a shared `load()` after every mutation. `e2e/foods-portions.spec.ts`
— replaced the old API-only portion assertion with a full UI-driven test
(create → edit → delete) that also exercises the same `display_label` field
the diary/food-list already rely on, run against an isolated `fitness_e2e_11`
database.

No backend changes — the three endpoints and their request/response schemas
were already complete and documented; this phase was frontend-only.

Passed: `npm run lint` (clean, one pre-existing unrelated warning),
`npm run typecheck` (clean), `npm run test -- --run` (53 tests),
`npm run build`, `npx playwright test e2e/foods-portions.spec.ts` (5/5).

Remaining: Fases 11B (consent revoke), 11C (change password), 11D (edit
meal metadata) — same audit, not yet implemented.
