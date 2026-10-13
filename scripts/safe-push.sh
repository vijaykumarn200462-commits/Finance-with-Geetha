#!/usr/bin/env bash
# ==============================================================================
# safe-push.sh - Safe GitHub Commit & Push Workflow for Finance with Geetha
# ==============================================================================
# Enforces:
#  1. Only pushes to branch 'main' on remote 'origin'
#  2. Never force-pushes or rewrites history
#  3. Secret scanning: never commits .env, credentials, service-account JSON, keys
#  4. Runs project validation checks (lint, typescript compile check)
#  5. Verifies remote synchronization (stops on divergence/conflicts)
#  6. Requires a meaningful commit message (rejects generic placeholders)
#  7. Non-destructive: preserves existing uncommitted user changes
# ==============================================================================

set -euo pipefail

TARGET_BRANCH="main"
TARGET_REMOTE="origin"
DRY_RUN=false
CHECK_ONLY=false
COMMIT_MSG=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

print_usage() {
  cat << EOF
Usage: $(basename "$0") [OPTIONS] [COMMIT_MESSAGE]

Options:
  -m, --message <msg>   Specify commit message
  -d, --dry-run         Perform all checks, dry-run commit/push verification
  -c, --check           Run pre-flight validation checks only without committing
  -h, --help            Show this help message

Examples:
  ./scripts/safe-push.sh -m "feat(auth): add session expiration handling"
  ./scripts/safe-push.sh --dry-run -m "fix(cms): correct page visibility filter"
  ./scripts/safe-push.sh --check
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      COMMIT_MSG="$2"
      shift 2
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -c|--check)
      CHECK_ONLY=true
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      if [[ -z "$COMMIT_MSG" ]]; then
        COMMIT_MSG="$1"
      else
        log_error "Unexpected argument: $1"
        print_usage
        exit 1
      fi
      shift
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  log_error "Not inside a git repository."
  exit 1
fi
cd "$REPO_ROOT"

log_info "Running safe-push validation workflow..."

# 1. Verify Current Branch
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  log_error "Safety Guard: Current branch is '$CURRENT_BRANCH'. Pushing is restricted strictly to '$TARGET_BRANCH'."
  log_error "Never push directly to a different branch. Switch to '$TARGET_BRANCH' or merge safely."
  exit 1
fi
log_success "Branch check passed: On '$TARGET_BRANCH'."

# 2. Check for In-Progress Git Operations (Merge, Rebase, Cherry-Pick)
if [[ -f ".git/MERGE_HEAD" ]] || [[ -d ".git/rebase-merge" ]] || [[ -d ".git/rebase-apply" ]] || [[ -f ".git/CHERRY_PICK_HEAD" ]]; then
  log_error "Git operation (merge, rebase, or cherry-pick) is currently in progress."
  log_error "Please resolve any ongoing operations or conflicts before running safe-push."
  exit 1
fi

# 3. Secret Pattern Scanning
SECRET_PATTERNS=(
  "(^|/)\.env(\..+)?$"
  "(^|/).*\.env(\.local)?$"
  ".*service[-_]?account.*\.json$"
  ".*firebase[-_]?adminsdk.*\.json$"
  ".*credentials.*\.json$"
  ".*client[-_]?secret.*\.json$"
  ".*\.(pem|key|p8|p12|crt|cert)$"
  "(^|/)id_rsa(\..+)?$"
  "(^|/)id_ed25519(\..+)?$"
)

is_secret_file() {
  local file="$1"
  # Allow .env.example
  if [[ "$file" == *".env.example"* ]]; then
    return 1
  fi
  for pattern in "${SECRET_PATTERNS[@]}"; do
    if [[ "$file" =~ $pattern ]]; then
      return 0
    fi
  done
  return 1
}

# Scan staged files
STAGED_FILES="$(git diff --cached --name-only)"
if [[ -n "$STAGED_FILES" ]]; then
  while IFS= read -r file; do
    if is_secret_file "$file"; then
      log_error "SECURITY ALERT: Staged file '$file' matches sensitive secret pattern!"
      log_error "Never commit secrets, credentials, or private keys. Aborting."
      exit 1
    fi
  done <<< "$STAGED_FILES"
