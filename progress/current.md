# Current Progress

## Sprint 1 — COMPLETED 2026-06-30

## Status
- React SPA built and functional ✅
- TypeScript: 0 errors ✅
- Orval client generated: `src/api/generated/` (55 files) ✅
- Vite build: passes ✅

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
npx orval
```
(reads from `../fitness-backend/storage/api-docs/api-docs.json`)

## Open blockers
- None

## Pending (Sprint 2)
- Vitest unit tests
- Documentation (README, architecture, ADRs)
