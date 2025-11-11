import { CropRegion } from './device-presets';
export interface CropOptions {
    regions: CropRegion[];
    fillColor?: {
        r: number;
        g: number;
        b: number;
        alpha: number;
    };
}
/**
 * Apply crop regions to an image by masking those areas
 * @param inputPath Path to the input image
 * @param outputPath Path where the cropped image will be saved
 * @param options Crop options including regions to mask
 */
export declare function applyCropRegions(inputPath: string, outputPath: string, options: CropOptions): Promise<void>;
/**
 * Crop a specific rectangular region from an image
 * @param inputPath Path to the input image
 * @param outputPath Path where the cropped image will be saved
 * @param region Region to extract
 */
export declare function extractRegion(inputPath: string, outputPath: string, region: {
    x: number;
    y: number;
    width: number;
    height: number;
}): Promise<void>;
/**
 * Batch apply crop regions to multiple images
 * @param inputPaths Array of input image paths
 * @param outputPaths Array of output image paths
 * @param options Crop options
 */
export declare function batchApplyCropRegions(inputPaths: string[], outputPaths: string[], options: CropOptions): Promise<void>;
/**
 * Create a temporary masked version of an image for comparison
 * @param imagePath Path to the image
 * @param cropRegions Regions to mask
 * @returns Path to the temporary masked image
 */
export declare function createMaskedCopy(imagePath: string, cropRegions: CropRegion[]): Promise<string>;
/**
 * Validate crop regions against image dimensions
 * @param imagePath Path to the image
 * @param regions Crop regions to validate
 * @returns Valid and invalid regions
 */
export declare function validateCropRegions(imagePath: string, regions: CropRegion[]): Promise<{
    valid: CropRegion[];
    invalid: CropRegion[];
}>;
