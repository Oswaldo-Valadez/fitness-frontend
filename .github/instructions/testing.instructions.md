---
applyTo: "src/**/*.{test,spec}.{ts,tsx}"
---

# Testing Instructions

- Map test cases to specs, BDD, or confirmed bug reproductions.
- Test observable behavior rather than private implementation details.
- Cover validation and authorization failures when applicable.
- Do not delete or weaken expectations just to pass.
- Use deterministic data and isolated test state.
- Use terminating commands only.
- Frontend has no test script evidence; declare BLOCKED/UNKNOWN rather than invent commands.
