Sprint 4 — Micronutrientes y referencias DRI: CLOSED 2026-07-12

Phases: 4A(spec/no-code) 4F(contract vendored+Orval) 4G(UI) 4H(E2E+docs).
Frontend SHAs: 72255a4/a9c648d/b0b3802 (4A/4F/4G), 4H uncommitted at handoff.
Backend contract SHA: 364a01f (unchanged since 4F — no `npm run gen` diff
in 4H, contract:check confirms byte-identical vendored copy).

Delivered:
- Adapter `src/api/nutrients.ts` (5 methods, generated-client-only, no
  hand-written backend types).
- Third "Nutrientes" tab in Reportes (`/reports/nutrients`,
  `/reports/nutrients/:code`); period/category/status filters; no
  deficient/exceso filter; no UL anywhere; range references rendered as
  text only, never a midpoint; sodium AI+CDRR with CDRR primary.
- Dashboard `MicronutrientsCard` (complete/partial/no-data counts, no
  "worst nutrients" ranking).
- Food detail: 4 per-100g sections with quality-status/source per row,
  missing rows render "Sin dato" never 0. Food form: collapsible
  "Micronutrientes opcionales" (10 fields, blank=unknown/0=real zero).
- Recipe editor: per-ingredient micronutrient availability (informational,
  server-authoritative preview). Recipe detail: grouped nutrient table, no
  reference comparison shown (per spec).
- Chart: null breaks the line, accessible table mandatory alongside.

4H work:
- e2e/nutrients.spec.ts: user flow (25 steps — food detail complete/
  partial, private food with real-zero iron + blank vitamin D, mixed
  recipe → partial warning, diary, dashboard card, 30-day report, nutrient
  detail chart/table, undisclosed profile → range reference via
  /api/nutrition/references, export 4.0.0, consent revoke/reaccept) and
  admin flow (9 steps — locked canonical FDC mappings incl. 301→calcium_mg
  and 320→vitamin_a_rae_mcg, 422 on repointing a locked mapping, no API key
  exposed anywhere). Never calls real FDC (backend Http::fake coverage is
  tests/Feature/Api/FdcIntegrationTest.php). Passes reproducibly.
- Real bug found and fixed: `src/components/ui/Modal.tsx` had no internal
  scroll container — a tall form (the new 10-field micronutrients section)
  could push its submit button below the viewport with no way to reach it.
  Fixed with `max-h-[calc(100vh-2rem)]` + an internal `overflow-y-auto`
  content area; no test asserted the old flat DOM shape.
- Fixed 3 pre-existing E2E locator/version bugs surfaced while validating
  the full suite: diet-quality.spec.ts asserted export_version 3.0.0 (now
  4.0.0 since Sprint 4D); recipes-diary.spec.ts's loose `getByText(recipeName)`
  collided with a new sr-only nutrient-breakdown caption from Sprint 4G;
  admin.spec.ts's "nutrient mappings empty state on fresh DB" test predated
  Sprint 4E's ExternalNutrientMappingSeeder (now asserts the 16 seeded
  canonical mappings instead).
- Full validation green: npm ci, gen (no diff), contract:check, lint,
  typecheck, 98/98 unit tests, build, test:e2e (28/32 — 4 pre-existing,
  unrelated failures), git diff --check.

Known risk (not a 4H regression): running the full Playwright suite serially
against a 10 req/min login throttle causes `waitForURL` timeouts in specs
that run late in the file order (auth-consent, recipes-diary,
templates-reports) once cumulative logins exceed budget within 60s;
nutrients.spec.ts itself passes cleanly. Documented in docs/verification.md,
same class as Sprint 3's known flakiness.

Known scope gap (not fixed, backend decision required): admin food
create/update never gained a `nutrients`/`nutrition_basis` field in
Sprint 4 — the admin form only edits the 6 legacy macro fields; admin-
created foods can't carry the 10 new micronutrients. Frontend intentionally
did not fabricate a client-side contract the backend doesn't accept.

Docs updated: README, architecture, contract, consumer-handoff,
verification. AGENTS.md/.ai-harness.yaml left untouched (no matching
module-listing section to extend).
