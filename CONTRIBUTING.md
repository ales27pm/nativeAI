# 🤝 Contributing to ARIA

Welcome to the ARIA project! We're excited that you're interested in contributing to this advanced AI-powered mobile assistant. This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Contributing Guidelines](#-contributing-guidelines)
- [Code Style](#-code-style)
- [Testing](#-testing)
- [Pull Request Process](#-pull-request-process)
- [Issue Reporting](#-issue-reporting)
- [Community Guidelines](#-community-guidelines)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.19.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Expo CLI** (`npm install -g @expo/cli`)
- **iOS Simulator** (for iOS development)
- **Android Studio** (for Android development)

### Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/nativeAI.git
   cd nativeAI
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

5. **Start development server**
   ```bash
   npm start
   ```

## 🛠️ Development Setup

### Environment Configuration

Create a `.env` file with the following variables:

```env
# AI API Keys (Required for full functionality)
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=your_anthropic_key
EXPO_PUBLIC_VIBECODE_GROK_API_KEY=your_grok_key

# Optional APIs
EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY=your_google_key
EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY=your_elevenlabs_key
```

### Project Structure

```
src/
├── api/                    # AI and native integrations
│   ├── advanced-reasoning.ts
│   ├── vision-system.ts
│   ├── audio-system.ts
│   ├── sensor-manager.ts
│   ├── context-engine.ts
│   └── autonomous-system.ts
├── components/             # Reusable UI components
├── navigation/             # Navigation configuration
├── screens/               # Main app screens
├── state/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

### Available Scripts

```bash
# Development
npm start                   # Start Expo development server
npm run ios                 # Run on iOS simulator
npm run android            # Run on Android emulator

# Testing
npm test                   # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript compiler
npm run format             # Format code with Prettier

# Building
npm run prebuild:ios       # Prebuild for iOS
npm run prebuild:android   # Prebuild for Android
```

## 📝 Contributing Guidelines

### 🎯 What We're Looking For

We welcome contributions in the following areas:

- **🧠 AI Integration**: Improvements to multi-LLM reasoning, vision, and audio processing
- **📱 Native Features**: Enhanced sensor integration, camera functionality, and iOS-specific features
- **🎨 UI/UX**: Better user interface and user experience improvements
- **🧪 Testing**: Additional test coverage and testing utilities
- **📚 Documentation**: Improved documentation, tutorials, and examples
- **🐛 Bug Fixes**: Fixes for existing issues and edge cases
- **⚡ Performance**: Optimizations and performance improvements

### 🎨 Code Style

We use ESLint and Prettier for code formatting. Please ensure your code follows our style guidelines:

```bash
# Check and fix linting issues
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

#### Code Style Guidelines

- Use **TypeScript** for all new code
- Follow **React Native best practices**
- Use **functional components** with hooks
- Implement proper **error handling**
- Add **JSDoc comments** for complex functions
- Use **meaningful variable and function names**

#### React Native Specific Guidelines

- Use `Pressable` instead of `TouchableOpacity`
- Use `react-native-reanimated` for animations
- Use `@react-navigation/native-stack` for navigation
- Implement proper safe area handling
- Follow iOS Human Interface Guidelines

### 🧪 Testing

We maintain high test coverage. Please include tests for new features:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Testing Guidelines

- Write **unit tests** for utility functions and API integrations
- Write **component tests** for React components
- Write **integration tests** for complex features
- Mock external dependencies (AI APIs, sensors, etc.)
- Aim for **80%+ test coverage**

#### Test Structure

```typescript
// Example test structure
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should perform expected behavior', () => {
    // Test implementation
  });

  it('should handle error cases', () => {
    // Error handling tests
  });
});
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run test:ci
   npm run lint
   npm run typecheck
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

### Commit Message Convention

We follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Submitting Your PR

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request**
   - Use the provided PR template
   - Provide clear description of changes
   - Link related issues
   - Add screenshots for UI changes

3. **Address Review Feedback**
   - Respond to reviewer comments
   - Make requested changes
   - Update tests as needed

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** for solutions
3. **Test with the latest version**

### Creating a Bug Report

Use our bug report template and include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (device, OS, versions)
- **Error logs** and screenshots
- **AI configuration** being used

### Feature Requests

Use our feature request template and include:

- **Problem statement** you're trying to solve
- **Proposed solution** with details
- **Alternative solutions** considered
- **AI integration** requirements
- **Platform support** needs

## 👥 Community Guidelines

### Code of Conduct

We follow a Code of Conduct to ensure a welcoming environment for all contributors:

- **Be respectful** and inclusive
- **Be collaborative** and constructive
- **Be patient** with newcomers
- **Be open** to feedback and different perspectives

### Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** and discussions
3. **Join our community discussions**
4. **Ask questions** in issues or discussions

### Recognition

We recognize all contributors:

- Contributors are listed in our README
- Significant contributions are highlighted in releases
- Active contributors may be invited as maintainers

## 🚀 Advanced Contributions

### AI Model Integration

When working with AI features:

- Test with multiple models (OpenAI, Anthropic, Grok)
- Handle API errors gracefully
- Implement proper rate limiting
- Consider privacy implications
- Document model-specific behaviors

### Native Module Development

For native iOS features:

- Follow React Native New Architecture guidelines
- Use TypeScript for type safety
- Implement proper error handling
- Test on multiple iOS versions
- Document native dependencies

### Performance Optimization

When optimizing performance:

- Profile before and after changes
- Consider memory usage
- Test on low-end devices
- Optimize bundle size
- Document performance impacts

## 📞 Contact

- **GitHub Issues**: [Report bugs and request features](https://github.com/ales27pm/nativeAI/issues)
- **GitHub Discussions**: [Community discussions](https://github.com/ales27pm/nativeAI/discussions)
- **Documentation**: [Project Wiki](https://github.com/ales27pm/nativeAI/wiki)

Thank you for contributing to ARIA! 🙏

---

**Happy coding!** 🚀