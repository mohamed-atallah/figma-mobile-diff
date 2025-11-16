export interface ResizeOptions {
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    background?: {
        r: number;
        g: number;
        b: number;
        alpha: number;
    };
    quality?: number;
}
/**
 * Resize an image to match target dimensions
 * @param inputPath Path to the input image
 * @param outputPath Path where the resized image will be saved
 * @param targetWidth Target width in pixels
 * @param targetHeight Target height in pixels
 * @param options Resize options
 */
export declare function resizeImage(inputPath: string, outputPath: string, targetWidth: number, targetHeight: number, options?: ResizeOptions): Promise<void>;
/**
 * Resize an image to match another image's dimensions
 * @param inputPath Path to the image to resize
 * @param referencePath Path to the reference image (to get target dimensions)
 * @param outputPath Path where the resized image will be saved
 * @param options Resize options
 */
export declare function resizeToMatchImage(inputPath: string, referencePath: string, outputPath: string, options?: ResizeOptions): Promise<void>;
/**
 * Batch resize multiple images to match target dimensions
 * @param inputPaths Array of input image paths
 * @param outputPaths Array of output image paths
 * @param targetWidth Target width in pixels
 * @param targetHeight Target height in pixels
 * @param options Resize options
 */
export declare function batchResizeImages(inputPaths: string[], outputPaths: string[], targetWidth: number, targetHeight: number, options?: ResizeOptions): Promise<void>;
/**
 * Check if two images have matching dimensions
 * @param imagePath1 Path to first image
 * @param imagePath2 Path to second image
 * @returns True if dimensions match, false otherwise
 */
export declare function haveSameDimensions(imagePath1: string, imagePath2: string): Promise<boolean>;
/**
 * Get image dimensions
 * @param imagePath Path to the image
 * @returns Object with width and height
 */
export declare function getImageDimensions(imagePath: string): Promise<{
    width: number;
    height: number;
}>;
/**
 * Create a resized copy of an image for comparison
 * @param imagePath Path to the image
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Path to the resized copy
 */
export declare function createResizedCopy(imagePath: string, targetWidth: number, targetHeight: number): Promise<string>;
