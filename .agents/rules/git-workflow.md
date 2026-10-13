# Strict Manual-Only Git Workflow

This rule governs Git commit and push operations in the Finance with Geetha workspace.

## Strict Manual-Only Policy
NEVER automatically stage, commit, or push changes to GitHub. After completing a coding task, inspect and report the modified files and test results, then stop. Do not execute `git add`, `git commit`, `git push`, `npm run safe-push`, or any equivalent operation unless the user explicitly requests that Git operation in the current conversation. Do not interpret task completion, successful tests, or previous instructions as permission to commit or push. Leave all changes local and uncommitted by default.

## Rules When Commit/Push Is Explicitly Requested by User
When the user explicitly and directly requests a commit and push in the current conversation:
1. **Branch Restriction**: Pushing is strictly permitted only to `main` at `origin`. Never push directly to a different branch.
2. **No Force Pushes**: Never use `--force`, `-f`, `--force-with-lease`, or commands that rewrite Git history.
3. **Secret Elimination**: Never commit `.env`, `.env.local`, credentials, service-account JSON, private keys (`*.pem`, `*.key`), or certificates.
4. **Pre-flight Checks**: Before committing, `npm run lint` and `npx tsc --noEmit` must pass cleanly.
5. **Conflict Avoidance**: Fetch upstream `origin/main` before pushing. If local is behind or conflicted, abort and alert the user.
6. **Execution Command**: Use `npm run safe-push -- -m "<descriptive message>"` which automates and enforces all safety gates.
