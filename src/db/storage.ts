import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_FILE = path.join(process.cwd(), 'storage', 'database.json');

export interface ComparisonPair {
  id: string;
  designPath: string;
  screenshotPath: string;
  diffPath: string;
  comparisonPath: string;
  reportPath: string;
  mismatchPercentage: number;
  status: 'success' | 'failed';
  cropRegions?: Array<{ x: number; y: number; width: number; height: number }>;
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

class StorageManager {
  private db: Database;

  constructor() {
    this.db = { comparisons: [], version: '1.0.0' };
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      if (await fs.pathExists(STORAGE_FILE)) {
        const data = await fs.readJSON(STORAGE_FILE);
        this.db = data;
      } else {
        await fs.ensureDir(path.dirname(STORAGE_FILE));
        await this.saveDatabase();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw new Error('Failed to initialize storage');
    }
  }

  private async saveDatabase(): Promise<void> {
    try {
      await fs.writeJSON(STORAGE_FILE, this.db, { spaces: 2 });
    } catch (error) {
      console.error('Error saving database:', error);
      throw new Error('Failed to save to storage');
    }
  }

  async createComparison(data: {
    projectName: string;
    devicePreset?: string;
    totalPairs: number;
  }): Promise<Comparison> {
    const comparison: Comparison = {
      id: uuidv4(),
      projectName: data.projectName,
      devicePreset: data.devicePreset,
      timestamp: new Date().toISOString(),
      status: 'processing',
      pairs: [],
      totalPairs: data.totalPairs,
      passedPairs: 0,
      failedPairs: 0,
    };

    this.db.comparisons.unshift(comparison); // Add to beginning for recent-first order
    await this.saveDatabase();

    return comparison;
  }

  async getComparison(id: string): Promise<Comparison | null> {
    return this.db.comparisons.find((c) => c.id === id) || null;
  }

  async getAllComparisons(options?: {
    limit?: number;
    offset?: number;
    projectName?: string;
    devicePreset?: string;
  }): Promise<{ comparisons: Comparison[]; total: number }> {
    let filtered = [...this.db.comparisons];

    // Apply filters
    if (options?.projectName) {
      filtered = filtered.filter((c) =>
        c.projectName.toLowerCase().includes(options.projectName!.toLowerCase())
      );
    }

    if (options?.devicePreset) {
      filtered = filtered.filter((c) => c.devicePreset === options.devicePreset);
    }

    const total = filtered.length;

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    const paginated = filtered.slice(offset, offset + limit);

    return { comparisons: paginated, total };
  }

  async updateComparison(id: string, updates: Partial<Comparison>): Promise<Comparison | null> {
    const index = this.db.comparisons.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.db.comparisons[index] = {
      ...this.db.comparisons[index],
      ...updates,
    };

    await this.saveDatabase();
    return this.db.comparisons[index];
  }

  async addComparisonPair(comparisonId: string, pair: ComparisonPair): Promise<Comparison | null> {
    const comparison = await this.getComparison(comparisonId);
    if (!comparison) return null;

    comparison.pairs.push(pair);

    // Update counts
    if (pair.status === 'success') {
      comparison.passedPairs++;
    } else {
      comparison.failedPairs++;
    }

    // Update overall status if all pairs are processed
    if (comparison.pairs.length === comparison.totalPairs) {
      comparison.status = comparison.failedPairs === 0 ? 'completed' : 'completed';
    }

    return await this.updateComparison(comparisonId, comparison);
  }

  async deleteComparison(id: string): Promise<boolean> {
    const index = this.db.comparisons.findIndex((c) => c.id === id);
    if (index === -1) return false;

    // Get comparison to delete associated files
    const comparison = this.db.comparisons[index];

    // Delete all files associated with this comparison
    try {
      const uploadsDir = path.join(process.cwd(), 'storage', 'uploads', id);
      const outputDir = path.join(process.cwd(), 'storage', 'output', id);

      if (await fs.pathExists(uploadsDir)) {
        await fs.remove(uploadsDir);
      }

      if (await fs.pathExists(outputDir)) {
        await fs.remove(outputDir);
      }
    } catch (error) {
      console.error('Error deleting comparison files:', error);
    }

    // Remove from database
    this.db.comparisons.splice(index, 1);
    await this.saveDatabase();

    return true;
  }

  async getStats(): Promise<{
    totalComparisons: number;
    completedComparisons: number;
    failedComparisons: number;
    processingComparisons: number;
  }> {
    const total = this.db.comparisons.length;
    const completed = this.db.comparisons.filter((c) => c.status === 'completed').length;
    const failed = this.db.comparisons.filter((c) => c.status === 'failed').length;
    const processing = this.db.comparisons.filter((c) => c.status === 'processing').length;

    return {
      totalComparisons: total,
      completedComparisons: completed,
      failedComparisons: failed,
      processingComparisons: processing,
    };
  }

  async cleanupOldComparisons(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const toDelete = this.db.comparisons.filter(
      (c) => new Date(c.timestamp) < cutoffDate
    );

    for (const comparison of toDelete) {
      await this.deleteComparison(comparison.id);
    }

    return toDelete.length;
  }
}

// Export singleton instance
export const storage = new StorageManager();
