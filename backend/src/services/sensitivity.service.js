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

let tf;
let nsfwjs;
let nsfwModel = null; // Cached model — loaded once, reused for all videos
let modelLoadFailed = false; // Prevents retrying after a failed load

// Attempt to load TensorFlow (only works on Linux/Render, not Windows without VS Build Tools)
try {
  tf = require('@tensorflow/tfjs-node');
  nsfwjs = require('nsfwjs');
  logger.info('TensorFlow.js loaded successfully — real AI detection enabled.');
} catch (e) {
  logger.warn(`TensorFlow.js failed to load: ${e.message}. Falling back to simulator.`);
  modelLoadFailed = true;
}

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
    // Load NSFWJS model into memory on first run (cached for subsequent videos)
    if (!nsfwModel && !modelLoadFailed) {
      onProgress(5, 'Loading AI content moderation model...');
      logger.info('Loading NSFWJS model into memory (first upload)...');
      try {
        nsfwModel = await nsfwjs.load();
        logger.info('✅ NSFWJS model loaded successfully.');
      } catch (modelErr) {
        logger.error(`Failed to load NSFWJS model: ${modelErr.message}`);
        modelLoadFailed = true;
      }
    }

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
 * Uses NSFWJS (real AI) when TensorFlow is available (Linux/Render).
 * Falls back to a simulator when TensorFlow cannot load (Windows without VS Build Tools).
 *
 * @param {string} framePath - Path to the frame image
 * @returns {Promise<object>} - { score, categories }
 */
const classifyFrame = async (framePath) => {
  // --- REAL AI PATH (Render/Linux) ---
  if (nsfwModel && tf) {
    let imageTensor = null;
    try {
      const imageBuffer = fs.readFileSync(framePath);
      imageTensor = tf.node.decodeImage(imageBuffer, 3);
      const predictions = await nsfwModel.classify(imageTensor);

      let explicitProb = 0;
      let suggestiveProb = 0;
      let safeProb = 0;

      predictions.forEach((p) => {
        if (p.className === 'Porn' || p.className === 'Hentai') {
          explicitProb += p.probability;
        } else if (p.className === 'Sexy') {
          suggestiveProb += p.probability;
        } else {
          safeProb += p.probability;
        }
      });

      // Explicit content weighted heavier than suggestive
      const score = explicitProb + (suggestiveProb * 0.5);

      return {
        score,
        categories: {
          safe: safeProb,
          suggestive: suggestiveProb,
          violent: 0, // NSFWJS does not detect violence
          explicit: explicitProb,
        },
      };
    } catch (error) {
      logger.error(`Frame classification error: ${error.message}`);
      return { score: 0, categories: { safe: 1, suggestive: 0, violent: 0, explicit: 0 } };
    } finally {
      // CRITICAL: Dispose tensor to prevent memory leaks
      if (imageTensor) imageTensor.dispose();
    }
  }

  // --- FALLBACK SIMULATOR PATH (Windows/local dev) ---
  logger.debug('Using simulated classifier (TensorFlow not available).');
  const baseScore = Math.random() * 0.3;
  const noise = Math.random() * 0.1;
  return {
    score: baseScore + noise,
    categories: {
      safe: 1 - baseScore - noise,
      suggestive: baseScore * 0.5,
      violent: baseScore * 0.3,
      explicit: baseScore * 0.2,
    },
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
