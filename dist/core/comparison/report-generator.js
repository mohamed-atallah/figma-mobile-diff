"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDiffRegions = analyzeDiffRegions;
exports.generateIssues = generateIssues;
exports.generateTextualReport = generateTextualReport;
exports.saveReport = saveReport;
const fs = __importStar(require("fs"));
const image_compare_1 = require("./image-compare");
/**
 * Analyze diff image to identify specific regions with differences
 * Optimized to use single-pass iteration and cached images
 */
function analyzeDiffRegions(actualImagePath, expectedImagePath, diffImagePath) {
    const actual = (0, image_compare_1.getCachedImage)(actualImagePath);
    const expected = (0, image_compare_1.getCachedImage)(expectedImagePath);
    const diff = (0, image_compare_1.getCachedImage)(diffImagePath);
    const dimensionMismatch = actual.width !== expected.width || actual.height !== expected.height;
    // Divide image into 9 regions (3x3 grid)
    const regions = [
        { name: 'Top-Left', x: 0, y: 0 },
        { name: 'Top-Center', x: 1, y: 0 },
        { name: 'Top-Right', x: 2, y: 0 },
        { name: 'Middle-Left', x: 0, y: 1 },
        { name: 'Center', x: 1, y: 1 },
        { name: 'Middle-Right', x: 2, y: 1 },
        { name: 'Bottom-Left', x: 0, y: 2 },
        { name: 'Bottom-Center', x: 1, y: 2 },
        { name: 'Bottom-Right', x: 2, y: 2 },
    ];
    const regionWidth = Math.floor(diff.width / 3);
    const regionHeight = Math.floor(diff.height / 3);
    // Initialize region counters (9 regions)
    const regionMismatches = new Array(9).fill(0);
    const regionTotals = new Array(9).fill(0);
    // OPTIMIZED: Single-pass iteration through all pixels
    for (let y = 0; y < diff.height; y++) {
        const regionY = Math.min(Math.floor(y / regionHeight), 2);
        for (let x = 0; x < diff.width; x++) {
            const regionX = Math.min(Math.floor(x / regionWidth), 2);
            const regionIndex = regionY * 3 + regionX;
            const idx = (diff.width * y + x) << 2;
            const r = diff.data[idx];
            const g = diff.data[idx + 1];
            const b = diff.data[idx + 2];
            // Check if pixel is marked as different (red or yellow)
            if ((r > 200 && g < 100 && b < 100) || (r > 200 && g > 200 && b < 100)) {
                regionMismatches[regionIndex]++;
            }
            regionTotals[regionIndex]++;
        }
    }
    // Build region results
    const regionDiffs = regions.map((region, idx) => {
        const mismatchedPixels = regionMismatches[idx];
        const totalPixels = regionTotals[idx];
        const percentage = (mismatchedPixels / totalPixels) * 100;
        let severity = 'low';
        if (percentage > 20)
            severity = 'critical';
        else if (percentage > 10)
            severity = 'high';
        else if (percentage > 5)
            severity = 'medium';
        return {
            region: region.name,
            mismatchedPixels,
            percentage,
            severity,
        };
    });
    // Identify concentrated areas (regions with > 5% difference)
    const concentratedAreas = regionDiffs
        .filter(r => r.percentage > 5)
        .map(r => r.region);
    // Determine dominant issue type based on pattern
    let dominantIssueType = 'color/style';
    if (dimensionMismatch) {
        dominantIssueType = 'layout/size';
    }
    else if (concentratedAreas.length > 6) {
        dominantIssueType = 'overall layout';
    }
    else if (concentratedAreas.length > 0 && concentratedAreas.some(a => a && a.includes('Top'))) {
        dominantIssueType = 'header/navigation';
    }
    else if (concentratedAreas.length > 0 && concentratedAreas.some(a => a && a.includes('Bottom'))) {
        dominantIssueType = 'footer';
    }
    // Calculate overall severity
    const maxPercentage = Math.max(...regionDiffs.map(r => r.percentage));
    let overallSeverity = 'none';
    if (maxPercentage > 20)
        overallSeverity = 'critical';
    else if (maxPercentage > 10)
        overallSeverity = 'high';
    else if (maxPercentage > 5)
        overallSeverity = 'medium';
    else if (maxPercentage > 0)
        overallSeverity = 'low';
    return {
        dimensionMismatch,
        actualDimensions: { width: actual.width, height: actual.height },
        expectedDimensions: { width: expected.width, height: expected.height },
        regionDiffs,
        dominantIssueType,
        concentratedAreas,
        overallSeverity,
    };
}
/**
 * Generate visual issues based on diff analysis
 */
