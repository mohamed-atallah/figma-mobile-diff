import { PNG } from 'pngjs';
/**
 * Get cached PNG image or read from disk and cache it
 */
export declare function getCachedImage(imagePath: string): PNG;
/**
 * Clear image cache (useful for testing or memory management)
 */
export declare function clearImageCache(): void;
export interface ComparisonResult {
    mismatchedPixels: number;
    totalPixels: number;
    diffPercentage: number;
    diffImagePath: string;
    passed: boolean;
}
export interface ComparisonOptions {
    threshold?: number;
    pixelmatchThreshold?: number;
    diffColor?: [number, number, number];
}
/**
 * Compare two images and generate a diff image
 * @param actualImagePath Path to the screenshot from the live page
 * @param expectedImagePath Path to the Figma design image
 * @param diffImagePath Path where the diff image will be saved
 * @param options Comparison options
 * @returns Comparison result with statistics
 */
export declare function compareImages(actualImagePath: string, expectedImagePath: string, diffImagePath: string, options?: ComparisonOptions): Promise<ComparisonResult>;
/**
 * Get image dimensions from a PNG file (uses cache)
 */
export declare function getImageDimensions(imagePath: string): {
    width: number;
    height: number;
};
/**
 * Generate a side-by-side comparison image
 */
export declare function generateSideBySideComparison(actualImagePath: string, expectedImagePath: string, outputPath: string): void;
