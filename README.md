# Mobile Visual Regression Testing

**A web-based tool for comparing Figma designs with mobile app screenshots**

Upload your Figma design images and mobile simulator screenshots to get detailed visual difference reports with pixel-perfect analysis.

---

## ✨ Features

- 📱 **Mobile-First** - Designed specifically for mobile app visual testing
- 🎨 **Figma Integration** - Compare your designs directly with app screenshots
- 📦 **Batch Processing** - Upload multiple image pairs at once
- 📊 **Detailed Reports** - Comprehensive visual diffs with 9-zone analysis
- 🔧 **Device Presets** - Auto-crop status bars, notches, and navigation bars
- 🌐 **Web Interface** - Simple drag-and-drop upload interface
- 💾 **Persistent Storage** - Keep history of all comparisons
- 🚀 **Fast Processing** - Optimized image comparison engine

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

### 3. Open in Browser

Navigate to `http://localhost:9000` in your web browser.

---

## 📖 How to Use

### Step 1: Prepare Your Images

1. **Export Figma Designs** as PNG files
2. **Capture Mobile Screenshots** from iOS Simulator or Android Emulator
3. Make sure design and screenshot dimensions match (or use device presets)

### Step 2: Upload Images

1. Enter a **Project Name**
2. (Optional) Select a **Device Preset** to auto-crop system UI elements
3. Adjust **Comparison Threshold** (default 5%)
4. **Drag & drop** or browse to upload:
   - Design images (left column)
   - Mobile screenshots (right column)
5. Click **Start Comparison**

### Step 3: View Results

The results page shows:
- **Summary** - Total pairs, passed/failed counts
- **Side-by-Side Comparison** - Design vs screenshot
- **Diff Visualization** - Red highlights show differences
- **Detailed Report** - 9-zone analysis with issue categorization

---

## 📱 Supported Devices

### iPhone
- iPhone 14 Pro Max (430x932)
- iPhone 14 Pro (393x852)
- iPhone 14 (390x844)
- iPhone 13 (390x844)
- iPhone SE 3rd Gen (375x667)

### Android
- Google Pixel 7 Pro (412x915)
- Google Pixel 7 (412x915)
- Samsung Galaxy S23 Ultra (360x800)
- Samsung Galaxy S23 (360x780)
- OnePlus 10 Pro (412x919)

### Tablets
- iPad Pro 12.9" (1024x1366)
- iPad Air (820x1180)

Device presets automatically crop:
- Status bars
- Navigation bars
- Notches / Dynamic Island
- Home indicators

---

## 🛠️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```env
PORT=9000                        # Server port
HOST=localhost                   # Server host
NODE_ENV=development             # Environment

STORAGE_RETENTION_DAYS=30        # Auto-cleanup after N days
MAX_FILE_SIZE=10485760          # 10MB max file size

DEFAULT_THRESHOLD=0.05           # 5% default threshold
PIXELMATCH_THRESHOLD=0.1         # Pixel matching sensitivity

MAX_CONCURRENT_COMPARISONS=10    # Batch processing limit
ENABLE_IMAGE_CACHING=true        # Performance optimization
```

### Mobile Config

Edit `config/mobile.config.json` for advanced settings:

```json
{
  "storage": {
    "maxFileSize": "10MB",
    "allowedFormats": ["png", "jpg", "jpeg", "webp"],
    "retentionDays": 30
  },
  "comparison": {
    "defaultThreshold": 0.05,
    "pixelmatchThreshold": 0.1
  },
  "performance": {
    "maxConcurrentComparisons": 10,
    "enableImageCaching": true
  }
}
```

---

## 📁 Project Structure

```
mobile-visual-regression/
├── config/
│   ├── device-presets.json      # Mobile device specifications
│   └── mobile.config.json       # App configuration
├── core/
│   ├── comparison/              # Image comparison engine
│   │   ├── image-compare.ts     # Pixel comparison logic
│   │   └── report-generator.ts  # Report generation
│   └── mobile/
│       ├── device-presets.ts    # Device preset loader
│       └── crop-handler.ts      # Image cropping utilities
├── src/
│   ├── api/
│   │   ├── routes/              # API endpoints
│   │   └── middleware/          # Upload handling
│   ├── db/
│   │   └── storage.ts           # JSON-based storage
│   └── server.ts                # Express server
├── public/
│   ├── index.html               # Upload interface
│   ├── results.html             # Results display
│   ├── history.html             # Comparison history
│   ├── css/                     # Stylesheets
│   └── js/                      # Client-side scripts
└── storage/
    ├── uploads/                 # Uploaded images
    ├── output/                  # Generated comparisons
    └── database.json            # Comparison metadata
```

---

## 🔧 API Endpoints

### Create Comparison

```bash
POST /api/comparisons
Content-Type: multipart/form-data

# Form fields:
- projectName: string (required)
- devicePreset: string (optional)
- threshold: number (optional, 0-1)
- pixelmatchThreshold: number (optional, 0-1)
- autoResize: boolean (optional, default: false)
- designs: file[] (required)
- screenshots: file[] (required)

