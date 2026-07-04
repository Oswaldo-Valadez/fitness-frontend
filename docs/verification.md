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
