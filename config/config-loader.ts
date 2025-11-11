/**
 * Configuration loader for the visual regression testing framework
 * Loads and validates test configuration and selectors
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestConfig, SelectorsConfig, Credentials } from './types';

/**
 * Load test configuration from JSON file
 */
export function loadTestConfig(configPath?: string): TestConfig {
  const defaultPath = path.join(process.cwd(), 'config', 'test.config.json');
  const filePath = configPath || process.env.PROJECT_CONFIG || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Configuration file not found: ${filePath}\n` +
      `Please create a config file or run 'npm run setup' to create one.`
    );
  }

  try {
    const configContent = fs.readFileSync(filePath, 'utf-8');
    const config: TestConfig = JSON.parse(configContent);

    // Validate required fields
    validateConfig(config);

    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load selectors configuration from JSON file
 */
export function loadSelectorsConfig(selectorsPath?: string): SelectorsConfig {
  const defaultPath = path.join(process.cwd(), 'config', 'selectors.json');
  const filePath = selectorsPath || process.env.SELECTORS_CONFIG || defaultPath;

  if (!fs.existsSync(filePath)) {
    console.warn(`Selectors file not found: ${filePath}. Using default selectors.`);
    return getDefaultSelectors();
  }

  try {
    const selectorsContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(selectorsContent);
  } catch (error) {
    console.warn(`Failed to load selectors: ${error instanceof Error ? error.message : String(error)}. Using defaults.`);
    return getDefaultSelectors();
  }
}

/**
 * Get credentials from environment variables
 */
export function getCredentials(): Credentials {
  const authMethod = process.env.AUTH_METHOD || 'email';

  const credentials: Credentials = {
    identifier: process.env.LOGIN_IDENTIFIER || '',
  };

  if (authMethod !== 'none') {
    if (!credentials.identifier) {
      throw new Error(
        'LOGIN_IDENTIFIER must be set in .env file\n' +
        'Set your email, phone, or username depending on auth method.'
      );
    }

    // Password is optional (e.g., for phone-only auth)
    if (process.env.LOGIN_PASSWORD) {
      credentials.password = process.env.LOGIN_PASSWORD;
    }

    // OTP is optional
    if (process.env.LOGIN_OTP) {
      credentials.otp = process.env.LOGIN_OTP;
    }
  }

  return credentials;
}

/**
 * Get current environment from config
 */
export function getCurrentEnvironment(config: TestConfig) {
  const envName = process.env.TEST_ENVIRONMENT || config.project.environment;
  const environment = config.environments[envName];

  if (!environment) {
    throw new Error(
      `Environment '${envName}' not found in configuration.\n` +
      `Available environments: ${Object.keys(config.environments).join(', ')}`
    );
  }

  return {
    name: envName,
    config: environment,
  };
}

/**
 * Validate configuration structure
 */
function validateConfig(config: TestConfig): void {
  if (!config.project || !config.project.name) {
    throw new Error('Configuration must include project.name');
  }

  if (!config.environments || Object.keys(config.environments).length === 0) {
    throw new Error('Configuration must include at least one environment');
  }

  if (!config.authentication || !config.authentication.method) {
    throw new Error('Configuration must include authentication.method');
  }

  if (!config.pages || config.pages.length === 0) {
    throw new Error('Configuration must include at least one page to test');
  }

  if (!config.testing) {
    throw new Error('Configuration must include testing settings');
  }
}

/**
 * Get default selectors if no config file exists
 */
function getDefaultSelectors(): SelectorsConfig {
  return {
    login: {
      email: {
        emailInput: 'input[type="email"]',
        passwordInput: 'input[type="password"]',
        submitButton: 'button[type="submit"]',
        input: 'input[type="email"]',
      },
      phone: {
        phoneInput: 'input[type="tel"]',
        submitButton: 'button[type="submit"]',
        input: 'input[type="tel"]',
      },
      username: {
        usernameInput: 'input[name="username"]',
        passwordInput: 'input[type="password"]',
        submitButton: 'button[type="submit"]',
        input: 'input[name="username"]',
      },
    },
    otp: {
      inputs: 'input[type="number"]',
      submitButton: 'button[type="submit"]',
    },
  };
}

/**
 * Get authentication method from environment or config
 */
export function getAuthMethod(config: TestConfig): 'phone' | 'email' | 'username' | 'none' {
  return (process.env.AUTH_METHOD as any) || config.authentication.method;
}
