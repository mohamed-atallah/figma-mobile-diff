# Auto-Resize Feature for Mobile Screenshots

## Overview

The auto-resize feature automatically resizes mobile screenshots to match Figma design dimensions when they don't match. This is particularly useful for mobile testing where different devices, simulators, or export settings can result in slightly different dimensions.

## What Was Implemented

### 1. Core Image Resize Module (`src/core/mobile/image-resize.ts`)

A new utility module with the following functions:
- `resizeImage()` - Resize an image to specific dimensions
- `resizeToMatchImage()` - Resize one image to match another's dimensions
- `haveSameDimensions()` - Check if two images have matching dimensions
- `getImageDimensions()` - Get image dimensions
- `createResizedCopy()` - Create a resized copy for comparison
- `batchResizeImages()` - Batch process multiple images

### 2. API Integration (`src/api/routes/comparison.routes.ts`)

Updated the comparison API to:
- Accept new `autoResize` parameter in POST requests
- Automatically detect dimension mismatches
- Resize screenshots to match design dimensions before comparison
- Log dimension information for debugging
- Store resized images for reference

### 3. Web Interface (`public/index.html` & `public/js/upload.js`)

Added UI controls:
- New checkbox: "Auto-resize screenshots to match design dimensions"
- Form data automatically includes autoResize value
- User-friendly description explaining the feature

### 4. CSS Styling (`public/css/styles.css`)

Added styling for the checkbox:
- Clean, modern checkbox design
- Consistent with existing UI
- Accessible and responsive

### 5. Documentation (`README.md`)

Updated documentation with:
- API parameter description
- Best practices section
- cURL example for CLI usage

## How to Use

### Via Web Interface

1. Open `http://localhost:9000`
2. Fill in project details
3. **Check the "Auto-resize screenshots" checkbox**
4. Upload your design images and screenshots
5. Click "Start Comparison"

The system will automatically:
- Detect dimension mismatches
- Resize screenshots to match designs
- Log resize operations to console
- Use resized images for comparison

### Via API (cURL)

```bash
curl -X POST http://localhost:9000/api/comparisons \
  -F "projectName=My Mobile App" \
  -F "autoResize=true" \
  -F "threshold=0.05" \
  -F "designs=@home-screen-design.png" \
  -F "screenshots=@home-screen-actual.png"
```

### Via API (JavaScript)

```javascript
const formData = new FormData();
formData.append('projectName', 'My Mobile App');
formData.append('autoResize', true);
formData.append('threshold', 0.05);
formData.append('designs', designFile);
formData.append('screenshots', screenshotFile);

const response = await fetch('/api/comparisons', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Comparison ID:', result.comparisonId);
```

## Technical Details

### Resize Algorithm

