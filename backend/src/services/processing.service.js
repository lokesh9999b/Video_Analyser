/**
 * Video Processing Pipeline Service.
 *
 * Orchestrates the full processing pipeline after a video is uploaded:
 *   1. Extract metadata (duration, resolution) via FFmpeg
 *   2. Generate thumbnail
 *   3. Run sensitivity analysis
 *   4. Transcode to streaming-optimised MP4 (H.264)
 *   5. Update status to completed
 *
 * Emits Socket.io events at each stage for real-time frontend updates.
 */
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const Video = require('../models/Video');
const { analyseVideo } = require('./sensitivity.service');
const { emitToUser } = require('../config/socket');
const { VIDEO_STATUS } = require('../utils/helpers');
const logger = require('../utils/logger');

// Set bundled FFmpeg/FFprobe paths (works on Render, Heroku, etc.)
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Process a newly uploaded video through the full pipeline.
 *
 * @param {string} videoId - The MongoDB document ID
 * @param {string} userId - The uploading user's ID
 */
const processVideo = async (videoId, userId) => {
  let video;

  try {
    video = await Video.findById(videoId);
    if (!video) {
      logger.error(`Processing error: Video ${videoId} not found`);
      return;
    }

    const filePath = video.filePath;

    // Emit helper
    const emitProgress = (stage, progress, message) => {
      emitToUser(userId, 'video:processing', {
        videoId: video._id,
        stage,
        progress,
        message,
      });
    };

    // ───────────────────────────────────────────
    // Stage 1: Extract Metadata
    // ───────────────────────────────────────────
    emitProgress(VIDEO_STATUS.PROCESSING, 5, 'Extracting video metadata...');
    await updateVideoStatus(videoId, VIDEO_STATUS.PROCESSING, 5);

    const metadata = await extractMetadata(filePath);
    logger.info(`Metadata extracted: ${JSON.stringify(metadata)}`);

    await Video.findByIdAndUpdate(videoId, {
      duration: metadata.duration,
      resolution: { width: metadata.width, height: metadata.height },
      processingProgress: 15,
    });

    emitProgress(VIDEO_STATUS.PROCESSING, 15, 'Metadata extracted successfully.');

    // ───────────────────────────────────────────
    // Stage 2: Generate Thumbnail
    // ───────────────────────────────────────────
    emitProgress(VIDEO_STATUS.PROCESSING, 20, 'Generating thumbnail...');

    const thumbnailPath = await generateThumbnail(filePath, videoId);
    await Video.findByIdAndUpdate(videoId, {
      thumbnailPath,
      processingProgress: 25,
    });

    emitProgress(VIDEO_STATUS.PROCESSING, 25, 'Thumbnail generated.');

    // ───────────────────────────────────────────
    // Stage 3: Sensitivity Analysis
    // ───────────────────────────────────────────
    emitProgress(VIDEO_STATUS.ANALYSING, 30, 'Starting content sensitivity analysis...');
    await updateVideoStatus(videoId, VIDEO_STATUS.ANALYSING, 30);

    const analysisResult = await analyseVideo(
      filePath,
      metadata.duration || 10,
      (progress, message) => {
        // Map analysis progress (0-100) to pipeline progress (30-80)
        const mappedProgress = 30 + Math.floor(progress * 0.5);
        emitProgress(VIDEO_STATUS.ANALYSING, mappedProgress, message);
        // Update DB progress periodically
        Video.findByIdAndUpdate(videoId, { processingProgress: mappedProgress }).catch(() => {});
      }
    );

    await Video.findByIdAndUpdate(videoId, {
      sensitivity: analysisResult.sensitivity,
      sensitivityScore: analysisResult.score,
      sensitivityDetails: analysisResult.details,
      processingProgress: 80,
    });

    emitProgress(
      VIDEO_STATUS.ANALYSING,
      80,
      `Sensitivity analysis complete: ${analysisResult.sensitivity} (score: ${analysisResult.score})`
    );

    // ───────────────────────────────────────────
    // Stage 4: Transcode for Streaming
    // ───────────────────────────────────────────
    emitProgress(VIDEO_STATUS.PROCESSING, 85, 'Optimising video for streaming...');

    const processedPath = await transcodeVideo(filePath, videoId);
    await Video.findByIdAndUpdate(videoId, {
      processedPath,
      processingProgress: 95,
    });

    emitProgress(VIDEO_STATUS.PROCESSING, 95, 'Video optimised for streaming.');

    // ───────────────────────────────────────────
    // Stage 5: Complete
    // ───────────────────────────────────────────
    await updateVideoStatus(videoId, VIDEO_STATUS.COMPLETED, 100);

    emitProgress(VIDEO_STATUS.COMPLETED, 100, 'Video processing complete! Ready to stream.');

    logger.info(`✅ Video ${videoId} processing complete.`);
  } catch (error) {
    logger.error(`❌ Processing failed for video ${videoId}: ${error.message}`);

    // Mark video as failed
    await Video.findByIdAndUpdate(videoId, {
      status: VIDEO_STATUS.FAILED,
      processingProgress: 0,
    }).catch(() => {});

    emitToUser(userId, 'video:processing', {
      videoId,
      stage: VIDEO_STATUS.FAILED,
      progress: 0,
      message: `Processing failed: ${error.message}`,
    });
  }
};

