import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Cache for PNG images to avoid re-reading from disk
const imageCache = new Map<string, PNG>();

/**
 * Get cached PNG image or read from disk and cache it
 */
export function getCachedImage(imagePath: string): PNG {
  if (imageCache.has(imagePath)) {
    return imageCache.get(imagePath)!;
  }
  const img = PNG.sync.read(fs.readFileSync(imagePath));
  imageCache.set(imagePath, img);
  return img;
}

/**
 * Clear image cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageCache.clear();
}

export interface ComparisonResult {
  mismatchedPixels: number;
  totalPixels: number;
  diffPercentage: number;
  diffImagePath: string;
  passed: boolean;
}

export interface ComparisonOptions {
  threshold?: number; // 0-1, default 0.1 (10% difference allowed)
  pixelmatchThreshold?: number; // 0-1, default 0.1 (sensitivity for pixel matching)
  diffColor?: [number, number, number]; // RGB color for diff highlights, default red
}

/**
 * Compare two images and generate a diff image
 * @param actualImagePath Path to the screenshot from the live page
 * @param expectedImagePath Path to the Figma design image
 * @param diffImagePath Path where the diff image will be saved
 * @param options Comparison options
 * @returns Comparison result with statistics
 */
export async function compareImages(
  actualImagePath: string,
  expectedImagePath: string,
  diffImagePath: string,
  options: ComparisonOptions = {}
): Promise<ComparisonResult> {
  const {
    threshold = 0.1,
    pixelmatchThreshold = 0.1,
    diffColor = [255, 0, 0], // Red by default
  } = options;

  // Read images (use cache to avoid re-reading)
  const actual = getCachedImage(actualImagePath);
  const expected = getCachedImage(expectedImagePath);

  // Check if dimensions match
  if (actual.width !== expected.width || actual.height !== expected.height) {
    console.warn(
      `Image dimensions don't match. Actual: ${actual.width}x${actual.height}, Expected: ${expected.width}x${expected.height}`
    );

    // Resize the smaller image to match the larger one
    const maxWidth = Math.max(actual.width, expected.width);
    const maxHeight = Math.max(actual.height, expected.height);

    const resizedActual = resizeImage(actual, maxWidth, maxHeight);
    const resizedExpected = resizeImage(expected, maxWidth, maxHeight);

    return compareResizedImages(
      resizedActual,
      resizedExpected,
      diffImagePath,
      threshold,
      pixelmatchThreshold,
      diffColor
    );
  }

  // Create diff image
  const diff = new PNG({ width: actual.width, height: actual.height });

  // Perform pixel-by-pixel comparison
  const mismatchedPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    actual.width,
    actual.height,
    {
      threshold: pixelmatchThreshold,
      diffColor: diffColor,
      diffColorAlt: [255, 255, 0], // Yellow for anti-aliasing differences
    }
  );

  // Save diff image
  const diffDir = path.dirname(diffImagePath);
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }
  fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

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
function resizeImage(img: PNG, targetWidth: number, targetHeight: number): PNG {
  const resized = new PNG({ width: targetWidth, height: targetHeight });

  // Fill with white background
  for (let i = 0; i < resized.data.length; i += 4) {
    resized.data[i] = 255;     // R
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
function compareResizedImages(
  actual: PNG,
  expected: PNG,
  diffImagePath: string,
  threshold: number,
  pixelmatchThreshold: number,
  diffColor: [number, number, number]
): ComparisonResult {
  const diff = new PNG({ width: actual.width, height: actual.height });

  const mismatchedPixels = pixelmatch(
    actual.data,
    expected.data,
    diff.data,
    actual.width,
    actual.height,
    {
      threshold: pixelmatchThreshold,
      diffColor: diffColor,
      diffColorAlt: [255, 255, 0],
    }
  );

  const diffDir = path.dirname(diffImagePath);
  if (!fs.existsSync(diffDir)) {
    fs.mkdirSync(diffDir, { recursive: true });
  }
  fs.writeFileSync(diffImagePath, PNG.sync.write(diff));

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
export function getImageDimensions(imagePath: string): { width: number; height: number } {
  const img = getCachedImage(imagePath);
  return { width: img.width, height: img.height };
}

/**
 * Generate a side-by-side comparison image
 */
export function generateSideBySideComparison(
  actualImagePath: string,
  expectedImagePath: string,
  outputPath: string
): void {
  const actual = getCachedImage(actualImagePath);
  const expected = getCachedImage(expectedImagePath);

  const maxHeight = Math.max(actual.height, expected.height);
  const combined = new PNG({
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

  fs.writeFileSync(outputPath, PNG.sync.write(combined));
}
