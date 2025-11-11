# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Visual Regression Testing Framework** - A dynamic, configuration-driven framework for automated visual regression testing using Playwright. The framework compares live web pages against Figma design images through simple JSON configuration - no code changes required for new projects.

### Key Design Principles

1. **Configuration Over Code** - All project-specific details in JSON config files
2. **Reusable Core** - Authentication, navigation, and comparison logic work for any project
3. **Multi-Auth Support** - Phone, Email, Username, or No Authentication
4. **Multi-Environment** - Staging, Production, Local, or custom environments
5. **Zero Setup Friction** - Interactive wizard creates all config files

## Common Commands

### Setup & Configuration
```bash
# Run interactive setup wizard (creates all config files)
npm run setup

# Validate selectors against live pages
npm run validate-selectors

# Install dependencies
npm install
npx playwright install
```

### Testing
```bash
# Run tests (default environment from config)
npm test

# Run specific environment
npm run test:staging
npm run test:production
npm run test:local

# Debug mode
npm run test:headed     # See browser
npm run test:ui         # Playwright UI mode
npm run test:debug      # Debug mode
```

### Maintenance
```bash
# View test reports
npm run report

# Clean generated files (screenshots, reports, auth)
npm run clean
```

## Architecture

### Configuration System (`config/`)

**`config/types.ts`** - TypeScript interfaces for all configurations
- `TestConfig` - Main test configuration structure
- `SelectorsConfig` - Selector mappings for different auth methods
- `PageConfig`, `AuthenticationConfig`, etc.

**`config/config-loader.ts`** - Configuration loader with validation
- `loadTestConfig()` - Loads and validates test.config.json
- `loadSelectorsConfig()` - Loads selectors.json
- `getCredentials()` - Gets credentials from .env
- `getCurrentEnvironment()` - Resolves active environment

### Core Modules (`core/`)

**Authentication (`core/auth/`)**
- `base-auth.ts` - Common auth functions (save/load/validate state)
- `phone-auth.ts` - Phone number authentication
- `email-auth.ts` - Email + password authentication
- `username-auth.ts` - Username + password authentication
- `otp-handler.ts` - OTP verification (single or multiple inputs)
- `auth-manager.ts` - Orchestrates auth flow based on config

**Navigation (`core/navigation/`)**
- `page-navigator.ts` - Dynamic page navigation
  - Viewport management (from config or design image dimensions)
  - Wait strategies (selector, timeout, networkidle)
  - Screenshot path generation

**Comparison (`core/comparison/`)**
- `image-compare.ts` - Pixel-by-pixel comparison using pixelmatch
  - Image caching for performance
  - Dimension mismatch handling (auto-resize with padding)
  - Side-by-side comparison generation
- `report-generator.ts` - Detailed analysis and reporting
  - 9-zone region analysis
  - Issue categorization (layout, size, color, spacing, element)
  - Severity levels (critical, high, medium, low)

### Test Suite (`tests/`)

**`tests/visual-regression.spec.ts`** - Main dynamic test suite
- Loads configuration at runtime
- Generates tests for each configured page
- Handles authentication automatically
- Creates screenshots, diffs, and reports
- Skips pages without design images

### Global Setup (`global-setup.ts`)

- Runs once before all tests
- Checks for valid auth state (24-hour expiration)
- Performs login if needed (based on auth method from config)
- Saves cookies/session for test reuse
- Skips if `authentication.method = "none"`

### Scripts (`scripts/`)

**`scripts/setup-wizard.ts`** - Interactive setup wizard
- Guides through project configuration
- Creates test.config.json, selectors.json, .env
- Recommends design images to export

**`scripts/validate-selectors.ts`** - Selector validation tool
- Opens browser to test selectors on live pages
- Interactive validation (prompts for manual navigation to OTP)
- Reports missing or invalid selectors

## Configuration Files

### Main Configuration (`config/test.config.json`)

```json
{
  "project": {
    "name": "Project Name",
    "environment": "staging"
  },
  "environments": {
    "staging": { "baseUrl": "https://staging.example.com" },
    "production": { "baseUrl": "https://example.com" }
  },
  "authentication": {
    "method": "email",  // phone, email, username, none
    "loginUrl": "/auth/login",
    "otpRequired": false,
    "dashboardUrl": "/dashboard"
  },
  "pages": [
    {
      "name": "login",
      "url": "/auth/login",
      "designImage": "login-design.png",
      "viewport": { "width": 1920, "height": 1080 },
      "waitForSelector": "input[type='email']",
      "skipAuth": true
    }
  ],
  "testing": {
    "threshold": 0.05,
    "pixelmatchThreshold": 0.1,
    "captureScreenshotOnFailure": true,
    "retries": 2
  }
}
```

