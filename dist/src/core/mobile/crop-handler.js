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
exports.applyCropRegions = applyCropRegions;
exports.extractRegion = extractRegion;
exports.batchApplyCropRegions = batchApplyCropRegions;
exports.createMaskedCopy = createMaskedCopy;
exports.validateCropRegions = validateCropRegions;
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Apply crop regions to an image by masking those areas
 * @param inputPath Path to the input image
 * @param outputPath Path where the cropped image will be saved
 * @param options Crop options including regions to mask
 */
async function applyCropRegions(inputPath, outputPath, options) {
    if (!options.regions || options.regions.length === 0) {
        // No crops to apply, just copy the file
        await fs.copy(inputPath, outputPath);
        return;
    }
    const fillColor = options.fillColor || { r: 255, g: 255, b: 255, alpha: 1 };
    try {
        // Load the image
        const image = (0, sharp_1.default)(inputPath);
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Unable to read image dimensions');
        }
        // Create a copy to work with
        let processedImage = (0, sharp_1.default)(inputPath);
        // For each crop region, we'll create a white rectangle overlay
        const composites = [];
        for (const region of options.regions) {
            // Validate region dimensions
            if (region.x < 0 ||
                region.y < 0 ||
                region.width <= 0 ||
                region.height <= 0 ||
                region.x + region.width > metadata.width ||
                region.y + region.height > metadata.height) {
                console.warn(`Invalid crop region: ${JSON.stringify(region)}, skipping`);
                continue;
            }
            // Create a white rectangle for this region
            const rectangle = await (0, sharp_1.default)({
                create: {
                    width: region.width,
                    height: region.height,
                    channels: 4,
                    background: fillColor,
                },
            })
                .png()
                .toBuffer();
            composites.push({
                input: rectangle,
                top: region.y,
                left: region.x,
            });
        }
        // Apply all rectangles as overlays
        if (composites.length > 0) {
            processedImage = processedImage.composite(composites);
        }
        // Save the result
        await processedImage.toFile(outputPath);
    }
    catch (error) {
        console.error('Error applying crop regions:', error);
        throw new Error(`Failed to apply crop regions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Crop a specific rectangular region from an image
 * @param inputPath Path to the input image
 * @param outputPath Path where the cropped image will be saved
 * @param region Region to extract
 */
async function extractRegion(inputPath, outputPath, region) {
    try {
        await (0, sharp_1.default)(inputPath)
            .extract({
            left: region.x,
            top: region.y,
            width: region.width,
            height: region.height,
        })
            .toFile(outputPath);
    }
    catch (error) {
        console.error('Error extracting region:', error);
        throw new Error(`Failed to extract region: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Batch apply crop regions to multiple images
 * @param inputPaths Array of input image paths
 * @param outputPaths Array of output image paths
 * @param options Crop options
 */
async function batchApplyCropRegions(inputPaths, outputPaths, options) {
    if (inputPaths.length !== outputPaths.length) {
        throw new Error('Input and output path arrays must have the same length');
    }
    const promises = inputPaths.map((inputPath, index) => applyCropRegions(inputPath, outputPaths[index], options));
    await Promise.all(promises);
}
/**
 * Create a temporary masked version of an image for comparison
 * @param imagePath Path to the image
 * @param cropRegions Regions to mask
 * @returns Path to the temporary masked image
 */
async function createMaskedCopy(imagePath, cropRegions) {
    if (cropRegions.length === 0) {
        return imagePath; // No masking needed
    }
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const maskedPath = path.join(dir, `${basename}-masked${ext}`);
    await applyCropRegions(imagePath, maskedPath, { regions: cropRegions });
    return maskedPath;
}
/**
 * Validate crop regions against image dimensions
 * @param imagePath Path to the image
 * @param regions Crop regions to validate
 * @returns Valid and invalid regions
 */
async function validateCropRegions(imagePath, regions) {
    const image = (0, sharp_1.default)(imagePath);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error('Unable to read image dimensions');
    }
    const valid = [];
    const invalid = [];
    for (const region of regions) {
        if (region.x >= 0 &&
            region.y >= 0 &&
            region.width > 0 &&
            region.height > 0 &&
            region.x + region.width <= metadata.width &&
            region.y + region.height <= metadata.height) {
            valid.push(region);
        }
        else {
            invalid.push(region);
        }
    }
    return { valid, invalid };
}
//# sourceMappingURL=crop-handler.js.map