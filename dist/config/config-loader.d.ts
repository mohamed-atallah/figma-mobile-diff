/**
 * Configuration loader for the visual regression testing framework
 * Loads and validates test configuration and selectors
 */
import { TestConfig, SelectorsConfig, Credentials } from './types';
/**
 * Load test configuration from JSON file
 */
export declare function loadTestConfig(configPath?: string): TestConfig;
/**
 * Load selectors configuration from JSON file
 */
export declare function loadSelectorsConfig(selectorsPath?: string): SelectorsConfig;
/**
 * Get credentials from environment variables
 */
export declare function getCredentials(): Credentials;
/**
 * Get current environment from config
 */
export declare function getCurrentEnvironment(config: TestConfig): {
    name: string;
    config: import("./types").EnvironmentConfig;
};
/**
 * Get authentication method from environment or config
 */
export declare function getAuthMethod(config: TestConfig): 'phone' | 'email' | 'username' | 'none';
