"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadedFiles = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        // Create temporary upload directory for this request
        const comparisonId = req.body.comparisonId || Date.now().toString();
        const uploadDir = path_1.default.join(process.cwd(), 'storage', 'uploads', comparisonId);
        try {
            await fs_extra_1.default.ensureDir(uploadDir);
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        const baseName = path_1.default.basename(file.originalname, ext);
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, `${sanitizedBaseName}-${uniqueSuffix}${ext}`);
    },
});
// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type. Only PNG, JPG, JPEG, and WebP images are allowed. Received: ${file.mimetype}`));
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
        files: 100, // Max 100 files per request (50 pairs)
    },
});
// Middleware to validate uploaded files
const validateUploadedFiles = (req, res, next) => {
    const files = req.files;
    if (!files || (!files.designs && !files.screenshots)) {
        return res.status(400).json({
            error: 'No files uploaded',
            message: 'Please upload at least one design and one screenshot image',
        });
    }
    const designs = files.designs || [];
    const screenshots = files.screenshots || [];
    // Check if we have matching pairs
    if (designs.length === 0 || screenshots.length === 0) {
        return res.status(400).json({
            error: 'Incomplete upload',
            message: 'Both design images and screenshot images are required',
        });
    }
    // Check if the counts match
    if (designs.length !== screenshots.length) {
        return res.status(400).json({
            error: 'Mismatched file counts',
            message: `Number of design images (${designs.length}) must match number of screenshot images (${screenshots.length})`,
        });
    }
    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = [...designs, ...screenshots].filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
        return res.status(400).json({
            error: 'File too large',
            message: `Files must be smaller than 10MB. Found ${oversizedFiles.length} file(s) exceeding this limit`,
            files: oversizedFiles.map((f) => f.originalname),
        });
    }
    next();
};
exports.validateUploadedFiles = validateUploadedFiles;
//# sourceMappingURL=upload.middleware.js.map