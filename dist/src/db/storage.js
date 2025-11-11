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
exports.storage = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const STORAGE_FILE = path.join(process.cwd(), 'storage', 'database.json');
class StorageManager {
    constructor() {
        this.db = { comparisons: [], version: '1.0.0' };
        this.initializeDatabase();
    }
    async initializeDatabase() {
        try {
            if (await fs.pathExists(STORAGE_FILE)) {
                const data = await fs.readJSON(STORAGE_FILE);
                this.db = data;
            }
            else {
                await fs.ensureDir(path.dirname(STORAGE_FILE));
                await this.saveDatabase();
            }
        }
        catch (error) {
            console.error('Error initializing database:', error);
            throw new Error('Failed to initialize storage');
        }
    }
    async saveDatabase() {
        try {
            await fs.writeJSON(STORAGE_FILE, this.db, { spaces: 2 });
        }
        catch (error) {
            console.error('Error saving database:', error);
            throw new Error('Failed to save to storage');
        }
    }
    async createComparison(data) {
        const comparison = {
            id: (0, uuid_1.v4)(),
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
    async getComparison(id) {
        return this.db.comparisons.find((c) => c.id === id) || null;
    }
    async getAllComparisons(options) {
        let filtered = [...this.db.comparisons];
        // Apply filters
        if (options?.projectName) {
            filtered = filtered.filter((c) => c.projectName.toLowerCase().includes(options.projectName.toLowerCase()));
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
    async updateComparison(id, updates) {
        const index = this.db.comparisons.findIndex((c) => c.id === id);
        if (index === -1)
            return null;
        this.db.comparisons[index] = {
            ...this.db.comparisons[index],
            ...updates,
        };
        await this.saveDatabase();
        return this.db.comparisons[index];
    }
    async addComparisonPair(comparisonId, pair) {
        const comparison = await this.getComparison(comparisonId);
        if (!comparison)
            return null;
        comparison.pairs.push(pair);
        // Update counts
        if (pair.status === 'success') {
            comparison.passedPairs++;
        }
        else {
            comparison.failedPairs++;
        }
        // Update overall status if all pairs are processed
        if (comparison.pairs.length === comparison.totalPairs) {
            comparison.status = comparison.failedPairs === 0 ? 'completed' : 'completed';
        }
        return await this.updateComparison(comparisonId, comparison);
    }
    async deleteComparison(id) {
        const index = this.db.comparisons.findIndex((c) => c.id === id);
        if (index === -1)
            return false;
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
        }
        catch (error) {
            console.error('Error deleting comparison files:', error);
        }
        // Remove from database
        this.db.comparisons.splice(index, 1);
        await this.saveDatabase();
        return true;
    }
    async getStats() {
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
    async cleanupOldComparisons(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const toDelete = this.db.comparisons.filter((c) => new Date(c.timestamp) < cutoffDate);
        for (const comparison of toDelete) {
            await this.deleteComparison(comparison.id);
        }
        return toDelete.length;
    }
}
// Export singleton instance
exports.storage = new StorageManager();
//# sourceMappingURL=storage.js.map