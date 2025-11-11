# Getting Started Checklist

Welcome to the Visual Regression Testing Framework! Follow this checklist to get up and running.

---

## ✅ Pre-Setup Checklist

Before you begin, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Access to the application you want to test
- [ ] Figma designs exported as PNG files
- [ ] Test credentials (email/phone/username + password)
- [ ] Understanding of your app's authentication method

---

## 📋 Setup Steps

### Step 1: Install Dependencies

```bash
npm install
npx playwright install
```

**Verify:**
- [ ] `node_modules/` directory created
- [ ] Playwright browsers installed

---

### Step 2: Run Setup Wizard

```bash
npm run setup
```

**The wizard will ask you:**

1. **Project Information**
   - [ ] Enter project name
   - [ ] Choose default environment (staging/production/local)

2. **Environment URLs**
   - [ ] Enter staging URL
   - [ ] Enter production URL (optional)
   - [ ] Enter local URL (optional)

3. **Authentication**
   - [ ] Choose auth method (phone/email/username/none)
   - [ ] Enter login page URL
   - [ ] Specify if OTP is required
   - [ ] Enter OTP page URL (if required)
   - [ ] Enter dashboard URL

4. **Pages to Test**
   - [ ] Add login page (if auth enabled)
   - [ ] Add dashboard page
   - [ ] Add additional pages

5. **Testing Settings**
   - [ ] Set threshold (0.05 recommended)

**Verify:**
- [ ] `config/test.config.json` created
- [ ] `config/selectors.json` created
- [ ] `.env` created

---

### Step 3: Add Design Images

Export your Figma designs and add to `design-images/`:

**For each page in your config:**

- [ ] Export frame from Figma as PNG (1x scale)
- [ ] Name file exactly as in config (e.g., `login-design.png`)
- [ ] Place in `design-images/` folder
- [ ] Verify dimensions match viewport or will auto-detect

**Example:**
```bash
design-images/
├── login-design.png       # ✅
├── dashboard-design.png   # ✅
└── settings-design.png    # ✅
```

---

### Step 4: Update Credentials

Edit `.env` file with your actual test credentials:

**For email auth:**
- [ ] Set `LOGIN_IDENTIFIER` to test email
- [ ] Set `LOGIN_PASSWORD` to password

**For phone auth:**
- [ ] Set `LOGIN_IDENTIFIER` to phone number
- [ ] Set `LOGIN_OTP` if fixed OTP available

**For username auth:**
- [ ] Set `LOGIN_IDENTIFIER` to username
- [ ] Set `LOGIN_PASSWORD` to password

**Verify:**
- [ ] Credentials are for a test account (not production!)
- [ ] `.env` is in `.gitignore` (never commit!)

---

### Step 5: Validate Selectors (Recommended)

```bash
npm run validate-selectors
```

**This will:**
1. Open browser
2. Navigate to login page
3. Test each selector
4. Report any issues

**If selectors fail:**
- [ ] Update `config/selectors.json` with correct selectors
- [ ] Use browser DevTools to find right selectors
- [ ] Re-run validation

**Verify:**
- [ ] All login selectors validated ✅
- [ ] OTP selectors validated (if required) ✅
- [ ] Page selectors validated ✅

---

### Step 6: Run Your First Test

```bash
npm test
```

**What happens:**
1. Global setup authenticates (if needed)
2. Tests run for each configured page
3. Screenshots captured
4. Comparisons generated
5. Reports created

**Verify:**
- [ ] Tests complete without errors
- [ ] Screenshots generated in `screenshots/`
- [ ] Reports generated in `reports/`
- [ ] Auth state saved to `auth/storageState.json`

---

### Step 7: Review Results

**Check Screenshots:**
```bash
ls -la screenshots/
```

- [ ] `{page}-actual.png` - Screenshot from live page
- [ ] `{page}-diff.png` - Visual differences
- [ ] `{page}-comparison.png` - Side-by-side

**Check Reports:**
```bash
ls -la reports/
cat reports/login-report.txt
```

- [ ] Detailed analysis
- [ ] Issue categorization
- [ ] Recommendations

**View HTML Report:**
```bash
npm run report
```

- [ ] Interactive Playwright report opens
- [ ] Can view test results
- [ ] Can see screenshots

---

## 🎯 Success Criteria

Your setup is complete when:

- [ ] ✅ Setup wizard completed
- [ ] ✅ Config files created
- [ ] ✅ Design images added
- [ ] ✅ Credentials configured
- [ ] ✅ Selectors validated
- [ ] ✅ Tests pass
- [ ] ✅ Screenshots generated
- [ ] ✅ Reports created

---

## 🐛 Troubleshooting

### Tests Won't Start

**Problem:** Configuration files missing

**Solution:**
```bash
ls config/
# Should show: test.config.json, selectors.json
```

If missing, run `npm run setup`

---

### Authentication Fails

**Problem:** Cannot log in

**Check:**
1. Credentials correct in `.env`?
2. Selectors correct in `config/selectors.json`?
3. Login URL correct in `config/test.config.json`?

**Debug:**
```bash
npm run test:headed  # Watch browser
```

**Fix:**
```bash
npm run validate-selectors  # Test selectors
# Update config/selectors.json if needed
npm run clean  # Clear auth state
npm test  # Try again
```

---

### Selectors Not Found

**Problem:** Element not found errors

**Solution:**
```bash
npm run validate-selectors
```

Update `config/selectors.json` with correct selectors.

**Tips:**
- Use browser DevTools (Inspect Element)
- Try multiple selector strategies
- Use `data-testid` attributes if available

---

### Visual Tests Failing

**Problem:** Differences exceed threshold

**Check:**
1. Are design images up to date?
2. Is viewport size correct?
3. Is threshold too strict?

**Review:**
```bash
open screenshots/{page}-diff.png
open screenshots/{page}-comparison.png
cat reports/{page}-report.txt
```

**Adjust threshold if needed:**

Edit `config/test.config.json`:
```json
"testing": {
  "threshold": 0.10  // Increased from 0.05
}
```

---

### Design Images Missing

**Problem:** Warning about missing design image

**This is OK!** Tests will:
- Still capture screenshot
- Skip visual comparison
- Save to `screenshots/{page}-actual.png`

**To fix:**
1. Export design from Figma
2. Add to `design-images/`
3. Re-run test

---

## 🚀 Next Steps

Once setup is complete:

### Add More Pages

1. Update `config/test.config.json`
2. Add design images
3. Run tests

### Test Different Environments

```bash
npm run test:staging
npm run test:production
```

### Customize Selectors

Update `config/selectors.json` for your app's specific selectors

### Set Up CI/CD

Integrate tests into your CI/CD pipeline

---

## 📚 Quick Command Reference

```bash
# Setup
npm run setup                  # Interactive setup wizard
npm install                    # Install dependencies
npx playwright install         # Install browsers

# Validation
npm run validate-selectors     # Test selectors

# Testing
npm test                       # Run all tests
npm run test:staging          # Test staging
npm run test:production       # Test production
npm run test:headed           # See browser
npm run test:ui               # Playwright UI

# Reports
npm run report                # View HTML report

# Maintenance
npm run clean                 # Clean generated files
```

---

## ✨ You're Ready!

Congratulations! Your Visual Regression Testing Framework is set up and ready to use.

**Happy Testing! 🎯**

---

**Need more help?**
- See `README.md` for full documentation
- See `CLAUDE.md` for developer guidance
- See `examples/` for configuration examples
