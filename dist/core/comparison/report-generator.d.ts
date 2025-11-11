export interface RegionDiff {
    region: string;
    mismatchedPixels: number;
    percentage: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface DiffAnalysis {
    dimensionMismatch: boolean;
    actualDimensions: {
        width: number;
        height: number;
    };
    expectedDimensions: {
        width: number;
        height: number;
    };
    regionDiffs: RegionDiff[];
    dominantIssueType: string;
    concentratedAreas: string[];
    overallSeverity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}
export interface VisualIssue {
    category: 'layout' | 'size' | 'color' | 'spacing' | 'element';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location: string;
    details: string;
}
/**
 * Analyze diff image to identify specific regions with differences
 * Optimized to use single-pass iteration and cached images
 */
export declare function analyzeDiffRegions(actualImagePath: string, expectedImagePath: string, diffImagePath: string): DiffAnalysis;
/**
 * Generate visual issues based on diff analysis
 */
export declare function generateIssues(analysis: DiffAnalysis): VisualIssue[];
/**
 * Generate a comprehensive textual report
 */
export declare function generateTextualReport(testName: string, mismatchedPixels: number, totalPixels: number, diffPercentage: number, passed: boolean, analysis: DiffAnalysis, issues: VisualIssue[], filePaths: {
    actual: string;
    expected: string;
    diff: string;
    comparison: string;
}): string;
/**
 * Save report to file
 */
export declare function saveReport(reportPath: string, reportContent: string): void;
