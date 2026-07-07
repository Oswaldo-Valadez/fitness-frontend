Current phase: DONE (3F closed)
Status: Sprint 3 complete; all gates green
Contract SHA: openapi/api-docs.json synced from backend (Sprint 3 spec)
Decisions:
- Reports keeps 5-item primary nav; ReportsLayout adds Nutrición/Calidad tabs.
- Wizard keeps answers in memory only (never localStorage); 409 INSTRUMENT_VERSION_OUTDATED reloads instrument and forces review.
- Dashboard card self-fetches summary(30) and hides itself on load failure.
Changed:
- src/api/dietQuality.ts, src/api/generated/** (Orval), router, ReportsLayout, pages/quality/* (hub, wizard, detail, goal/check-in modals, copy), DietQualityCard, MSW handlers, 3 new test files, e2e/diet-quality.spec.ts, smoke locator fix (pre-existing strict-mode bug)
Passed:
- npm run gen · contract:check · lint · typecheck · test (53) · build · test:e2e (7)
Remaining: none
Risks: E2E requires locally served backend with seeded DB (documented in playwright.config.ts)