function generateIssues(analysis) {
    const issues = [];
    // Dimension mismatch issue
    if (analysis.dimensionMismatch) {
        issues.push({
            category: 'size',
            severity: 'critical',
            description: 'Page dimensions do not match design specifications',
            location: 'Overall layout',
            details: `Expected: ${analysis.expectedDimensions.width}x${analysis.expectedDimensions.height}px, ` +
                `Actual: ${analysis.actualDimensions.width}x${analysis.actualDimensions.height}px`,
        });
    }
    // Region-specific issues
    analysis.regionDiffs.forEach(region => {
        if (region.percentage > 10) {
            let category = 'layout';
            let description = '';
            if (region.region.includes('Top')) {
                category = 'layout';
                description = 'Significant differences in header/top section';
            }
            else if (region.region.includes('Bottom')) {
                category = 'layout';
                description = 'Significant differences in footer/bottom section';
            }
            else if (region.region === 'Center') {
                category = 'element';
                description = 'Main content area has visual differences';
            }
            else {
                category = 'spacing';
                description = `Layout differences detected in ${region.region.toLowerCase()} area`;
            }
            issues.push({
                category,
                severity: region.severity,
                description,
                location: region.region,
                details: `${region.percentage.toFixed(2)}% of pixels differ in this region`,
            });
        }
        else if (region.percentage > 2) {
            issues.push({
                category: 'color',
                severity: region.severity,
                description: 'Minor color or style differences detected',
                location: region.region,
                details: `${region.percentage.toFixed(2)}% pixel difference - likely styling or color variance`,
            });
        }
    });
    // Spacing/alignment issue if differences are scattered
    if (analysis.concentratedAreas.length > 4 && analysis.concentratedAreas.length < 8) {
        issues.push({
            category: 'spacing',
            severity: 'medium',
            description: 'Multiple areas show spacing or alignment differences',
            location: 'Multiple regions',
            details: `Affected areas: ${analysis.concentratedAreas.join(', ')}`,
        });
    }
    return issues;
}
/**
 * Generate a comprehensive textual report
 */