fi

# Scan modified / untracked files
CHANGED_FILES="$(git status --porcelain | sed 's/^...//')"
if [[ -n "$CHANGED_FILES" ]]; then
  while IFS= read -r file; do
    if is_secret_file "$file"; then
      # If it's untracked and not ignored, alert immediately
      if ! git check-ignore -q "$file" 2>/dev/null; then
        log_error "SECURITY ALERT: Sensitive file '$file' is not ignored by .gitignore!"
        log_error "Please add '$file' to .gitignore and unstage it immediately."
        exit 1
      fi
    fi
  done <<< "$CHANGED_FILES"
fi
log_success "Secret scanning passed: No secrets detected in staged or modified files."

# 4. Review Changes
log_info "Inspecting git status:"
git status -s

if [[ "$CHECK_ONLY" = true ]]; then
  log_info "Running project verification checks..."
  log_info "1/2 Running ESLint (npm run lint)..."
  npm run lint
  log_info "2/2 Running TypeScript type check (npx tsc --noEmit)..."
  npx tsc --noEmit
  log_success "All pre-flight checks passed successfully!"
  exit 0
fi

# 5. Check if working tree has changes to commit
HAS_STAGED_CHANGES=false
HAS_UNSTAGED_CHANGES=false

if [[ -n "$STAGED_FILES" ]]; then
  HAS_STAGED_CHANGES=true
fi

UNSTAGED_FILES="$(git diff --name-only)"
UNTRACKED_FILES="$(git ls-files --others --exclude-standard)"

if [[ -n "$UNSTAGED_FILES" ]] || [[ -n "$UNTRACKED_FILES" ]]; then
  HAS_UNSTAGED_CHANGES=true
fi

