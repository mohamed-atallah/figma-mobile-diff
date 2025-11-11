import sharp from 'sharp';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CropRegion } from './device-presets';

export interface CropOptions {
  regions: CropRegion[];
  fillColor?: { r: number; g: number; b: number; alpha: number };
}

/**
 * Apply crop regions to an image by masking those areas
 * @param inputPath Path to the input image
 * @param outputPath Path where the cropped image will be saved
 * @param options Crop options including regions to mask
 */
export async function applyCropRegions(
  inputPath: string,
  outputPath: string,
  options: CropOptions
): Promise<void> {
  if (!options.regions || options.regions.length === 0) {
    // No crops to apply, just copy the file
    await fs.copy(inputPath, outputPath);
    return;
  }

  const fillColor = options.fillColor || { r: 255, g: 255, b: 255, alpha: 1 };

  try {
    // Load the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    // Create a copy to work with
    let processedImage = sharp(inputPath);

    // For each crop region, we'll create a white rectangle overlay
    const composites: Array<{ input: Buffer; top: number; left: number }> = [];

    for (const region of options.regions) {
      // Validate region dimensions
      if (
        region.x < 0 ||
        region.y < 0 ||
        region.width <= 0 ||
        region.height <= 0 ||
        region.x + region.width > metadata.width ||
        region.y + region.height > metadata.height
      ) {
        console.warn(`Invalid crop region: ${JSON.stringify(region)}, skipping`);
        continue;
      }

      // Create a white rectangle for this region
      const rectangle = await sharp({
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
  } catch (error) {
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
export async function extractRegion(
  inputPath: string,
  outputPath: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<void> {
  try {
    await sharp(inputPath)
      .extract({
        left: region.x,
        top: region.y,
        width: region.width,
        height: region.height,
      })
      .toFile(outputPath);
  } catch (error) {
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
export async function batchApplyCropRegions(
  inputPaths: string[],
  outputPaths: string[],
  options: CropOptions
): Promise<void> {
  if (inputPaths.length !== outputPaths.length) {
    throw new Error('Input and output path arrays must have the same length');
  }

  const promises = inputPaths.map((inputPath, index) =>
    applyCropRegions(inputPath, outputPaths[index], options)
  );

  await Promise.all(promises);
}

/**
 * Create a temporary masked version of an image for comparison
 * @param imagePath Path to the image
 * @param cropRegions Regions to mask
 * @returns Path to the temporary masked image
 */
export async function createMaskedCopy(
  imagePath: string,
  cropRegions: CropRegion[]
): Promise<string> {
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
export async function validateCropRegions(
  imagePath: string,
  regions: CropRegion[]
): Promise<{ valid: CropRegion[]; invalid: CropRegion[] }> {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const valid: CropRegion[] = [];
  const invalid: CropRegion[] = [];

  for (const region of regions) {
    if (
      region.x >= 0 &&
      region.y >= 0 &&
      region.width > 0 &&
      region.height > 0 &&
      region.x + region.width <= metadata.width &&
      region.y + region.height <= metadata.height
    ) {
      valid.push(region);
    } else {
      invalid.push(region);
    }
  }

  return { valid, invalid };
}
