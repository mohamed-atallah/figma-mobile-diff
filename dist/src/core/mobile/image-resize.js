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
exports.resizeImage = resizeImage;
exports.resizeToMatchImage = resizeToMatchImage;
exports.batchResizeImages = batchResizeImages;
exports.haveSameDimensions = haveSameDimensions;
exports.getImageDimensions = getImageDimensions;
exports.createResizedCopy = createResizedCopy;
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * Resize an image to match target dimensions
 * @param inputPath Path to the input image
 * @param outputPath Path where the resized image will be saved
 * @param targetWidth Target width in pixels
 * @param targetHeight Target height in pixels
 * @param options Resize options
 */
async function resizeImage(inputPath, outputPath, targetWidth, targetHeight, options = {}) {
    const { fit = 'fill', background = { r: 255, g: 255, b: 255, alpha: 1 }, quality = 90, } = options;
    try {
        // Load the image and get metadata
        const image = (0, sharp_1.default)(inputPath);
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Unable to read image dimensions');
        }
        // Check if resize is needed
        if (metadata.width === targetWidth && metadata.height === targetHeight) {
            // No resize needed, just copy the file
            await fs.copy(inputPath, outputPath);
            return;
        }
        console.log(`Resizing image from ${metadata.width}x${metadata.height} to ${targetWidth}x${targetHeight}`);
        // Perform resize with specified options
        await (0, sharp_1.default)(inputPath)
            .resize(targetWidth, targetHeight, {
            fit,
            background,
        })
            .png({ quality })
            .toFile(outputPath);
        console.log(`✓ Image resized successfully: ${outputPath}`);
    }
    catch (error) {
        console.error('Error resizing image:', error);
        throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Resize an image to match another image's dimensions
 * @param inputPath Path to the image to resize
 * @param referencePath Path to the reference image (to get target dimensions)
 * @param outputPath Path where the resized image will be saved
 * @param options Resize options
 */
async function resizeToMatchImage(inputPath, referencePath, outputPath, options = {}) {
    try {
        // Get reference image dimensions
        const referenceImage = (0, sharp_1.default)(referencePath);
        const referenceMetadata = await referenceImage.metadata();
        if (!referenceMetadata.width || !referenceMetadata.height) {
            throw new Error('Unable to read reference image dimensions');
        }
        // Resize to match reference
        await resizeImage(inputPath, outputPath, referenceMetadata.width, referenceMetadata.height, options);
    }
    catch (error) {
        console.error('Error resizing image to match reference:', error);
        throw new Error(`Failed to resize to match reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Batch resize multiple images to match target dimensions
 * @param inputPaths Array of input image paths
 * @param outputPaths Array of output image paths
 * @param targetWidth Target width in pixels
 * @param targetHeight Target height in pixels
 * @param options Resize options
 */
async function batchResizeImages(inputPaths, outputPaths, targetWidth, targetHeight, options = {}) {
    if (inputPaths.length !== outputPaths.length) {
        throw new Error('Input and output path arrays must have the same length');
    }
    const promises = inputPaths.map((inputPath, index) => resizeImage(inputPath, outputPaths[index], targetWidth, targetHeight, options));
    await Promise.all(promises);
}
/**
 * Check if two images have matching dimensions
 * @param imagePath1 Path to first image
 * @param imagePath2 Path to second image
 * @returns True if dimensions match, false otherwise
 */
async function haveSameDimensions(imagePath1, imagePath2) {
    try {
        const [metadata1, metadata2] = await Promise.all([
            (0, sharp_1.default)(imagePath1).metadata(),
            (0, sharp_1.default)(imagePath2).metadata(),
        ]);
        return (metadata1.width === metadata2.width &&
            metadata1.height === metadata2.height);
    }
    catch (error) {
        console.error('Error checking image dimensions:', error);
        return false;
    }
}
/**
 * Get image dimensions
 * @param imagePath Path to the image
 * @returns Object with width and height
 */
async function getImageDimensions(imagePath) {
    try {
        const metadata = await (0, sharp_1.default)(imagePath).metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Unable to read image dimensions');
        }
        return {
            width: metadata.width,
            height: metadata.height,
        };
    }
    catch (error) {
        console.error('Error getting image dimensions:', error);
        throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Create a resized copy of an image for comparison
 * @param imagePath Path to the image
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Path to the resized copy
 */
async function createResizedCopy(imagePath, targetWidth, targetHeight) {
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    const resizedPath = path.join(dir, `${basename}-resized${ext}`);
    await resizeImage(imagePath, resizedPath, targetWidth, targetHeight);
    return resizedPath;
}
//# sourceMappingURL=image-resize.js.map