# 6. Validate Commit Message
if [[ "$HAS_STAGED_CHANGES" = true ]] || [[ "$HAS_UNSTAGED_CHANGES" = true ]]; then
  if [[ -z "$COMMIT_MSG" ]]; then
    log_error "A meaningful commit message is required when there are changes to commit."
    log_error "Use: ./scripts/safe-push.sh -m \"feat/fix(scope): clear description\""
    exit 1
  fi

  # Check minimum length
  if [[ ${#COMMIT_MSG} -lt 10 ]]; then
    log_error "Commit message is too short (${#COMMIT_MSG} chars). Please provide a descriptive message (>= 10 chars)."
    exit 1
  fi

  # Reject generic / boilerplate messages
  LOWER_MSG="$(echo "$COMMIT_MSG" | tr '[:upper:]' '[:lower:]' | xargs)"
  GENERIC_MSGS=("update" "fix" "fixes" "changes" "wip" "commit" "test" "temp" "asdf" "done" "patch")
  for generic in "${GENERIC_MSGS[@]}"; do
    if [[ "$LOWER_MSG" == "$generic" ]] || [[ "$LOWER_MSG" == "$generic." ]]; then
      log_error "Generic commit message '$COMMIT_MSG' rejected. Please describe the actual change."
      exit 1
    fi
  done
fi

# 7. Quality Checks: Lint and TypeScript compilation
log_info "Running quality verification checks..."
log_info "1/2 Running ESLint (npm run lint)..."
if ! npm run lint; then
  log_error "ESLint check failed. Please fix lint errors before pushing."
  exit 1
fi
log_success "ESLint passed."

log_info "2/2 Running TypeScript compile check (npx tsc --noEmit)..."
if ! npx tsc --noEmit; then
  log_error "TypeScript compilation check failed. Please fix type errors before pushing."
  exit 1
fi
log_success "TypeScript check passed."

# 8. Stage Changes Safely
if [[ "$HAS_STAGED_CHANGES" = false ]] && [[ "$HAS_UNSTAGED_CHANGES" = true ]]; then
  log_info "Staging verified changes..."
  # Stage tracked modifications
  git add -u

  # For untracked files, inspect and stage only non-secret files
  if [[ -n "$UNTRACKED_FILES" ]]; then
    while IFS= read -r file; do
      if ! is_secret_file "$file"; then
        git add "$file"
      fi
    done <<< "$UNTRACKED_FILES"
  fi
fi

# Double check staged secrets after staging
FINAL_STAGED="$(git diff --cached --name-only)"
if [[ -n "$FINAL_STAGED" ]]; then
  while IFS= read -r file; do
    if is_secret_file "$file"; then
      log_error "CRITICAL: Secret file '$file' was staged. Unstaging immediately."
      git reset HEAD "$file"
      exit 1
    fi
  done <<< "$FINAL_STAGED"
fi

# 9. Commit Changes
if [[ -n "$FINAL_STAGED" ]]; then
  log_info "Staged files ready for commit:"
  echo "$FINAL_STAGED" | sed 's/^/  - /'

  if [[ "$DRY_RUN" = true ]]; then
    log_info "[DRY-RUN] Would commit with message: '$COMMIT_MSG'"
    if [[ "$HAS_STAGED_CHANGES" = false ]]; then
      # Reset staging back to original unstaged state so dry-run leaves working tree intact
      git reset HEAD >/dev/null 2>&1 || true
    fi
  else
    git commit -m "$COMMIT_MSG"
    log_success "Committed changes with message: '$COMMIT_MSG'"
  fi
else
  log_info "No changes to commit. Checking remote synchronization..."
fi

# 10. Remote Synchronization & Conflict Check
log_info "Fetching latest changes from $TARGET_REMOTE/$TARGET_BRANCH..."
if ! git fetch "$TARGET_REMOTE" "$TARGET_BRANCH"; then
  log_error "Failed to fetch from $TARGET_REMOTE. Check network connection and credentials."
  exit 1
fi

LOCAL_HASH="$(git rev-parse HEAD)"
REMOTE_HASH="$(git rev-parse "$TARGET_REMOTE/$TARGET_BRANCH")"
BASE_HASH="$(git merge-base HEAD "$TARGET_REMOTE/$TARGET_BRANCH")"

if [[ "$REMOTE_HASH" != "$BASE_HASH" ]]; then
  BEHIND_COUNT="$(git rev-list --count HEAD.."$TARGET_REMOTE/$TARGET_BRANCH")"
  log_error "Remote '$TARGET_REMOTE/$TARGET_BRANCH' has $BEHIND_COUNT new commit(s) not in local branch."
  log_error "Local branch is behind remote. Aborting push to avoid conflicts or out-of-order history."
  log_error "Please pull or rebase safely: git pull --rebase origin main"
  exit 1
fi

AHEAD_COUNT="$(git rev-list --count "$TARGET_REMOTE/$TARGET_BRANCH"..HEAD)"
log_info "Local branch is ahead of remote by $AHEAD_COUNT commit(s)."

# 11. GitHub Push Verification & Execution
if [[ "$AHEAD_COUNT" -gt 0 ]] || [[ "$DRY_RUN" = true ]]; then
  log_info "Verifying push permissions with dry-run..."
  if ! git push --dry-run "$TARGET_REMOTE" "$TARGET_BRANCH"; then
    log_error "Dry-run push failed! Authentication or permission issue encountered."
    exit 1
  fi
  log_success "Dry-run push verified successfully."

  if [[ "$DRY_RUN" = true ]]; then
    log_info "[DRY-RUN] Push dry-run succeeded. Skipping actual push."
  else
    log_info "Executing safe push to $TARGET_REMOTE $TARGET_BRANCH..."
    # STRICT: Never allow force push or history rewrite
    git push "$TARGET_REMOTE" "$TARGET_BRANCH"
    log_success "Successfully pushed to $TARGET_REMOTE/$TARGET_BRANCH!"
  fi
else
  log_success "Repository is already fully synchronized with $TARGET_REMOTE/$TARGET_BRANCH."
fi

log_success "Safe-push workflow completed cleanly."
