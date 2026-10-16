#!/bin/bash
# Helper script for pushing changes to GitHub
# Use this after the initial setup is done
#
# Usage:
#   bash scripts/push-to-github.sh "Your commit message"
#
# The script will NOT store your token. You'll be prompted to enter it
# (or you can use SSH/HTTPS with credential helper instead).

set -e

cd "$(dirname "$0")/.."

COMMIT_MSG="${1:-Auto-update from sandbox}"

# Show status
echo "📋 Current git status:"
git status --short

# Add all changes
git add -A

# Check if there's anything to commit
if git diff --cached --quiet; then
  echo "✅ Nothing to commit — working tree clean."
  exit 0
fi

# Commit
git commit -m "$COMMIT_MSG"
echo "✅ Committed: $COMMIT_MSG"

# Push (remote URL is stored clean — no token)
echo "📤 Pushing to origin/main..."
git push origin main
echo "✅ Push complete!"
