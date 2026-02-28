#!/bin/bash

# Script to push updates to GitHub
# Usage: ./scripts/push-github.sh "commit message"

TOKEN=$(cat /home/z/my-project/.github-token 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ No GitHub token found in .github-token"
    exit 1
fi

cd /home/z/my-project

# Set remote with token
git remote set-url origin "https://${TOKEN}@github.com/topmuch/qrbag.git"

# Check if there are changes
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No changes to push"
    exit 0
fi

# Get commit message from argument or use default
MESSAGE="${1:-Update: $(date '+%Y-%m-%d %H:%M:%S')}"

# Add, commit and push
git add .
git commit -m "$MESSAGE"
git push

# Remove token from remote URL for security
git remote set-url origin "https://github.com/topmuch/qrbag.git"

echo "✅ Pushed to GitHub: $MESSAGE"
