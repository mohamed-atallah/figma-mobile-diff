import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { Request } from 'express';

// Configure storage
const storage = multer.diskStorage({
  destination: async (req: Request, file, cb) => {
    // Create temporary upload directory for this request
    const comparisonId = req.body.comparisonId || Date.now().toString();
    const uploadDir = path.join(process.cwd(), 'storage', 'uploads', comparisonId);

    try {
      await fs.ensureDir(uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    cb(null, `${sanitizedBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only PNG, JPG, JPEG, and WebP images are allowed. Received: ${file.mimetype}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 100, // Max 100 files per request (50 pairs)
  },
});

// Middleware to validate uploaded files
export const validateUploadedFiles = (req: Request, res: any, next: any) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

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
  const oversizedFiles = [...designs, ...screenshots].filter(
    (file) => file.size > maxSize
  );

  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      error: 'File too large',
      message: `Files must be smaller than 10MB. Found ${oversizedFiles.length} file(s) exceeding this limit`,
      files: oversizedFiles.map((f) => f.originalname),
    });
  }

  next();
};
