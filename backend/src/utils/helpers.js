/**
 * Shared utility/helper functions.
 */
const crypto = require('crypto');
const path = require('path');

/**
 * Generate a unique filename for uploaded files.
 * Format: timestamp-randomhex-originalname
 * @param {string} originalName - The original filename
 * @returns {string} - A unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  return `${timestamp}-${randomHex}-${baseName}${ext}`;
};

/**
 * Format file size to human-readable string.
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Allowed video MIME types.
 */
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-matroska',
  'video/ogg',
  'video/3gpp',
  'video/x-flv',
];

/**
 * Video processing status enum.
 */
const VIDEO_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  ANALYSING: 'analysing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

/**
 * Sensitivity classification enum.
 */
const SENSITIVITY = {
  PENDING: 'pending',
  SAFE: 'safe',
  FLAGGED: 'flagged',
};

/**
 * User roles enum.
 */
const ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
  ADMIN: 'admin',
};

module.exports = {
  generateUniqueFilename,
  formatFileSize,
  ALLOWED_VIDEO_TYPES,
  VIDEO_STATUS,
  SENSITIVITY,
  ROLES,
};
