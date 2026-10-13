<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Strict Manual-Only Git Policy

NEVER automatically stage, commit, or push changes to GitHub. After completing a coding task, inspect and report the modified files and test results, then stop. Do not execute `git add`, `git commit`, `git push`, `npm run safe-push`, or any equivalent operation unless the user explicitly requests that Git operation in the current conversation. Do not interpret task completion, successful tests, or previous instructions as permission to commit or push. Leave all changes local and uncommitted by default.

## Manual Commit & Push Protocol (Only When Explicitly Requested by User)

When the user explicitly and directly requests a commit and push in the current conversation, the agent MUST follow these safety rules:

1. **Pre-commit Inspection**:
   - Inspect `git status` and review changed files.
   - Never overwrite or discard uncommitted user changes.

2. **Secret Protection**:
   - Never stage or commit `.env`, `.env.local`, credentials, service-account JSON files, private keys (`*.pem`, `*.key`), or other secrets.

3. **Mandatory Quality Checks**:
   - Verify that `npm run lint` and `npx tsc --noEmit` pass with zero errors before committing.

4. **Meaningful Commit Messages**:
   - Always use a descriptive commit message following Conventional Commits format (e.g., `feat: ...`, `fix: ...`, `chore: ...`). Generic messages like "update" or "changes" are prohibited.

5. **Strict Branch & Push Policy**:
   - Execute commits and pushes via `npm run safe-push -- -m "<commit message>"`.
   - Only push to `main` on remote `origin`.
   - NEVER force-push (`--force` or `-f`), rewrite Git history, or push to other branches.

6. **Failure & Conflict Handling**:
   - If any check fails, GitHub authentication fails, or remote branch is diverged/conflicted, STOP immediately and report the issue to the user.