- **Library**: Sharp (high-performance image processing)
- **Fit Mode**: `fill` - Stretches/shrinks to exact dimensions
- **Background**: White (#FFFFFF) with full opacity
- **Quality**: 90% (PNG compression)
- **Format**: PNG (maintains transparency)

### Performance

- Only resizes when dimensions don't match
- Caches resized images for future reference
- Parallel processing for multiple pairs
- Minimal memory overhead

### File Storage

Resized images are stored with the naming pattern:
```
storage/output/{comparisonId}/pair-{N}-screenshot-resized.png
```

Original screenshots are preserved in:
```
storage/uploads/{filename}
```

## When to Use Auto-Resize

### ✅ Use Auto-Resize When:

- Testing across multiple device simulators
- Figma exports don't match exact device dimensions
- Working with different pixel ratios (1x, 2x, 3x)
- Screenshots include/exclude system UI elements
- Quick testing without precise dimension control

### ❌ Don't Use Auto-Resize When:

- Exact pixel-perfect matching is required
- Testing responsive layouts at specific breakpoints
- Dimension differences are intentional
- You need to validate actual screen dimensions

## Example Scenarios

### Scenario 1: iPhone Simulator vs Figma Export

```
Design:    375x667 (iPhone SE exported at 1x)
Screenshot: 750x1334 (iPhone SE at 2x)

With autoResize=true:
→ Screenshot resized to 375x667
→ Accurate comparison performed
```

### Scenario 2: Android Device with Navigation Bar

```
Design:    360x640 (Without nav bar)
Screenshot: 360x720 (With nav bar)

With autoResize=true:
→ Screenshot resized to 360x640
→ Comparison focuses on design area
```

### Scenario 3: Mixed Device Testing

```
Design:     390x844 (iPhone 14)
Screenshot: 393x852 (iPhone 14 Pro)

With autoResize=true:
→ Screenshot resized to 390x844
→ Content comparison succeeds
```

## Console Output

When auto-resize is active, you'll see logs like:

```
Dimension mismatch detected for pair 1:
  Screenshot: 750x1334
  Design: 375x667
Resizing image from 750x1334 to 375x667
✓ Screenshot resized to match design dimensions
✓ Processed pair 1/5 - PASS (3.21% diff)
```

## Configuration Options

### Default Settings

```typescript
{
  fit: 'fill',                           // Stretch to exact dimensions
  background: { r: 255, g: 255, b: 255, alpha: 1 }, // White
  quality: 90                            // PNG quality
}
```

### Advanced Customization

To customize resize behavior, edit `src/core/mobile/image-resize.ts`:

```typescript
await resizeImage(inputPath, outputPath, width, height, {
  fit: 'contain',  // Options: cover, contain, fill, inside, outside
  background: { r: 0, g: 0, b: 0, alpha: 1 }, // Black background
  quality: 100     // Maximum quality
});
```

## Comparison with Padding vs Resizing

### Old Behavior (Padding)
```
Design:    400x800
Screenshot: 450x900

Result: Screenshot padded with white space to 450x900
Problem: Design also padded to 450x900, creates artificial differences
```

### New Behavior (Resizing with autoResize=true)
```
Design:    400x800
Screenshot: 450x900

Result: Screenshot resized to 400x800
Benefit: Dimensions match exactly, accurate content comparison
```

## Troubleshooting

### Images Look Stretched

- This is expected when aspect ratios differ significantly
- Consider using device presets to crop system UI first
- Verify you're comparing the correct screen sizes

### Resize Not Working

1. Check `autoResize` parameter is set to `true` (boolean or string)
2. Verify Sharp library is installed: `npm list sharp`
3. Check console logs for dimension mismatch detection
4. Ensure output directory has write permissions

### Poor Comparison Results

- Try adjusting the comparison threshold
- Use device presets to exclude system UI
- Verify design exports match target device
- Check if auto-resize is actually needed

## API Response

When auto-resize is active, the comparison pair will reference the resized screenshot:

```json
{
  "id": "comparison-uuid",
  "pairs": [
    {
      "id": "pair-uuid",
      "designPath": "/storage/uploads/design.png",
      "screenshotPath": "/storage/output/comparison-uuid/pair-1-screenshot-resized.png",
      "diffPath": "/storage/output/comparison-uuid/pair-1-diff.png",
      "comparisonPath": "/storage/output/comparison-uuid/pair-1-comparison.png",
      "mismatchPercentage": 3.21,
      "status": "success"
    }
  ]
}
```

## Best Practices

1. **Enable by Default for Mobile**: Mobile screenshots often have slight dimension variations
2. **Test with Device Presets**: Combine auto-resize with device presets for best results
3. **Monitor Logs**: Check console output to understand resize operations
4. **Keep Originals**: Original files are preserved for reference
5. **Adjust Threshold**: May need higher threshold (e.g., 0.08) when using auto-resize

## Future Enhancements

Potential improvements for future versions:
- Configurable resize modes (cover, contain, etc.)
- Aspect ratio preservation options
- Smart cropping before resize
- Resize preview in web interface
- Per-pair resize configuration
- Resize quality settings in UI

## Files Modified

- ✅ `src/core/mobile/image-resize.ts` (NEW)
- ✅ `src/api/routes/comparison.routes.ts`
- ✅ `public/index.html`
- ✅ `public/js/upload.js`
- ✅ `public/css/styles.css`
- ✅ `README.md`

## Testing

To test the auto-resize feature:

```bash
# 1. Start the server
npm run dev

# 2. Open browser to http://localhost:9000

# 3. Upload images with different dimensions:
#    - Design: 375x667
#    - Screenshot: 750x1334

# 4. Enable "Auto-resize" checkbox

# 5. Start comparison and check:
#    - Console logs show resize operation
#    - Comparison completes successfully
#    - Resized file exists in storage/output
```

## Summary

The auto-resize feature provides a convenient way to handle dimension mismatches in mobile visual regression testing. It's particularly useful for cross-device testing and when working with different export settings from design tools.

For most mobile testing scenarios, enabling auto-resize is recommended as it provides more accurate content comparisons without requiring perfect dimension matching.
