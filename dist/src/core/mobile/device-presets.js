"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDevicePresets = loadDevicePresets;
exports.getDevicePreset = getDevicePreset;
exports.getAllDevicePresets = getAllDevicePresets;
exports.getDevicePresetsByPlatform = getDevicePresetsByPlatform;
exports.getSuggestedCropRegions = getSuggestedCropRegions;
exports.findMatchingDeviceByDimensions = findMatchingDeviceByDimensions;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
let cachedPresets = null;
/**
 * Load device presets from configuration file
 */
async function loadDevicePresets() {
    if (cachedPresets) {
        return cachedPresets;
    }
    const configPath = path.join(process.cwd(), 'config', 'device-presets.json');
    try {
        cachedPresets = await fs.readJSON(configPath);
        return cachedPresets;
    }
    catch (error) {
        console.error('Error loading device presets:', error);
        throw new Error('Failed to load device presets configuration');
    }
}
/**
 * Get a specific device preset by ID
 */
async function getDevicePreset(deviceId) {
    const presets = await loadDevicePresets();
    return presets.devices.find((d) => d.id === deviceId) || null;
}
/**
 * Get all available device presets
 */
async function getAllDevicePresets() {
    const presets = await loadDevicePresets();
    return presets.devices;
}
/**
 * Get device presets filtered by platform
 */
async function getDevicePresetsByPlatform(platform) {
    const presets = await loadDevicePresets();
    return presets.devices.filter((d) => d.platform === platform);
}
/**
 * Get suggested crop regions for a device
 */
async function getSuggestedCropRegions(deviceId) {
    const device = await getDevicePreset(deviceId);
    return device?.cropRegions || [];
}
/**
 * Validate if dimensions match a known device preset
 */
async function findMatchingDeviceByDimensions(width, height) {
    const presets = await loadDevicePresets();
    return (presets.devices.find((d) => d.screen.width === width && d.screen.height === height) || null);
}
//# sourceMappingURL=device-presets.js.map