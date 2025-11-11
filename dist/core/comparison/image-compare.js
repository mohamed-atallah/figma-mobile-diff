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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedImage = getCachedImage;
exports.clearImageCache = clearImageCache;
exports.compareImages = compareImages;
exports.getImageDimensions = getImageDimensions;
exports.generateSideBySideComparison = generateSideBySideComparison;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pngjs_1 = require("pngjs");
const pixelmatch_1 = __importDefault(require("pixelmatch"));
// Cache for PNG images to avoid re-reading from disk
const imageCache = new Map();
/**
 * Get cached PNG image or read from disk and cache it
 */
function getCachedImage(imagePath) {
    if (imageCache.has(imagePath)) {
        return imageCache.get(imagePath);
    }
    const img = pngjs_1.PNG.sync.read(fs.readFileSync(imagePath));
    imageCache.set(imagePath, img);
    return img;
}
/**
 * Clear image cache (useful for testing or memory management)
 */
function clearImageCache() {
    imageCache.clear();
}
/**
 * Compare two images and generate a diff image
 * @param actualImagePath Path to the screenshot from the live page
 * @param expectedImagePath Path to the Figma design image
 * @param diffImagePath Path where the diff image will be saved
 * @param options Comparison options
 * @returns Comparison result with statistics
 */
async function compareImages(actualImagePath, expectedImagePath, diffImagePath, options = {}) {
    const { threshold = 0.1, pixelmatchThreshold = 0.1, diffColor = [255, 0, 0], // Red by default
     } = options;
    // Read images (use cache to avoid re-reading)
    const actual = getCachedImage(actualImagePath);
    const expected = getCachedImage(expectedImagePath);
    // Check if dimensions match
    if (actual.width !== expected.width || actual.height !== expected.height) {
        console.warn(`Image dimensions don't match. Actual: ${actual.width}x${actual.height}, Expected: ${expected.width}x${expected.height}`);
        // Resize the smaller image to match the larger one
        const maxWidth = Math.max(actual.width, expected.width);
        const maxHeight = Math.max(actual.height, expected.height);
        const resizedActual = resizeImage(actual, maxWidth, maxHeight);
        const resizedExpected = resizeImage(expected, maxWidth, maxHeight);
        return compareResizedImages(resizedActual, resizedExpected, diffImagePath, threshold, pixelmatchThreshold, diffColor);
    }
    // Create diff image
    const diff = new pngjs_1.PNG({ width: actual.width, height: actual.height });
    // Perform pixel-by-pixel comparison
    const mismatchedPixels = (0, pixelmatch_1.default)(actual.data, expected.data, diff.data, actual.width, actual.height, {
        threshold: pixelmatchThreshold,
        diffColor: diffColor,
        diffColorAlt: [255, 255, 0], // Yellow for anti-aliasing differences
    });
    // Save diff image
    const diffDir = path.dirname(diffImagePath);
    if (!fs.existsSync(diffDir)) {
        fs.mkdirSync(diffDir, { recursive: true });
    }
    fs.writeFileSync(diffImagePath, pngjs_1.PNG.sync.write(diff));
    // Calculate statistics
    const totalPixels = actual.width * actual.height;
    const diffPercentage = (mismatchedPixels / totalPixels) * 100;
    const passed = diffPercentage <= threshold * 100;
    return {
        mismatchedPixels,
        totalPixels,
        diffPercentage,
        diffImagePath,
        passed,
    };
}
/**
 * Resize image to match target dimensions (adds transparent padding if needed)
 */
function resizeImage(img, targetWidth, targetHeight) {
    const resized = new pngjs_1.PNG({ width: targetWidth, height: targetHeight });
    // Fill with white background
    for (let i = 0; i < resized.data.length; i += 4) {
        resized.data[i] = 255; // R
        resized.data[i + 1] = 255; // G
        resized.data[i + 2] = 255; // B
        resized.data[i + 3] = 255; // A
    }
    // Copy original image data
    for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
            const srcIdx = (img.width * y + x) << 2;
            const dstIdx = (targetWidth * y + x) << 2;
            resized.data[dstIdx] = img.data[srcIdx];
            resized.data[dstIdx + 1] = img.data[srcIdx + 1];
            resized.data[dstIdx + 2] = img.data[srcIdx + 2];
            resized.data[dstIdx + 3] = img.data[srcIdx + 3];
        }
    }
    return resized;
}
/**
 * Compare already resized images
 */
function compareResizedImages(actual, expected, diffImagePath, threshold, pixelmatchThreshold, diffColor) {
    const diff = new pngjs_1.PNG({ width: actual.width, height: actual.height });
    const mismatchedPixels = (0, pixelmatch_1.default)(actual.data, expected.data, diff.data, actual.width, actual.height, {
        threshold: pixelmatchThreshold,
        diffColor: diffColor,
        diffColorAlt: [255, 255, 0],
    });
    const diffDir = path.dirname(diffImagePath);
    if (!fs.existsSync(diffDir)) {
        fs.mkdirSync(diffDir, { recursive: true });
    }
    fs.writeFileSync(diffImagePath, pngjs_1.PNG.sync.write(diff));
    const totalPixels = actual.width * actual.height;
    const diffPercentage = (mismatchedPixels / totalPixels) * 100;
    const passed = diffPercentage <= threshold * 100;
    return {
        mismatchedPixels,
        totalPixels,
        diffPercentage,
        diffImagePath,
        passed,
    };
}
/**
 * Get image dimensions from a PNG file (uses cache)
 */
function getImageDimensions(imagePath) {
    const img = getCachedImage(imagePath);
    return { width: img.width, height: img.height };
}
/**
 * Generate a side-by-side comparison image
 */
function generateSideBySideComparison(actualImagePath, expectedImagePath, outputPath) {
    const actual = getCachedImage(actualImagePath);
    const expected = getCachedImage(expectedImagePath);
    const maxHeight = Math.max(actual.height, expected.height);
    const combined = new pngjs_1.PNG({
        width: actual.width + expected.width + 20, // 20px gap
        height: maxHeight,
    });
    // White background
    combined.data.fill(255);
    // Copy actual image (left)
    for (let y = 0; y < actual.height; y++) {
        for (let x = 0; x < actual.width; x++) {
            const srcIdx = (actual.width * y + x) << 2;
            const dstIdx = (combined.width * y + x) << 2;
            combined.data[dstIdx] = actual.data[srcIdx];
            combined.data[dstIdx + 1] = actual.data[srcIdx + 1];
            combined.data[dstIdx + 2] = actual.data[srcIdx + 2];
            combined.data[dstIdx + 3] = actual.data[srcIdx + 3];
        }
    }
    // Copy expected image (right)
    const offsetX = actual.width + 20;
    for (let y = 0; y < expected.height; y++) {
        for (let x = 0; x < expected.width; x++) {
            const srcIdx = (expected.width * y + x) << 2;
            const dstIdx = (combined.width * y + (x + offsetX)) << 2;
            combined.data[dstIdx] = expected.data[srcIdx];
            combined.data[dstIdx + 1] = expected.data[srcIdx + 1];
            combined.data[dstIdx + 2] = expected.data[srcIdx + 2];
            combined.data[dstIdx + 3] = expected.data[srcIdx + 3];
        }
    }
    fs.writeFileSync(outputPath, pngjs_1.PNG.sync.write(combined));
}
//# sourceMappingURL=image-compare.js.map