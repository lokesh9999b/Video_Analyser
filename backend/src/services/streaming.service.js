/**
 * Video Streaming Service.
 * Handles HTTP range requests for progressive video playback.
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Stream a video file with HTTP range request support.
 * Supports partial content (206) for seeking and progressive playback.
 *
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} filePath - Absolute path to the video file
 */
const streamVideo = (req, res, filePath) => {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      logger.error(`Stream error: file not found at ${filePath}`);
      return res.status(404).json({
        success: false,
        message: 'Video file not found.',
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const mimeType = getMimeType(filePath);

    const range = req.headers.range;

    if (range) {
      // Parse Range header: "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        res.writeHead(416, {
          'Content-Range': `bytes */${fileSize}`,
        });
        return res.end();
      }

      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      });

      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error(`Stream pipe error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Streaming error.' });
        }
      });
    } else {
      // No Range header — send the entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);

      stream.on('error', (err) => {
        logger.error(`Stream pipe error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Streaming error.' });
        }
      });
    }
  } catch (error) {
    logger.error(`Streaming service error: ${error.message}`);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to stream video.',
      });
    }
  }
};

/**
 * Get MIME type from file extension.
 * @param {string} filePath - Path to the file
 * @returns {string} - MIME type string
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.ogg': 'video/ogg',
    '.3gp': 'video/3gpp',
    '.flv': 'video/x-flv',
  };
  return mimeMap[ext] || 'video/mp4';
};

module.exports = { streamVideo };
