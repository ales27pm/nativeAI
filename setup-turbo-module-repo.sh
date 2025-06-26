#!/bin/bash

# Setup script for React Native Device Info Turbo Module repository
# This script will help you create a GitHub repository and set up the project

set -e  # Exit on any error

echo "🚀 React Native Device Info Turbo Module Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI is not installed. You'll need to create the repository manually."
        echo "Install GitHub CLI from: https://cli.github.com/"
        GITHUB_CLI_AVAILABLE=false
    else
        GITHUB_CLI_AVAILABLE=true
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v yarn &> /dev/null; then
        print_warning "Yarn is not installed. Installing packages with npm instead."
        PACKAGE_MANAGER="npm"
    else
        PACKAGE_MANAGER="yarn"
    fi
    
    print_status "Dependencies checked"
}

# Get user input for repository configuration
get_user_input() {
    echo
    print_info "Repository Configuration"
    echo "========================"
    
    read -p "📦 Repository name (default: react-native-device-info-turbo): " REPO_NAME
    REPO_NAME=${REPO_NAME:-react-native-device-info-turbo}
    
    read -p "📝 Repository description (default: Advanced device information Turbo Module for React Native): " REPO_DESCRIPTION
    REPO_DESCRIPTION=${REPO_DESCRIPTION:-"Advanced device information Turbo Module for React Native"}
    
    read -p "👤 Your name (for package.json author): " AUTHOR_NAME
    read -p "📧 Your email (for package.json author): " AUTHOR_EMAIL
    
    if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
        read -p "🔓 Make repository public? (y/n, default: y): " MAKE_PUBLIC
        MAKE_PUBLIC=${MAKE_PUBLIC:-y}
    fi
    
    print_status "Configuration collected"
}

