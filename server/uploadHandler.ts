import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure the upload directories exist
const createUploadsDir = () => {
  const dirs = [
    'uploads',
    'uploads/specialist-programs'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call this function to ensure directories exist
createUploadsDir();

// Configure storage for specialist program images
const specialistProgramStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/specialist-programs');
  },
  filename: (req, file, cb) => {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'program-' + uniqueSuffix + ext);
  }
});

// File filter to only allow images
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'));
  }
  cb(null, true);
};

// Create multer upload instance for specialist program images
export const uploadSpecialistProgramImage = multer({
  storage: specialistProgramStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: imageFilter
}).single('image'); // 'image' is the field name in the form