function generateTextualReport(testName, mismatchedPixels, totalPixels, diffPercentage, passed, analysis, issues, filePaths) {
    const timestamp = new Date().toISOString();
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const statusEmoji = passed ? '✅' : '❌';
    let report = '';
    report += '═'.repeat(80) + '\n';
    report += `VISUAL REGRESSION TEST REPORT\n`;
    report += '═'.repeat(80) + '\n\n';
    // Executive Summary
    report += `📋 TEST: ${testName}\n`;
    report += `📅 DATE: ${timestamp}\n`;
    report += `${statusEmoji} STATUS: ${status}\n`;
    report += `⚠️  SEVERITY: ${analysis.overallSeverity.toUpperCase()}\n\n`;
    // Overall Statistics
    report += '─'.repeat(80) + '\n';
    report += '📊 COMPARISON STATISTICS\n';
    report += '─'.repeat(80) + '\n';
    report += `Total Pixels:        ${totalPixels.toLocaleString()}\n`;
    report += `Mismatched Pixels:   ${mismatchedPixels.toLocaleString()}\n`;
    report += `Difference:          ${diffPercentage.toFixed(4)}%\n`;
    report += `Threshold:           5.00% (configurable)\n\n`;
    // Dimension Analysis
    report += '─'.repeat(80) + '\n';
    report += '📐 DIMENSION ANALYSIS\n';
    report += '─'.repeat(80) + '\n';
    if (analysis.dimensionMismatch) {
        report += `⚠️  MISMATCH DETECTED!\n`;
        report += `Expected: ${analysis.expectedDimensions.width} x ${analysis.expectedDimensions.height} px\n`;
        report += `Actual:   ${analysis.actualDimensions.width} x ${analysis.actualDimensions.height} px\n\n`;
    }
    else {
        report += `✅ Dimensions match: ${analysis.actualDimensions.width} x ${analysis.actualDimensions.height} px\n\n`;
    }
    // Region Breakdown
    report += '─'.repeat(80) + '\n';
    report += '🗺️  REGION-BY-REGION BREAKDOWN\n';
    report += '─'.repeat(80) + '\n';
    report += `${'Region'.padEnd(20)} ${'Diff %'.padEnd(12)} ${'Severity'.padEnd(12)} Status\n`;
    report += '─'.repeat(80) + '\n';
    analysis.regionDiffs.forEach(region => {
        const regionName = region.region.padEnd(20);
        const percentage = `${region.percentage.toFixed(2)}%`.padEnd(12);
        const severity = region.severity.toUpperCase().padEnd(12);
        const statusIcon = region.percentage > 5 ? '❌' : region.percentage > 1 ? '⚠️ ' : '✅';
        report += `${regionName} ${percentage} ${severity} ${statusIcon}\n`;
    });
    report += '\n';
    // Key Issues
    if (issues.length > 0) {
        report += '─'.repeat(80) + '\n';
        report += '🔍 KEY VISUAL ISSUES DETECTED\n';
        report += '─'.repeat(80) + '\n';
        const criticalIssues = issues.filter(i => i.severity === 'critical');
        const highIssues = issues.filter(i => i.severity === 'high');
        const mediumIssues = issues.filter(i => i.severity === 'medium');
        const lowIssues = issues.filter(i => i.severity === 'low');
        if (criticalIssues.length > 0) {
            report += `\n🔴 CRITICAL (${criticalIssues.length}):\n`;
            criticalIssues.forEach((issue, idx) => {
                report += `\n${idx + 1}. ${issue.description}\n`;
                report += `   Category: ${issue.category.toUpperCase()}\n`;
                report += `   Location: ${issue.location}\n`;
                report += `   Details:  ${issue.details}\n`;
            });
        }
        if (highIssues.length > 0) {
            report += `\n🟠 HIGH (${highIssues.length}):\n`;
            highIssues.forEach((issue, idx) => {
                report += `\n${idx + 1}. ${issue.description}\n`;
                report += `   Category: ${issue.category.toUpperCase()}\n`;
                report += `   Location: ${issue.location}\n`;
                report += `   Details:  ${issue.details}\n`;
            });
        }
        if (mediumIssues.length > 0) {
            report += `\n🟡 MEDIUM (${mediumIssues.length}):\n`;
            mediumIssues.forEach((issue, idx) => {
                report += `\n${idx + 1}. ${issue.description}\n`;
                report += `   Category: ${issue.category.toUpperCase()}\n`;
                report += `   Location: ${issue.location}\n`;
                report += `   Details:  ${issue.details}\n`;
            });
        }
        if (lowIssues.length > 0) {
            report += `\n🟢 LOW (${lowIssues.length}):\n`;
            lowIssues.forEach((issue, idx) => {
                report += `\n${idx + 1}. ${issue.description}\n`;
                report += `   Category: ${issue.category.toUpperCase()}\n`;
                report += `   Location: ${issue.location}\n`;
                report += `   Details:  ${issue.details}\n`;
            });
        }
        report += '\n';
    }
    else {
        report += '─'.repeat(80) + '\n';
        report += '✅ NO SIGNIFICANT ISSUES DETECTED\n';
        report += '─'.repeat(80) + '\n\n';
    }
    // Issue Summary by Category
    if (issues.length > 0) {
        report += '─'.repeat(80) + '\n';
        report += '📑 ISSUE SUMMARY BY CATEGORY\n';
        report += '─'.repeat(80) + '\n';
        const categories = ['layout', 'size', 'color', 'spacing', 'element'];
        categories.forEach(cat => {
            const count = issues.filter(i => i.category === cat).length;
            if (count > 0) {
                report += `${cat.toUpperCase().padEnd(15)} ${count} issue${count > 1 ? 's' : ''}\n`;
            }
        });
        report += '\n';
    }
    // Concentrated Areas
    if (analysis.concentratedAreas.length > 0) {
        report += '─'.repeat(80) + '\n';
        report += '📍 AREAS WITH CONCENTRATED DIFFERENCES\n';
        report += '─'.repeat(80) + '\n';
        analysis.concentratedAreas.forEach(area => {
            report += `• ${area}\n`;
        });
        report += '\n';
    }
    // Recommendations
    report += '─'.repeat(80) + '\n';
    report += '💡 RECOMMENDATIONS\n';
    report += '─'.repeat(80) + '\n';
    if (!passed) {
        if (analysis.dimensionMismatch) {
            report += `• Fix page dimensions to match design: ${analysis.expectedDimensions.width}x${analysis.expectedDimensions.height}px\n`;
        }
        if (analysis.concentratedAreas.length > 0) {
            report += `• Focus on fixing differences in: ${analysis.concentratedAreas.slice(0, 3).join(', ')}\n`;
        }
        if (issues.some(i => i.category === 'color')) {
            report += `• Review CSS styles and color values against design specifications\n`;
        }
        if (issues.some(i => i.category === 'spacing')) {
            report += `• Check margins, padding, and alignment properties\n`;
        }
        if (issues.some(i => i.category === 'layout')) {
            report += `• Review layout structure and positioning\n`;
        }
    }
    else {
        report += `• Visual implementation matches design within acceptable threshold\n`;
        report += `• Monitor for regressions in future updates\n`;
    }
    report += '\n';
    // Generated Files
    report += '─'.repeat(80) + '\n';
    report += '📁 GENERATED FILES\n';
    report += '─'.repeat(80) + '\n';
    report += `Actual Screenshot:    ${filePaths.actual}\n`;
    report += `Expected Design:      ${filePaths.expected}\n`;
    report += `Diff Image:           ${filePaths.diff}\n`;
    report += `Side-by-Side:         ${filePaths.comparison}\n\n`;
    report += '═'.repeat(80) + '\n';
    report += 'END OF REPORT\n';
    report += '═'.repeat(80) + '\n';
    return report;
}
/**
 * Save report to file
 */
function saveReport(reportPath, reportContent) {
    const dir = require('path').dirname(reportPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(reportPath, reportContent, 'utf-8');
}
//# sourceMappingURL=report-generator.js.map