import multer from 'multer';
import { Request } from 'express';
export declare const upload: multer.Multer;
export declare const validateUploadedFiles: (req: Request, res: any, next: any) => any;
