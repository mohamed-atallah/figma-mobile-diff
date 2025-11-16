import sharp from 'sharp';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ResizeOptions {
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  background?: { r: number; g: number; b: number; alpha: number };
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
export async function resizeImage(
  inputPath: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number,
  options: ResizeOptions = {}
): Promise<void> {
  const {
    fit = 'fill',
    background = { r: 255, g: 255, b: 255, alpha: 1 },
    quality = 90,
  } = options;

  try {
    // Load the image and get metadata
    const image = sharp(inputPath);
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

    console.log(
      `Resizing image from ${metadata.width}x${metadata.height} to ${targetWidth}x${targetHeight}`
    );

    // Perform resize with specified options
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, {
        fit,
        background,
      })
      .png({ quality })
      .toFile(outputPath);

    console.log(`✓ Image resized successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error(
      `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Resize an image to match another image's dimensions
 * @param inputPath Path to the image to resize
 * @param referencePath Path to the reference image (to get target dimensions)
 * @param outputPath Path where the resized image will be saved
 * @param options Resize options
 */
export async function resizeToMatchImage(
  inputPath: string,
  referencePath: string,
  outputPath: string,
  options: ResizeOptions = {}
): Promise<void> {
  try {
    // Get reference image dimensions
    const referenceImage = sharp(referencePath);
    const referenceMetadata = await referenceImage.metadata();

    if (!referenceMetadata.width || !referenceMetadata.height) {
      throw new Error('Unable to read reference image dimensions');
    }

    // Resize to match reference
    await resizeImage(
      inputPath,
      outputPath,
      referenceMetadata.width,
      referenceMetadata.height,
      options
    );
  } catch (error) {
    console.error('Error resizing image to match reference:', error);
    throw new Error(
      `Failed to resize to match reference: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
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
export async function batchResizeImages(
  inputPaths: string[],
  outputPaths: string[],
  targetWidth: number,
  targetHeight: number,
  options: ResizeOptions = {}
): Promise<void> {
  if (inputPaths.length !== outputPaths.length) {
    throw new Error('Input and output path arrays must have the same length');
  }

  const promises = inputPaths.map((inputPath, index) =>
    resizeImage(inputPath, outputPaths[index], targetWidth, targetHeight, options)
  );

  await Promise.all(promises);
}

/**
 * Check if two images have matching dimensions
 * @param imagePath1 Path to first image
 * @param imagePath2 Path to second image
 * @returns True if dimensions match, false otherwise
 */
export async function haveSameDimensions(
  imagePath1: string,
  imagePath2: string
): Promise<boolean> {
  try {
    const [metadata1, metadata2] = await Promise.all([
      sharp(imagePath1).metadata(),
      sharp(imagePath2).metadata(),
    ]);

    return (
      metadata1.width === metadata2.width &&
      metadata1.height === metadata2.height
    );
  } catch (error) {
    console.error('Error checking image dimensions:', error);
    return false;
  }
}

/**
 * Get image dimensions
 * @param imagePath Path to the image
 * @returns Object with width and height
 */
export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imagePath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    return {
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error(
      `Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Create a resized copy of an image for comparison
 * @param imagePath Path to the image
 * @param targetWidth Target width
 * @param targetHeight Target height
 * @returns Path to the resized copy
 */
export async function createResizedCopy(
  imagePath: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  const resizedPath = path.join(dir, `${basename}-resized${ext}`);

  await resizeImage(imagePath, resizedPath, targetWidth, targetHeight);

  return resizedPath;
}
