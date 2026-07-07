# Verification

## Evidence sources
- package.json (frontend lint/test/build/generation scripts)
- No .github/workflows files were found.

## Command profiles

### Targeted
1. npm run lint
2. npm run test

### Full
1. npm run lint
2. npm run test
3. npm run build

## Known blockers and unknowns
- Contract generation is backend-owner responsibility.
- Contract validation is backend-owner responsibility.

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
