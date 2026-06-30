---
applyTo: "**/*.{ts,tsx,js,jsx},package.json,eslint.config.js,tsconfig*.json"
---

# TypeScript React Instructions

- Keep consumer changes within this repository unless owner contract updates are in scope.
- Use generated API client from src/api/generated as the contract consumption layer.
- Do not hand-edit generated files under src/api/generated.
- Use npm run lint and npm run build for terminating frontend checks.
- Do not invent backend-only behavior in frontend code or docs.
