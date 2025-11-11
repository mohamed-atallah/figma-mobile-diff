"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const upload_middleware_1 = require("../middleware/upload.middleware");
const storage_1 = require("../../db/storage");
const image_compare_1 = require("../../../core/comparison/image-compare");
const report_generator_1 = require("../../../core/comparison/report-generator");
const router = express_1.default.Router();
// POST /api/comparisons - Create new comparison with batch upload
router.post('/', upload_middleware_1.upload.fields([
    { name: 'designs', maxCount: 50 },
    { name: 'screenshots', maxCount: 50 },
]), upload_middleware_1.validateUploadedFiles, async (req, res) => {
    try {
        const files = req.files;
        const designs = files.designs || [];
        const screenshots = files.screenshots || [];
        const { projectName, devicePreset, threshold, pixelmatchThreshold } = req.body;
        // Validate project name
        if (!projectName || projectName.trim() === '') {
            return res.status(400).json({
                error: 'Project name required',
                message: 'Please provide a project name for this comparison',
            });
        }
        // Create comparison record
        const comparison = await storage_1.storage.createComparison({
            projectName: projectName.trim(),
            devicePreset: devicePreset || undefined,
            totalPairs: designs.length,
        });
        // Process each pair asynchronously
        processComparisonPairs(comparison.id, designs, screenshots, {
            threshold: threshold ? parseFloat(threshold) : 0.05,
            pixelmatchThreshold: pixelmatchThreshold ? parseFloat(pixelmatchThreshold) : 0.1,
        }).catch((error) => {
            console.error('Error processing comparison pairs:', error);
        });
        // Return immediately with comparison ID
        res.status(202).json({
            message: 'Comparison started',
            comparisonId: comparison.id,
            totalPairs: designs.length,
            statusUrl: `/api/comparisons/${comparison.id}`,
        });
    }
    catch (error) {
        console.error('Error creating comparison:', error);
        res.status(500).json({
            error: 'Failed to create comparison',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/comparisons - List all comparisons with filtering
router.get('/', async (req, res) => {
    try {
        const { limit = '50', offset = '0', projectName, devicePreset, } = req.query;
        const result = await storage_1.storage.getAllComparisons({
            limit: parseInt(limit),
            offset: parseInt(offset),
            projectName: projectName,
            devicePreset: devicePreset,
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching comparisons:', error);
        res.status(500).json({
            error: 'Failed to fetch comparisons',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/comparisons/stats - Get statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await storage_1.storage.getStats();
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Failed to fetch stats',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/comparisons/:id - Get specific comparison
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const comparison = await storage_1.storage.getComparison(id);
        if (!comparison) {
            return res.status(404).json({
                error: 'Comparison not found',
                message: `No comparison found with ID: ${id}`,
            });
        }
        res.json(comparison);
    }
    catch (error) {
        console.error('Error fetching comparison:', error);
        res.status(500).json({
            error: 'Failed to fetch comparison',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/comparisons/:id/files/:pairId/:type - Download specific file
router.get('/:id/files/:pairId/:type', async (req, res) => {
    try {
        const { id, pairId, type } = req.params;
        const comparison = await storage_1.storage.getComparison(id);
        if (!comparison) {
            return res.status(404).json({ error: 'Comparison not found' });
        }
        const pair = comparison.pairs.find((p) => p.id === pairId);
        if (!pair) {
            return res.status(404).json({ error: 'Pair not found' });
        }
        let filePath;
        switch (type) {
            case 'design':
                filePath = pair.designPath;
                break;
            case 'screenshot':
                filePath = pair.screenshotPath;
                break;
            case 'diff':
                filePath = pair.diffPath;
                break;
            case 'comparison':
                filePath = pair.comparisonPath;
                break;
            case 'report':
                filePath = pair.reportPath;
                return res.type('text/plain').sendFile(path_1.default.resolve(filePath));
            default:
                return res.status(400).json({ error: 'Invalid file type' });
        }
        if (!(await fs_extra_1.default.pathExists(filePath))) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.sendFile(path_1.default.resolve(filePath));
    }
    catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({
            error: 'Failed to fetch file',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// DELETE /api/comparisons/:id - Delete comparison
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await storage_1.storage.deleteComparison(id);
        if (!deleted) {
            return res.status(404).json({
                error: 'Comparison not found',
                message: `No comparison found with ID: ${id}`,
            });
        }
        res.json({ message: 'Comparison deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting comparison:', error);
        res.status(500).json({
            error: 'Failed to delete comparison',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Helper function to process comparison pairs asynchronously
async function processComparisonPairs(comparisonId, designs, screenshots, options) {
    const outputDir = path_1.default.join(process.cwd(), 'storage', 'output', comparisonId);
    await fs_extra_1.default.ensureDir(outputDir);
    for (let i = 0; i < designs.length; i++) {
        const design = designs[i];
        const screenshot = screenshots[i];
        const pairId = (0, uuid_1.v4)();
        const diffPath = path_1.default.join(outputDir, `pair-${i + 1}-diff.png`);
        const comparisonPath = path_1.default.join(outputDir, `pair-${i + 1}-comparison.png`);
        const reportPath = path_1.default.join(outputDir, `pair-${i + 1}-report.txt`);
        try {
            // Perform comparison
            const result = await (0, image_compare_1.compareImages)(screenshot.path, design.path, diffPath, {
                threshold: options.threshold,
                pixelmatchThreshold: options.pixelmatchThreshold,
            });
            // Generate side-by-side comparison
            (0, image_compare_1.generateSideBySideComparison)(screenshot.path, design.path, comparisonPath);
            // Generate textual report
            const analysis = (0, report_generator_1.analyzeDiffRegions)(screenshot.path, design.path, diffPath);
            const issues = (0, report_generator_1.generateIssues)(analysis);
            const reportContent = (0, report_generator_1.generateTextualReport)(`Pair ${i + 1}`, result.mismatchedPixels, result.totalPixels, result.diffPercentage, result.passed, analysis, issues, {
                actual: screenshot.path,
                expected: design.path,
                diff: diffPath,
                comparison: comparisonPath,
            });
            (0, report_generator_1.saveReport)(reportPath, reportContent);
            // Create pair record
            const pair = {
                id: pairId,
                designPath: design.path,
                screenshotPath: screenshot.path,
                diffPath,
                comparisonPath,
                reportPath,
                mismatchPercentage: result.diffPercentage,
                status: result.passed ? 'success' : 'failed',
            };
            // Add to storage
            await storage_1.storage.addComparisonPair(comparisonId, pair);
            console.log(`✓ Processed pair ${i + 1}/${designs.length} - ${result.passed ? 'PASS' : 'FAIL'} (${result.diffPercentage.toFixed(2)}% diff)`);
        }
        catch (error) {
            console.error(`Error processing pair ${i + 1}:`, error);
            // Create failed pair record
            const pair = {
                id: pairId,
                designPath: design.path,
                screenshotPath: screenshot.path,
                diffPath: '',
                comparisonPath: '',
                reportPath: '',
                mismatchPercentage: 100,
                status: 'failed',
            };
            await storage_1.storage.addComparisonPair(comparisonId, pair);
        }
    }
    // Update comparison status
    await storage_1.storage.updateComparison(comparisonId, { status: 'completed' });
    console.log(`✓ Completed comparison ${comparisonId}`);
}
exports.default = router;
//# sourceMappingURL=comparison.routes.js.map