# Response:
{
  "comparisonId": "uuid",
  "totalPairs": 5,
  "statusUrl": "/api/comparisons/uuid"
}
```

**Auto-Resize Feature**: When `autoResize=true`, screenshots are automatically resized to match the Figma design dimensions if they don't match. This is particularly useful for mobile screenshots where the exact pixel dimensions may vary between devices or simulators.

### Get Comparison

```bash
GET /api/comparisons/:id

# Response:
{
  "id": "uuid",
  "projectName": "My App",
  "timestamp": "2025-11-11T18:00:00Z",
  "status": "completed",
  "pairs": [...],
  "totalPairs": 5,
  "passedPairs": 4,
  "failedPairs": 1
}
```

### List All Comparisons

```bash
GET /api/comparisons?limit=50&offset=0&projectName=search

# Response:
{
  "comparisons": [...],
  "total": 100
}
```

### Delete Comparison

```bash
DELETE /api/comparisons/:id
```

### Get File

```bash
GET /api/comparisons/:id/files/:pairId/:type
# type: design | screenshot | diff | comparison | report
```

---

## 🎯 Comparison Threshold Guide

The threshold determines how much visual difference is acceptable:

- **0.01 (1%)** - Very strict, catches tiny differences
- **0.05 (5%)** - Recommended default, balanced sensitivity
- **0.10 (10%)** - Lenient, allows minor variations
- **0.20 (20%)** - Very lenient, only major differences

---

## 📊 Understanding Reports

### 9-Zone Analysis

Each comparison divides the screen into a 3x3 grid:

```
┌─────┬─────┬─────┐
│ TL  │ TC  │ TR  │  Top (Header)
├─────┼─────┼─────┤
│ ML  │ MC  │ MR  │  Middle (Content)
├─────┼─────┼─────┤
│ BL  │ BC  │ BR  │  Bottom (Navigation)
└─────┴─────┴─────┘
```

### Issue Categories

- **Layout** - Element positioning differences
- **Size** - Dimension mismatches
- **Color** - Color/shade differences
- **Spacing** - Padding/margin issues
- **Element** - Missing or extra elements

### Severity Levels

- 🔴 **Critical** (>10% difference in zone)
- 🟠 **High** (5-10%)
- 🟡 **Medium** (2-5%)
- 🟢 **Low** (<2%)

---

## 🧹 Maintenance

### Clean Up Storage

```bash
npm run clean
```

This removes:
- All uploaded images
- All generated outputs
- Comparison database

### Auto-Cleanup

Set `STORAGE_RETENTION_DAYS=30` in `.env` to automatically delete comparisons older than 30 days.

---

## 🚨 Troubleshooting

### Upload Fails

- Check file size (max 10MB per file)
- Ensure files are PNG/JPG/JPEG/WebP
- Verify design and screenshot counts match

### Comparison Timeout

- Reduce batch size (max 50 pairs)
- Check server logs for errors
- Increase `MAX_CONCURRENT_COMPARISONS`

### High False Positive Rate

- Increase threshold (0.05 → 0.10)
- Use device preset to exclude status bars
- Ensure design and screenshot are same resolution

### Port Already in Use

```bash
# Change port in .env
PORT=9001

# Or kill existing process
lsof -ti:9000 | xargs kill -9
```

---

## 📝 Best Practices

### Exporting from Figma

1. Select frame/screen
2. Export as PNG (1x, 2x, or 3x to match device)
3. Name descriptively (e.g., `home-screen.png`)

### Capturing Screenshots

**iOS Simulator:**
```bash
xcrun simctl io booted screenshot ~/Desktop/screenshot.png
```

**Android Emulator:**
```bash
adb exec-out screencap -p > ~/Desktop/screenshot.png
```

### Organizing Images

- Use consistent naming: `home-screen-design.png`, `home-screen-actual.png`
- Match export resolution to device pixel ratio
- Capture screenshots at same time to avoid time-based differences

### Handling Dimension Mismatches

If your mobile screenshots don't exactly match your Figma design dimensions, you have two options:

1. **Manual Resize**: Re-export your Figma designs or re-capture screenshots at matching dimensions
2. **Auto-Resize** (Recommended): Use `autoResize=true` when uploading to automatically resize screenshots to match design dimensions

Example with cURL:
```bash
curl -X POST http://localhost:9000/api/comparisons \
  -F "projectName=My App" \
  -F "autoResize=true" \
  -F "designs=@design1.png" \
  -F "screenshots=@screenshot1.png"
```

The auto-resize feature uses high-quality image scaling to ensure accurate comparisons even when dimensions don't match perfectly.

---

## 🤝 Contributing

This tool was adapted from a Playwright-based web testing framework. Contributions welcome!

---

## 📄 License

MIT License - Feel free to use and modify for your projects.

---

## 🔗 Links

- **Figma**: https://www.figma.com
- **iOS Simulator**: https://developer.apple.com/xcode/
- **Android Emulator**: https://developer.android.com/studio

---

## 📧 Support

Having issues? Check the troubleshooting section or review the browser console / server logs for detailed error messages.

---

**Happy Testing! 🎉**
