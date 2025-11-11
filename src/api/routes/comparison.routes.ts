import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { upload, validateUploadedFiles } from '../middleware/upload.middleware';
import { storage, ComparisonPair } from '../../db/storage';
import { compareImages, generateSideBySideComparison } from '../../../core/comparison/image-compare';
import { analyzeDiffRegions, generateIssues, generateTextualReport, saveReport } from '../../../core/comparison/report-generator';

const router = express.Router();

// POST /api/comparisons - Create new comparison with batch upload
router.post(
  '/',
  upload.fields([
    { name: 'designs', maxCount: 50 },
    { name: 'screenshots', maxCount: 50 },
  ]),
  validateUploadedFiles,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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
      const comparison = await storage.createComparison({
        projectName: projectName.trim(),
        devicePreset: devicePreset || undefined,
        totalPairs: designs.length,
      });

      // Process each pair asynchronously
      processComparisonPairs(
        comparison.id,
        designs,
        screenshots,
        {
          threshold: threshold ? parseFloat(threshold) : 0.05,
          pixelmatchThreshold: pixelmatchThreshold ? parseFloat(pixelmatchThreshold) : 0.1,
        }
      ).catch((error) => {
        console.error('Error processing comparison pairs:', error);
      });

      // Return immediately with comparison ID
      res.status(202).json({
        message: 'Comparison started',
        comparisonId: comparison.id,
        totalPairs: designs.length,
        statusUrl: `/api/comparisons/${comparison.id}`,
      });
    } catch (error) {
      console.error('Error creating comparison:', error);
      res.status(500).json({
        error: 'Failed to create comparison',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/comparisons - List all comparisons with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      offset = '0',
      projectName,
      devicePreset,
    } = req.query;

    const result = await storage.getAllComparisons({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      projectName: projectName as string,
      devicePreset: devicePreset as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({
      error: 'Failed to fetch comparisons',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/comparisons/stats - Get statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/comparisons/:id - Get specific comparison
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const comparison = await storage.getComparison(id);

    if (!comparison) {
      return res.status(404).json({
        error: 'Comparison not found',
        message: `No comparison found with ID: ${id}`,
      });
    }

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({
      error: 'Failed to fetch comparison',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/comparisons/:id/files/:pairId/:type - Download specific file
router.get('/:id/files/:pairId/:type', async (req: Request, res: Response) => {
  try {
    const { id, pairId, type } = req.params;

    const comparison = await storage.getComparison(id);
    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    const pair = comparison.pairs.find((p) => p.id === pairId);
    if (!pair) {
      return res.status(404).json({ error: 'Pair not found' });
    }

    let filePath: string;
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
        return res.type('text/plain').sendFile(path.resolve(filePath));
      default:
        return res.status(400).json({ error: 'Invalid file type' });
    }

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      error: 'Failed to fetch file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/comparisons/:id - Delete comparison
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteComparison(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Comparison not found',
        message: `No comparison found with ID: ${id}`,
      });
    }

    res.json({ message: 'Comparison deleted successfully' });
  } catch (error) {
    console.error('Error deleting comparison:', error);
    res.status(500).json({
      error: 'Failed to delete comparison',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to process comparison pairs asynchronously
async function processComparisonPairs(
  comparisonId: string,
  designs: Express.Multer.File[],
  screenshots: Express.Multer.File[],
  options: { threshold: number; pixelmatchThreshold: number }
) {
  const outputDir = path.join(process.cwd(), 'storage', 'output', comparisonId);
  await fs.ensureDir(outputDir);

  for (let i = 0; i < designs.length; i++) {
    const design = designs[i];
    const screenshot = screenshots[i];

    const pairId = uuidv4();
    const diffPath = path.join(outputDir, `pair-${i + 1}-diff.png`);
    const comparisonPath = path.join(outputDir, `pair-${i + 1}-comparison.png`);
    const reportPath = path.join(outputDir, `pair-${i + 1}-report.txt`);

    try {
      // Perform comparison
      const result = await compareImages(
        screenshot.path,
        design.path,
        diffPath,
        {
          threshold: options.threshold,
          pixelmatchThreshold: options.pixelmatchThreshold,
        }
      );

      // Generate side-by-side comparison
      generateSideBySideComparison(
        screenshot.path,
        design.path,
        comparisonPath
      );

      // Generate textual report
      const analysis = analyzeDiffRegions(screenshot.path, design.path, diffPath);
      const issues = generateIssues(analysis);
      const reportContent = generateTextualReport(
        `Pair ${i + 1}`,
        result.mismatchedPixels,
        result.totalPixels,
        result.diffPercentage,
        result.passed,
        analysis,
        issues,
        {
          actual: screenshot.path,
          expected: design.path,
          diff: diffPath,
          comparison: comparisonPath,
        }
      );
      saveReport(reportPath, reportContent);

      // Create pair record
      const pair: ComparisonPair = {
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
      await storage.addComparisonPair(comparisonId, pair);

      console.log(`✓ Processed pair ${i + 1}/${designs.length} - ${result.passed ? 'PASS' : 'FAIL'} (${result.diffPercentage.toFixed(2)}% diff)`);
    } catch (error) {
      console.error(`Error processing pair ${i + 1}:`, error);

      // Create failed pair record
      const pair: ComparisonPair = {
        id: pairId,
        designPath: design.path,
        screenshotPath: screenshot.path,
        diffPath: '',
        comparisonPath: '',
        reportPath: '',
        mismatchPercentage: 100,
        status: 'failed',
      };

      await storage.addComparisonPair(comparisonId, pair);
    }
  }

  // Update comparison status
  await storage.updateComparison(comparisonId, { status: 'completed' });
  console.log(`✓ Completed comparison ${comparisonId}`);
}

export default router;
