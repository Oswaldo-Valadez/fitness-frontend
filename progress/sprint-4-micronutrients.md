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
