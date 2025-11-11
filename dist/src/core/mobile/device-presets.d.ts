export interface CropRegion {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface DevicePreset {
    id: string;
    name: string;
    platform: 'iOS' | 'Android';
    screen: {
        width: number;
        height: number;
        pixelRatio: number;
    };
    safeAreas: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    cropRegions: CropRegion[];
}
export interface DevicePresetsConfig {
    devices: DevicePreset[];
}
/**
 * Load device presets from configuration file
 */
export declare function loadDevicePresets(): Promise<DevicePresetsConfig>;
/**
 * Get a specific device preset by ID
 */
export declare function getDevicePreset(deviceId: string): Promise<DevicePreset | null>;
/**
 * Get all available device presets
 */
export declare function getAllDevicePresets(): Promise<DevicePreset[]>;
/**
 * Get device presets filtered by platform
 */
export declare function getDevicePresetsByPlatform(platform: 'iOS' | 'Android'): Promise<DevicePreset[]>;
/**
 * Get suggested crop regions for a device
 */
export declare function getSuggestedCropRegions(deviceId: string): Promise<CropRegion[]>;
/**
 * Validate if dimensions match a known device preset
 */
export declare function findMatchingDeviceByDimensions(width: number, height: number): Promise<DevicePreset | null>;
