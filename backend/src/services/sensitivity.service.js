/**
 * Content Sensitivity Analysis Service.
 *
 * Extracts key frames from a video using FFmpeg, then analyses each frame
 * for sensitive content. Provides real-time progress updates via Socket.io.
 *
 * Strategy: Extract frames at regular intervals, run a simulated sensitivity
 * classifier on each frame, aggregate scores for final classification.
 *
 * NOTE: For production use, replace the simulated classifier with NSFWJS
 * or a cloud vision API (Google Cloud Vision, AWS Rekognition).
 * The pipeline architecture remains the same — only the classifyFrame()
 * function needs to be swapped.
 */
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const logger = require('../utils/logger');

// Set bundled FFmpeg/FFprobe paths (works on Render, Heroku, etc.)
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Threshold for flagging content (0-1 scale)
const SENSITIVITY_THRESHOLD = 0.6;

/**
 * Analyse a video for sensitive content.
 *
 * @param {string} videoPath - Absolute path to the video file
 * @param {number} duration - Video duration in seconds
 * @param {function} onProgress - Callback for progress updates: (progress, message)
 * @returns {Promise<object>} - Analysis result { sensitivity, score, details }
 */
const analyseVideo = async (videoPath, duration, onProgress) => {
  const framesDir = path.join(path.dirname(videoPath), '..', 'temp_frames');

  try {
    // Create temporary directory for extracted frames
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    // Step 1: Extract key frames (1 frame every 2 seconds, max 20 frames)
    onProgress(10, 'Extracting key frames from video...');
    const frameInterval = Math.max(2, Math.floor(duration / 20));
    const frames = await extractFrames(videoPath, framesDir, frameInterval);
    logger.info(`Extracted ${frames.length} frames for analysis`);

    if (frames.length === 0) {
      logger.warn('No frames extracted, marking as safe by default');
      return {
        sensitivity: 'safe',
        score: 0,
        details: { framesAnalysed: 0, note: 'No frames could be extracted' },
      };
    }

    // Step 2: Analyse each frame
    const frameResults = [];
    for (let i = 0; i < frames.length; i++) {
      const progress = 20 + Math.floor((i / frames.length) * 60);
      onProgress(progress, `Analysing frame ${i + 1} of ${frames.length}...`);

      const result = await classifyFrame(frames[i]);
      frameResults.push(result);

      // Small delay to make progress visible in real-time
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    onProgress(85, 'Aggregating analysis results...');

    // Step 3: Aggregate scores
    const avgScore =
      frameResults.reduce((sum, r) => sum + r.score, 0) / frameResults.length;
    const maxScore = Math.max(...frameResults.map((r) => r.score));
    // Use weighted combination: 60% average + 40% max (to catch spikes)
    const finalScore = avgScore * 0.6 + maxScore * 0.4;
    const sensitivity = finalScore >= SENSITIVITY_THRESHOLD ? 'flagged' : 'safe';

    onProgress(95, `Analysis complete. Content classified as: ${sensitivity}`);

    // Cleanup temp frames
    cleanupFrames(framesDir);

    return {
      sensitivity,
      score: Math.round(finalScore * 1000) / 1000,
      details: {
        framesAnalysed: frames.length,
        averageScore: Math.round(avgScore * 1000) / 1000,
        maxScore: Math.round(maxScore * 1000) / 1000,
        threshold: SENSITIVITY_THRESHOLD,
        frameResults: frameResults.map((r, i) => ({
          frame: i + 1,
          score: r.score,
          categories: r.categories,
        })),
      },
    };
  } catch (error) {
    // Cleanup on error
    cleanupFrames(framesDir);
    throw error;
  }
};

/**
 * Extract key frames from a video using FFmpeg.
 *
 * @param {string} videoPath - Path to the video file
 * @param {string} outputDir - Directory to save frames
 * @param {number} interval - Seconds between frames
 * @returns {Promise<string[]>} - Array of frame file paths
 */
const extractFrames = (videoPath, outputDir, interval) => {
  return new Promise((resolve, reject) => {
    const outputPattern = path.join(outputDir, 'frame_%04d.jpg');

    ffmpeg(videoPath)
      .outputOptions([`-vf fps=1/${interval}`, '-q:v 2', '-frames:v 20'])
      .output(outputPattern)
      .on('end', () => {
        // Read all extracted frame files
        const frames = fs
          .readdirSync(outputDir)
          .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
          .sort()
          .map((f) => path.join(outputDir, f));
        resolve(frames);
      })
      .on('error', (err) => {
        logger.error(`Frame extraction error: ${err.message}`);
        // If FFmpeg fails, resolve with empty array (graceful degradation)
        resolve([]);
      })
      .run();
  });
};

/**
 * Classify a single frame for sensitive content.
 *
 * This is a SIMULATED classifier for demonstration purposes.
 * It generates realistic-looking scores based on randomisation.
 *
 * To use NSFWJS (real classifier), replace this function with:
 *   const nsfwjs = require('nsfwjs');
 *   const tf = require('@tensorflow/tfjs-node');
 *   const model = await nsfwjs.load();
 *   const image = await tf.node.decodeImage(fs.readFileSync(framePath));
 *   const predictions = await model.classify(image);
 *   image.dispose();
 *
 * @param {string} framePath - Path to the frame image
 * @returns {Promise<object>} - { score, categories }
 */
const classifyFrame = async (framePath) => {
  // Simulated analysis — generates a low sensitivity score (most content is safe)
  // In a real implementation, this would call NSFWJS or a cloud vision API
  const baseScore = Math.random() * 0.3; // Most frames will score low (safe)
  const noise = Math.random() * 0.1;

  // Simulate category scores
  const categories = {
    safe: 1 - baseScore - noise,
    suggestive: baseScore * 0.5,
    violent: baseScore * 0.3,
    explicit: baseScore * 0.2,
  };

  return {
    score: baseScore + noise,
    categories,
  };
};

/**
 * Cleanup temporary frame files.
 * @param {string} framesDir - Directory containing temp frames
 */
const cleanupFrames = (framesDir) => {
  try {
    if (fs.existsSync(framesDir)) {
      const files = fs.readdirSync(framesDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(framesDir, file));
      });
      fs.rmdirSync(framesDir);
      logger.debug('Cleaned up temporary frame files');
    }
  } catch (err) {
    logger.warn(`Frame cleanup warning: ${err.message}`);
  }
};

module.exports = { analyseVideo };
