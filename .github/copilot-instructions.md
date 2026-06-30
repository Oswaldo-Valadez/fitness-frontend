# GitHub Copilot Repository Instructions

Before editing, read AGENTS.md and .ai-harness.yaml.

- Classify work mode before any file edits.
- Use repository evidence only; never invent requirements, commands, contracts, or paths.
- Work in the smallest necessary scope.
- Follow SDD flow for behavior changes.
- Add a failing reproduction test first for bug fixes.
- Preserve behavior in code-only refactors.
- Never manually edit generated files.
- Use terminating verification commands from .ai-harness.yaml.
- Run targeted checks during implementation and full profile before completion.
- Report changed files, tests, verification results, assumptions, blockers, and risks.
