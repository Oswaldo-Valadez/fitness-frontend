Current phase: 4F — OpenAPI contract vendored and Orval regenerated (DONE; no UI built yet)
Status: openapi/api-docs.json updated from backend commit 364a01f (byte-identical, verified via diff), Orval client regenerated (76 files changed: 1 removed model, ~60 new nutrient-schema models + a new `nutrients/` client folder), all gates green
Backend SHA: 364a01f (Sprint 4F backend commit — schema formalization, no path/operationId changes)
Contract SHA: openapi/api-docs.json now matches fitness-backend/storage/api-docs/api-docs.json exactly (diff verified empty)
Decisions (4F):
- `npm run gen` is the only way src/api/generated/ was touched — no generated file hand-edited. The diff is dominated by new small per-schema model files (Orval's one-file-per-schema convention) for the 18 new named OA components from the backend phase, plus a deleted `foodNutrient.ts` (schema renamed to `FoodNutrientProvenance` with 4 extra fields) and a new `src/api/generated/nutrients/` tag folder (the 5 new Nutrient* endpoints).
- Fixed 3 real TypeScript breaks caused by the corrected contract (not "unused new code" — these are existing consumers whose assumptions were wrong):
  1. `src/pages/admin/FdcPage.tsx`: displayed `preview.mapped`/`preview.pending` as if they were counts (`integer` per the old, incorrect OA types). The corrected types (`FdcImportSummaryMapped` = code→amount map, `FdcPendingNutrient[]`) reflect what the backend always actually returned (confirmed by reading FoodDataCentralNutrientMapper::map() and FoodDataCentralImportService::import() server-side) — fixed to `Object.keys(mapped).length` / `pending.length`, preserving the same displayed semantics (counts) with the correct source data.
  2. `src/pages/library/MyFoodFormModal.tsx`: sent `input_mode` (now a deprecated alias) instead of the canonical, required `nutrition_basis`, and built the `nutrients` map with `number | undefined` values where `DynamicNutrientInput` requires `number | null` (blank input = explicit `null` = "unknown", never `undefined`/omitted, matching the backend's blank-vs-zero contract). Added a `numberOrNull` helper alongside the existing `numberOrUndefined` (still used for the deprecated top-level serving fields) and set `nutrition_basis: form.input_mode`.
  3. `src/test/handlers/dashboard.ts`: MSW fixture predated Sprint 4D's `DashboardSummary.nutrients` (required since 4D on the backend, but this fixture/client were never regenerated until now) — added `nutrients: []` with a comment noting it's empty because this fixture predates the 4G nutrients UI.
- No 4G UI written: no adapter (src/api/nutrients.ts), no report/detail pages, no dashboard coverage card, no food form micronutrient section. All new generated `nutrients/` client code and ~50 new model types are present but unconsumed — intentional, out of 4F scope.
Changed (4F):
- openapi/api-docs.json (vendored copy, byte-identical to backend)
- src/api/generated/** (Orval-regenerated: 1 deleted model, ~14 modified models, ~60 new model files, new nutrients/ tag folder — no manual edits)
- src/pages/admin/FdcPage.tsx (preview counts derived from the corrected mapped/pending shapes)
- src/pages/library/MyFoodFormModal.tsx (nutrition_basis + null-based nutrients payload)
- src/test/handlers/dashboard.ts (added required nutrients: [] to the fixture)
Passed (4F):
- npm run gen: passed, idempotent (second run produces an identical working-tree diff)
- npm run contract:check: gen step passed; git diff step is expected to show the (now committed) regeneration diff, same pattern as the backend's contract:check — no drift on repeated runs
- npm run typecheck: clean
- npm run lint: clean (1 pre-existing unrelated warning in toast.tsx)
- npm run test -- --run: 53/53 passed (10 files), no existing test weakened
- npm run build: passed
Remaining for 4G:
- Adapter (src/api/nutrients.ts, generated-client-only per AGENTS.md rule), reports tab (/reports/nutrients, /reports/nutrients/:code), report/detail pages, dashboard coverage card, food detail sections (now backed by real FoodNutrientProvenance data — quality_status/source per row), food form optional micronutrients section (blank vs 0 semantics — same pattern just added to MyFoodFormModal's 6 legacy fields, extend to the 10 new codes), recipe editor availability/preview, recipe detail nutrient table, Vitest+MSW suites, e2e/nutrients.spec.ts (4H).
Risks:
- Same risks as 4A (range-reference UI must not imply a midpoint; blank-vs-zero regressions; large empty/error-state matrix) — untouched by 4F, still open for 4G/4H.
- FdcPage's mapped/pending counts are cosmetic (admin-only import preview); 4G could optionally show pending reasons per nutrient using the now-correctly-typed FdcPendingNutrient[] instead of just a count.
Spec source: fitness-backend/specs/nutrients/feature.{spec,bdd,test-cases}.md (authoritative).

---

Current phase: 4A — Spec y diseño (DONE; no frontend changes yet)
Status: Design artifacts live in fitness-backend (owner); frontend baseline verified green; no code touched
Backend SHA: c65880c (pre-4A baseline)
Contract SHA: de71d9edd603 (backend storage/api-docs/api-docs.json — unchanged in 4A)
Frontend SHA: 70583a5 (pre-4A baseline)
Decisions:
- Frontend consumes Sprint 4 exclusively via regenerated Orval client after backend 4F; no hand-written backend interfaces.
- Adapter will be src/api/nutrients.ts; new routes /reports/nutrients and /reports/nutrients/:code as a third reports tab (no new bottom-nav item).
- Undisclosed references render as range text, never midpoint, never a "healthy zone" band; partial values show subtotal + caveat and no comparison bar.
- No UL, no clinical/diagnostic copy, no supplement CTAs anywhere (backend ADR 0014 + spec FR-018).
- Charts: null breaks the line (no interpolation); accessible table mandatory.
Changed:
- progress/sprint-4-micronutrients.md (this file)
Passed:
- npm run typecheck (clean)
- npm run test -- --run (53/53, 10 files)
Remaining:
- 4F: copy regenerated OpenAPI spec, npm run gen, contract:check, typecheck.
- 4G: nutrients adapter, reports tab + report/detail pages, dashboard coverage card, food detail sections, food form optional micronutrients (blank ≠ 0), recipe editor availability/preview, recipe detail table, Vitest+MSW suites per specs/nutrients/feature.test-cases.md (TC frontend rows).
- 4H: e2e/nutrients.spec.ts user + admin flows with deterministic fixtures.
Risks:
- Blank-vs-zero semantics in food forms are easy to regress; test explicitly (TC-023/TC-095).
- Range references need non-scalar UI treatment; reuse of existing bar components could accidentally imply midpoints.
- Error/empty-state matrix is large (409/422/429, no context, reference unavailable, inactive nutrient); track against TC-121.
Spec source: fitness-backend/specs/nutrients/feature.{spec,bdd,test-cases}.md (authoritative).
