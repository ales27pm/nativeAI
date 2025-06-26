#!/bin/bash

# Quick deployment script for ARIA
# Use this if you have a working GitHub token

echo "🚀 ARIA Quick Deploy to GitHub"
echo "==============================="

# Check if token is provided as argument
if [ -n "$1" ]; then
    GITHUB_TOKEN="$1"
    echo "✅ Using token from command line"
else
    # Try to read from .env
    if [ -f .env ]; then
        source .env
    fi
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "❌ No GitHub token provided!"
        echo "Usage: ./quick-deploy.sh YOUR_GITHUB_TOKEN"
        echo "Or add GITHUB_TOKEN to .env file"
        exit 1
    fi
fi

echo "📋 Deploying with token: ${GITHUB_TOKEN:0:8}..."

# Set variables
GITHUB_USERNAME="ales27pm"
GITHUB_REPOSITORY="nativeAI"

# Test authentication
echo "🔐 Testing authentication..."
CURL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if [ "$CURL_RESPONSE" = "200" ]; then
    echo "✅ Authentication successful!"
else
    echo "❌ Authentication failed (HTTP $CURL_RESPONSE)"
    echo "Please check your token at: https://github.com/settings/tokens"
    exit 1
fi

# Create repository
echo "📦 Creating repository..."
REPO_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{\"name\":\"$GITHUB_REPOSITORY\",\"description\":\"ARIA - Advanced Reasoning Intelligence Assistant\",\"private\":false}" \
    https://api.github.com/user/repos)

if echo "$REPO_RESPONSE" | grep -q "created_at"; then
    echo "✅ Repository created successfully!"
elif echo "$REPO_RESPONSE" | grep -q "already exists"; then
    echo "📝 Repository already exists - continuing..."
else
    echo "⚠️ Unexpected response, continuing anyway..."
fi

# Setup git remote
echo "🔗 Setting up remote..."
git remote remove github 2>/dev/null || true
git remote add github "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY.git"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u github main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! ARIA deployed to GitHub!"
    echo "🌐 https://github.com/$GITHUB_USERNAME/$GITHUB_REPOSITORY"
    echo ""
    echo "📊 Deployed features:"
    echo "  ✅ Advanced AI reasoning (3 LLMs)"
    echo "  ✅ Native iOS sensor integration"
    echo "  ✅ Computer vision and audio processing"
    echo "  ✅ Autonomous task management"
    echo "  ✅ 7 comprehensive app screens"
    echo "  ✅ Complete documentation"
else
    echo "❌ Push failed. Check your token permissions."
    echo "Make sure the token has 'repo' scope enabled."
fi