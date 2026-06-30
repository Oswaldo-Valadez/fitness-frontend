# Verification

## Evidence sources
- package.json (frontend lint/build scripts)
- No .github/workflows files were found.

## Command profiles

### Targeted
1. npm run lint

### Full
1. npm run lint
2. npm run build

## Known blockers and unknowns
- No explicit frontend unit/integration/e2e test script in package.json.
- Contract generation is backend-owner responsibility.
- Contract validation is backend-owner responsibility.
- Client generation command is not defined in repository scripts.

## Command rules
- Use terminating, non-watch commands only.
- Run commands from the correct repository directory.
- Do not substitute missing commands with guessed alternatives.
