# Design Images

This folder contains reference design images for visual regression testing.

## Quick Start

1. **Export designs from Figma as PNG (1x scale)**
2. **Name files according to page names** in `config/test.config.json`
3. **Place files here**
4. **Run tests**: `npm test`

---

## File Naming Convention

Match the `designImage` value from your config:

**Config (`config/test.config.json`):**
```json
{
  "name": "login",
  "designImage": "login-design.png"
}
```

**File:** `design-images/login-design.png`

---

## Export Settings (Figma)

When exporting from Figma:

1. **Select the frame/artboard**
2. **Export settings:**
   - Format: **PNG**
   - Scale: **1x** (or 2x for retina, then update config)
   - Contents: **Frame** (not just contents)

3. **Viewport considerations:**
   - Note the frame dimensions in Figma
   - Either set matching viewport in config, or let framework auto-detect

---

## Viewport Matching

The framework automatically sets viewport size based on design image dimensions.

**Option 1: Auto-detect (recommended)**
```json
{
  "name": "login",
  "designImage": "login-design.png"
  // No viewport specified - auto-detected from image
}
```

**Option 2: Explicit viewport**
```json
{
  "name": "login",
  "designImage": "login-design.png",
  "viewport": { "width": 1920, "height": 1080 }
}
```

---

## Common Viewport Sizes

- **Desktop**: 1920 x 1080 (Full HD)
- **Laptop**: 1512 x 982 (MacBook Pro 16")
- **Tablet**: 768 x 1024 (iPad)
- **Mobile**: 375 x 812 (iPhone X)

Match your Figma artboard to one of these or use custom dimensions.

---

## File Organization

### By Page Type
```
design-images/
├── login-design.png
├── signup-design.png
├── dashboard-design.png
├── profile-design.png
└── settings-design.png
```

### By Feature (Optional)
```
design-images/
├── auth-login.png
├── auth-signup.png
├── user-profile.png
├── user-settings.png
└── admin-dashboard.png
```

---

## Updating Design Images

When designs change:

1. **Export new design from Figma**
2. **Replace old file** (same filename)
3. **Run tests**: `npm test`
4. **Review diff images** in `screenshots/`
5. **If intentional changes**: Update design image in git
6. **If bugs found**: Fix in app, re-test

---

## Git Workflow

**DO commit design images:**
```bash
git add design-images/*.png
git commit -m "Update login design image"
```

This ensures all team members test against the same designs.

---

## Test Without Design Image

If a page doesn't have a design image yet:

1. Test will automatically skip visual comparison
2. Still captures screenshot to `screenshots/{page}-actual.png`
3. Log message: `⚠️  Design image not found: design-images/{page}-design.png`

Add design image later, re-run test to compare.

---

## Tips

✅ **Always export at 1x scale** for web testing
✅ **Match viewport dimensions** for accurate comparison
✅ **Update images when designs change intentionally**
✅ **Keep file names consistent** with config
✅ **Commit to version control** for team consistency
✅ **Include states** if needed (hover, focus, error)

---

## Multiple States (Advanced)

To test different states of the same page:

**Config:**
```json
{
  "name": "login-error",
  "url": "/login?error=true",
  "designImage": "login-error-design.png"
},
{
  "name": "login-default",
  "url": "/login",
  "designImage": "login-default-design.png"
}
```

**Files:**
```
design-images/
├── login-default-design.png
└── login-error-design.png
```

---

## Example: Adding a New Page

1. **Design in Figma**: Create "Checkout" page frame (1920x1080)

2. **Export**:
   - Select "Checkout" frame
   - Export as PNG, 1x scale
   - Save as `checkout-design.png`

3. **Add to config** (`config/test.config.json`):
```json
{
  "name": "checkout",
  "url": "/checkout",
  "designImage": "checkout-design.png"
}
```

4. **Place file**:
```bash
mv ~/Downloads/checkout-design.png design-images/
```

5. **Run test**:
```bash
npm test
```

Done! ✅

---

**Need help?** See `docs/QUICK_START.md` or `README.md`