# Create the repository structure
setup_repository() {
    print_info "Setting up repository structure..."
    
    # Create main directory
    mkdir -p "$REPO_NAME"
    cd "$REPO_NAME"
    
    # Initialize git repository
    git init
    print_status "Git repository initialized"
    
    # Copy Turbo Module files
    cp -r ../turbo-modules/* .
    cp -r ../.github .
    
    # Update package.json with user information
    if [ -f "package.json" ]; then
        # Use node to update package.json
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.name = '$REPO_NAME';
        pkg.description = '$REPO_DESCRIPTION';
        pkg.author = '$AUTHOR_NAME <$AUTHOR_EMAIL>';
        pkg.repository.url = 'git+https://github.com/$GITHUB_USERNAME/$REPO_NAME.git';
        pkg.bugs.url = 'https://github.com/$GITHUB_USERNAME/$REPO_NAME/issues';
        pkg.homepage = 'https://github.com/$GITHUB_USERNAME/$REPO_NAME#readme';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        print_status "Package.json updated"
    fi
    
    # Create README
    cp ../turbo-modules/README.md ./README.md
    print_status "README created"
    
    # Create other necessary files
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
lib/
build/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.temp

# Coverage reports
coverage/

# Example app
example/node_modules/
example/ios/build/
example/android/build/
example/android/.gradle/

# iOS
ios/build/
*.xcworkspace/xcuserdata/
*.xcodeproj/xcuserdata/
DerivedData/

# CocoaPods
Pods/
*.podspec.json

# Carthage
Carthage/Build/

# React Native
*.jsbundle
*.bundle

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
EOF

    cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2024 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

    print_status "Project files created"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn install
    else
        npm install
    fi
    
    print_status "Dependencies installed"
}

# Create GitHub repository
create_github_repo() {
    if [ "$GITHUB_CLI_AVAILABLE" = true ]; then
        print_info "Creating GitHub repository..."
        
        # Check if user is logged in to GitHub CLI
        if ! gh auth status &> /dev/null; then
            print_warning "You need to authenticate with GitHub CLI first."
            echo "Run: gh auth login"
            return 1
        fi
        
        # Get GitHub username
        GITHUB_USERNAME=$(gh api user --jq .login)
        
        # Create repository
        if [ "$MAKE_PUBLIC" = "y" ] || [ "$MAKE_PUBLIC" = "Y" ]; then
            gh repo create "$REPO_NAME" --description "$REPO_DESCRIPTION" --public
        else
            gh repo create "$REPO_NAME" --description "$REPO_DESCRIPTION" --private
        fi
        
        print_status "GitHub repository created"
        
        # Add remote origin
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        print_status "Remote origin added"
        
    else
        print_warning "GitHub CLI not available. Please create the repository manually:"
        echo "1. Go to https://github.com/new"
        echo "2. Repository name: $REPO_NAME"
        echo "3. Description: $REPO_DESCRIPTION"
        echo "4. After creating, run:"
        echo "   git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
    fi
}

# Create initial commit and push
initial_commit() {
    print_info "Creating initial commit..."
    
    git add .
    git commit -m "🚀 Initial commit: React Native Device Info Turbo Module

✨ Features:
- Complete Turbo Module implementation with Swift
- Comprehensive device information access
- Biometric authentication (Face ID/Touch ID)
- Location services integration
- Battery and storage monitoring
- Haptic feedback support
- System services integration
- Type-safe TypeScript definitions
- GitHub Actions CI/CD pipeline

🏗️ Architecture:
- React Native New Architecture compliance
- JSI direct communication
- Lazy loading support
- Synchronous and asynchronous operations
- CocoaPods integration ready

📱 iOS Integration:
- Swift native implementation
- Objective-C++ bridge
- Core Location integration
- Local Authentication framework
- System services access
- Comprehensive error handling"

    print_status "Initial commit created"
    
    # Set main branch
    git branch -M main
    
    if [ "$GITHUB_CLI_AVAILABLE" = true ] && git remote get-url origin &> /dev/null; then
        print_info "Pushing to GitHub..."
        git push -u origin main
        print_status "Code pushed to GitHub"
        
        # Trigger GitHub Actions
        print_info "GitHub Actions will automatically start running..."
        echo "You can view the workflow at: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
    else
        print_warning "Remote origin not set. Push manually after setting up the remote:"
        echo "git push -u origin main"
    fi
}

# Setup npm publishing (optional)
setup_npm_publishing() {
    echo
    read -p "🔧 Set up npm publishing? (y/n, default: n): " SETUP_NPM
    SETUP_NPM=${SETUP_NPM:-n}
    
    if [ "$SETUP_NPM" = "y" ] || [ "$SETUP_NPM" = "Y" ]; then
        print_info "NPM Publishing Setup"
        echo "===================="
        echo "To enable automatic NPM publishing:"
        echo "1. Get your NPM token from https://www.npmjs.com/settings/tokens"
        echo "2. Add it as a GitHub secret named NPM_TOKEN"
        echo "3. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/secrets/actions"
        echo "4. Click 'New repository secret'"
        echo "5. Name: NPM_TOKEN"
        echo "6. Value: your npm token"
        echo
        echo "The CI pipeline will automatically publish to NPM when you push to main with a version change."
    fi
}

# Print success message and next steps
print_success() {
    echo
    echo "🎉 Setup Complete!"
    echo "=================="
    print_status "Turbo Module repository created successfully!"
    echo
    print_info "Next Steps:"
    echo "1. 📝 Customize the README.md with your specific information"
    echo "2. 🔧 Update package.json with your npm package name if different"
    echo "3. 📱 Test the iOS implementation in your React Native app"
    echo "4. 🧪 Run the test suite: $PACKAGE_MANAGER test"
    echo "5. 🚀 When ready, publish to npm: $PACKAGE_MANAGER publish"
    echo
    if [ "$GITHUB_CLI_AVAILABLE" = true ] && git remote get-url origin &> /dev/null; then
        echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo "📊 GitHub Actions: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
    fi
    echo
    print_info "Development Commands:"
    echo "- Build: $PACKAGE_MANAGER prepare"
    echo "- Test: $PACKAGE_MANAGER test"
    echo "- Lint: $PACKAGE_MANAGER lint"
    echo "- Type check: $PACKAGE_MANAGER typescript"
    echo
    print_status "Happy coding! 🚀"
}

# Main execution
main() {
    check_dependencies
    get_user_input
    setup_repository
    install_dependencies
    create_github_repo
    initial_commit
    setup_npm_publishing
    print_success
}

# Run the main function
main "$@"