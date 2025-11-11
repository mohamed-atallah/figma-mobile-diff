import * as fs from 'fs-extra';
import * as path from 'path';

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

let cachedPresets: DevicePresetsConfig | null = null;

/**
 * Load device presets from configuration file
 */
export async function loadDevicePresets(): Promise<DevicePresetsConfig> {
  if (cachedPresets) {
    return cachedPresets;
  }

  const configPath = path.join(process.cwd(), 'config', 'device-presets.json');

  try {
    cachedPresets = await fs.readJSON(configPath);
    return cachedPresets!;
  } catch (error) {
    console.error('Error loading device presets:', error);
    throw new Error('Failed to load device presets configuration');
  }
}

/**
 * Get a specific device preset by ID
 */
export async function getDevicePreset(deviceId: string): Promise<DevicePreset | null> {
  const presets = await loadDevicePresets();
  return presets.devices.find((d) => d.id === deviceId) || null;
}

/**
 * Get all available device presets
 */
export async function getAllDevicePresets(): Promise<DevicePreset[]> {
  const presets = await loadDevicePresets();
  return presets.devices;
}

/**
 * Get device presets filtered by platform
 */
export async function getDevicePresetsByPlatform(
  platform: 'iOS' | 'Android'
): Promise<DevicePreset[]> {
  const presets = await loadDevicePresets();
  return presets.devices.filter((d) => d.platform === platform);
}

/**
 * Get suggested crop regions for a device
 */
export async function getSuggestedCropRegions(deviceId: string): Promise<CropRegion[]> {
  const device = await getDevicePreset(deviceId);
  return device?.cropRegions || [];
}

/**
 * Validate if dimensions match a known device preset
 */
export async function findMatchingDeviceByDimensions(
  width: number,
  height: number
): Promise<DevicePreset | null> {
  const presets = await loadDevicePresets();

  return (
    presets.devices.find(
      (d) => d.screen.width === width && d.screen.height === height
    ) || null
  );
}
