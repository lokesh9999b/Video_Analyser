/**
 * Multer configuration for video file uploads.
 * Handles disk storage, file filtering, and size limits.
 */
const multer = require('multer');
const path = require('path');
const { generateUniqueFilename, ALLOWED_VIDEO_TYPES } = require('../utils/helpers');
const config = require('../config/env');

// Storage configuration — save to uploads/ directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter — only allow video MIME types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// Multer instance with size limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024, // Convert MB to bytes
    files: 1, // Single file upload
  },
});

module.exports = upload;
