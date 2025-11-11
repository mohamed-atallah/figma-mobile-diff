/**
 * TypeScript interfaces for configuration system
 */
export interface ProjectConfig {
    name: string;
    environment: string;
}
export interface EnvironmentConfig {
    baseUrl: string;
    apiUrl?: string;
}
export interface ViewportConfig {
    width: number;
    height: number;
}
export interface PageConfig {
    name: string;
    url: string;
    designImage?: string;
    viewport?: ViewportConfig;
    waitForSelector?: string;
    waitForTimeout?: number;
    skipAuth?: boolean;
}
export interface AuthenticationConfig {
    method: 'phone' | 'email' | 'username' | 'none';
    loginUrl: string;
    otpRequired: boolean;
    otpUrl?: string;
    dashboardUrl?: string;
    logoutUrl?: string;
}
export interface TestingConfig {
    threshold: number;
    pixelmatchThreshold: number;
    captureScreenshotOnFailure: boolean;
    retries: number;
    timeout?: number;
}
export interface TestConfig {
    project: ProjectConfig;
    environments: Record<string, EnvironmentConfig>;
    authentication: AuthenticationConfig;
    pages: PageConfig[];
    testing: TestingConfig;
}
export interface LoginSelector {
    input: string;
    submitButton: string;
}
export interface EmailLoginSelector extends LoginSelector {
    emailInput: string;
    passwordInput: string;
}
export interface PhoneLoginSelector extends LoginSelector {
    phoneInput: string;
}
export interface UsernameLoginSelector extends LoginSelector {
    usernameInput: string;
    passwordInput: string;
}
export interface OTPSelector {
    inputs: string;
    submitButton: string;
}
export interface SelectorsConfig {
    login: {
        phone?: PhoneLoginSelector;
        email?: EmailLoginSelector;
        username?: UsernameLoginSelector;
    };
    otp?: OTPSelector;
    [key: string]: any;
}
export interface Credentials {
    identifier: string;
    password?: string;
    otp?: string;
}