### Selectors Configuration (`config/selectors.json`)

```json
{
  "login": {
    "phone": {
      "phoneInput": "input[type='tel']",
      "submitButton": "button[type='submit']"
    },
    "email": {
      "emailInput": "input[type='email']",
      "passwordInput": "input[type='password']",
      "submitButton": "button[type='submit']"
    }
  },
  "otp": {
    "inputs": "input[type='number']",
    "submitButton": "button[type='submit']"
  }
}
```

### Environment Variables (`.env`)

```bash
PROJECT_CONFIG=config/test.config.json
SELECTORS_CONFIG=config/selectors.json
TEST_ENVIRONMENT=staging
AUTH_METHOD=email
LOGIN_IDENTIFIER=user@example.com
LOGIN_PASSWORD=password123
LOGIN_OTP=123456
HEADLESS=true
```

## Adding New Projects

To adapt this framework for a new project:

1. **Run setup wizard**: `npm run setup`
2. **Update .env** with real credentials
3. **Export design images** from Figma to `design-images/`
4. **Validate selectors**: `npm run validate-selectors`
5. **Run tests**: `npm test`

**No code changes needed!** Everything is configuration-driven.

## Authentication Flows

### Phone-based
1. Navigate to login page
2. Fill phone number
3. Submit form
4. Handle OTP (if required)
5. Save auth state

### Email/Username-based
1. Navigate to login page
2. Fill email/username + password
3. Submit form
4. Handle OTP (if required)
5. Save auth state

### No Authentication
Skips authentication entirely, tests public pages directly.

## Important Patterns

### Adding New Pages
Just update `config/test.config.json`:
```json
"pages": [
  {
    "name": "newpage",
    "url": "/newpage",
    "designImage": "newpage-design.png",
    "waitForSelector": ".page-loaded"
  }
]
```

### Custom Selectors
Update `config/selectors.json` with app-specific selectors.

### Multiple Environments
Add to `config/test.config.json`:
```json
"environments": {
  "qa": { "baseUrl": "https://qa.example.com" }
}
```
Run with: `TEST_ENVIRONMENT=qa npm test`

### Dynamic Viewport
- Auto-detected from design image dimensions
- Or explicitly set in page config
- Or falls back to default 1512x982

## File Paths Convention

- **Config**: `config/*.json`
- **Design images**: `design-images/{name}-design.png`
- **Screenshots**: `screenshots/{name}-actual.png`
- **Diff images**: `screenshots/{name}-diff.png`
- **Comparisons**: `screenshots/{name}-comparison.png`
- **Reports**: `reports/{name}-report.txt`
- **Auth state**: `auth/storageState.json` (auto-generated)

## Key Utilities

### Config Loader
```typescript
import { loadTestConfig, loadSelectorsConfig } from './config/config-loader';
const config = loadTestConfig();
const selectors = loadSelectorsConfig();
```

### Authentication
```typescript
import { completeLoginFlow } from './core/auth/auth-manager';
await completeLoginFlow(page, context, config, selectors, credentials, storagePath);
```

### Page Navigation
```typescript
import { navigateToPage } from './core/navigation/page-navigator';
await navigateToPage(page, pageConfig, baseUrl);
```

### Image Comparison
```typescript
import { compareImages } from './core/comparison/image-compare';
const result = await compareImages(actualPath, expectedPath, diffPath, options);
```

## Examples

See `examples/` directory for complete configurations:
- `phone-auth/` - Phone number with OTP
- `email-auth/` - Email + password
- `no-auth/` - Public pages only

## Troubleshooting

### Setup Issues
- Run `npm run setup` to create config files
- Ensure `.env` has correct credentials
- Check `config/test.config.json` paths

### Selector Issues
- Run `npm run validate-selectors`
- Update `config/selectors.json`
- Check browser console in headed mode

### Auth Issues
- Clear saved state: `npm run clean`
- Run in headed mode: `npm run test:headed`
- Verify credentials in `.env`

### Visual Test Failures
- Review diff images in `screenshots/`
- Read detailed reports in `reports/`
- Adjust threshold in `config/test.config.json`

## Performance Notes

- **Image caching** - Images read once and cached in memory
- **Auth state reuse** - Login once, reuse for 24 hours
- **Parallel execution** - Tests run in parallel (4 workers default)
- **Region analysis** - Single-pass iteration through diff pixels

## Migration from Old Projects

1. Delete old project-specific files
2. Run `npm run setup`
3. Answer wizard prompts
4. Copy design images
5. Update credentials
6. Run tests

The framework is now fully reusable across any UI project!
