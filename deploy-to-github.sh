#!/bin/bash

# ARIA - GitHub Deployment Script
# Run this script once you have a valid GitHub personal access token

set -e  # Exit on any error

echo "🚀 ARIA - GitHub Repository Deployment"
echo "======================================"

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check if token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN not found in .env file"
    echo "Please add your GitHub personal access token to .env:"
    echo "GITHUB_TOKEN=your_token_here"
    exit 1
fi

echo "📋 Configuration:"
echo "  Username: $GITHUB_USERNAME"
echo "  Repository: $GITHUB_REPOSITORY"
echo "  Token: ${GITHUB_TOKEN:0:8}..."

# Test GitHub authentication
echo ""
echo "🔐 Testing GitHub authentication..."
AUTH_TEST=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if echo "$AUTH_TEST" | grep -q "Bad credentials"; then
    echo "❌ GitHub token authentication failed!"
    echo "Please check your token at: https://github.com/settings/tokens"
    echo "Make sure the token has 'repo' scope enabled."
    exit 1
else
    echo "✅ GitHub authentication successful!"
    USER_LOGIN=$(echo "$AUTH_TEST" | grep -o '"login":"[^"]*"' | cut -d'"' -f4)
    echo "  Authenticated as: $USER_LOGIN"
fi

# Create GitHub repository
echo ""
echo "📦 Creating GitHub repository..."
REPO_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\":\"$GITHUB_REPOSITORY\",
        \"description\":\"ARIA - Advanced Reasoning Intelligence Assistant: Autonomous AI with native iOS integration, multi-LLM reasoning, computer vision, voice processing, and contextual awareness using React Native Turbo Modules\",
        \"private\":false,
        \"has_issues\":true,
        \"has_projects\":true,
        \"has_wiki\":true,
        \"auto_init\":false
    }" \
    https://api.github.com/user/repos)

if echo "$REPO_RESPONSE" | grep -q "already exists"; then
    echo "📝 Repository already exists - continuing with push..."
elif echo "$REPO_RESPONSE" | grep -q "Bad credentials"; then
    echo "❌ Failed to create repository - bad credentials"
    exit 1
elif echo "$REPO_RESPONSE" | grep -q "created_at"; then
    echo "✅ Repository created successfully!"
else
    echo "⚠️ Unexpected response from GitHub:"
    echo "$REPO_RESPONSE"
    echo "Continuing anyway..."
fi

# Add GitHub remote (remove if exists)
echo ""
echo "🔗 Setting up Git remote..."
git remote remove github 2>/dev/null || true
git remote add github "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY.git"

# Ensure we're on main branch
git checkout main 2>/dev/null || git checkout -b main

# Push to GitHub
echo ""
echo "📤 Pushing code to GitHub..."
echo "  Branch: main"
echo "  Remote: github"

git push -u github main --force

echo ""
echo "🎉 SUCCESS! ARIA has been deployed to GitHub!"
echo "🌐 Repository URL: https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY"
echo ""
echo "📊 Repository includes:"
echo "  ✅ Complete ARIA AI Assistant codebase"
echo "  ✅ Multi-LLM reasoning engine"
echo "  ✅ Native iOS sensor integration"
echo "  ✅ Computer vision and audio processing"
echo "  ✅ Autonomous task management"
echo "  ✅ 7 comprehensive app screens"
echo "  ✅ TypeScript definitions and documentation"
echo ""
echo "🔧 Next steps:"
echo "  1. Clone the repository: git clone https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY.git"
echo "  2. Install dependencies: npm install"
echo "  3. Start development: npm start"