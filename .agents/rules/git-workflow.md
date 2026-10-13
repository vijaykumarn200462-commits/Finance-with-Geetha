# Safe Git Commit & Push Workflow

This rule governs Git commit and push operations in the Finance with Geetha workspace.

## Policy
1. **Branch Restriction**: Pushing is strictly permitted only to `main` at `origin`. Never push directly to a different branch.
2. **No Force Pushes**: Never use `--force`, `-f`, `--force-with-lease`, or commands that rewrite Git history.
3. **Secret Elimination**: Never commit `.env`, `.env.local`, credentials, service-account JSON, private keys (`*.pem`, `*.key`), or certificates.
4. **Pre-flight Checks**: Before committing, `npm run lint` and `npx tsc --noEmit` must pass cleanly.
5. **Conflict Avoidance**: Fetch upstream `origin/main` before pushing. If local is behind or conflicted, abort and alert the user.
6. **Execution Command**: Use `npm run safe-push -- -m "<descriptive message>"` which automates and enforces all safety gates.