/**
 * Extract video metadata using FFmpeg.
 * @param {string} filePath - Path to the video file
 * @returns {Promise<object>} - { duration, width, height, codec, bitrate }
 */
const extractMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.warn(`FFprobe failed: ${err.message}, using defaults`);
        // Return defaults if ffprobe fails (e.g., FFmpeg not installed)
        return resolve({
          duration: 30,
          width: 1920,
          height: 1080,
          codec: 'unknown',
          bitrate: 0,
        });
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      resolve({
        duration: Math.floor(metadata.format.duration || 0),
        width: videoStream ? videoStream.width : 1920,
        height: videoStream ? videoStream.height : 1080,
        codec: videoStream ? videoStream.codec_name : 'unknown',
        bitrate: metadata.format.bit_rate || 0,
      });
    });
  });
};

/**
 * Generate a thumbnail image from the video.
 * @param {string} filePath - Path to the video file
 * @param {string} videoId - Video document ID (for naming)
 * @returns {Promise<string>} - Path to the generated thumbnail
 */
const generateThumbnail = (filePath, videoId) => {
  return new Promise((resolve, reject) => {
    const thumbnailDir = path.join(__dirname, '..', '..', 'thumbnails');
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
    }

    const thumbnailFilename = `thumb_${videoId}.jpg`;

    ffmpeg(filePath)
      .screenshots({
        timestamps: ['10%'], // Capture at 10% of video duration
        filename: thumbnailFilename,
        folder: thumbnailDir,
        size: '320x240',
      })
      .on('end', () => {
        resolve(path.join(thumbnailDir, thumbnailFilename));
      })
      .on('error', (err) => {
        logger.warn(`Thumbnail generation failed: ${err.message}`);
        // Non-fatal — resolve with null
        resolve(null);
      });
  });
};

/**
 * Transcode video to streaming-optimised MP4 (H.264 + AAC).
 * Uses faststart for progressive download.
 *
 * @param {string} filePath - Path to the original video
 * @param {string} videoId - Video document ID (for naming)
 * @returns {Promise<string>} - Path to the processed video
 */
const transcodeVideo = (filePath, videoId) => {
  return new Promise((resolve, reject) => {
    const processedDir = path.join(__dirname, '..', '..', 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const outputPath = path.join(processedDir, `${videoId}_processed.mp4`);

    // Check if the input is already an MP4 with H.264 — skip transcoding
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.warn(`FFprobe failed during transcode check, copying file instead`);
        // Just copy the file as a fallback
        fs.copyFileSync(filePath, outputPath);
        return resolve(outputPath);
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      const isAlreadyOptimised =
        videoStream &&
        videoStream.codec_name === 'h264' &&
        path.extname(filePath).toLowerCase() === '.mp4';

      if (isAlreadyOptimised) {
        // Already optimised — just copy with faststart
        ffmpeg(filePath)
          .outputOptions(['-c copy', '-movflags +faststart'])
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => {
            logger.warn(`Faststart copy failed: ${err.message}, copying raw`);
            fs.copyFileSync(filePath, outputPath);
            resolve(outputPath);
          })
          .run();
      } else {
        // Full transcode to H.264 + AAC
        ffmpeg(filePath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset fast',
            '-crf 23',
            '-movflags +faststart',
            '-pix_fmt yuv420p',
          ])
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => {
            logger.warn(`Transcoding failed: ${err.message}, copying raw`);
            fs.copyFileSync(filePath, outputPath);
            resolve(outputPath);
          })
          .run();
      }
    });
  });
};

/**
 * Update video status and progress in the database.
 */
const updateVideoStatus = async (videoId, status, progress) => {
  await Video.findByIdAndUpdate(videoId, {
    status,
    processingProgress: progress,
  });
};

module.exports = { processVideo };
