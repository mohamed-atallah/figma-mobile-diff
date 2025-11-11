export interface ComparisonPair {
    id: string;
    designPath: string;
    screenshotPath: string;
    diffPath: string;
    comparisonPath: string;
    reportPath: string;
    mismatchPercentage: number;
    status: 'success' | 'failed';
    cropRegions?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
}
export interface Comparison {
    id: string;
    projectName: string;
    devicePreset?: string;
    timestamp: string;
    status: 'processing' | 'completed' | 'failed';
    pairs: ComparisonPair[];
    totalPairs: number;
    passedPairs: number;
    failedPairs: number;
}
export interface Database {
    comparisons: Comparison[];
    version: string;
}
declare class StorageManager {
    private db;
    constructor();
    private initializeDatabase;
    private saveDatabase;
    createComparison(data: {
        projectName: string;
        devicePreset?: string;
        totalPairs: number;
    }): Promise<Comparison>;
    getComparison(id: string): Promise<Comparison | null>;
    getAllComparisons(options?: {
        limit?: number;
        offset?: number;
        projectName?: string;
        devicePreset?: string;
    }): Promise<{
        comparisons: Comparison[];
        total: number;
    }>;
    updateComparison(id: string, updates: Partial<Comparison>): Promise<Comparison | null>;
    addComparisonPair(comparisonId: string, pair: ComparisonPair): Promise<Comparison | null>;
    deleteComparison(id: string): Promise<boolean>;
    getStats(): Promise<{
        totalComparisons: number;
        completedComparisons: number;
        failedComparisons: number;
        processingComparisons: number;
    }>;
    cleanupOldComparisons(daysOld?: number): Promise<number>;
}
export declare const storage: StorageManager;
export {};
