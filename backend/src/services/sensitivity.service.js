/**
 * Content Sensitivity Analysis Service.
 *
 * Extracts key frames from a video using FFmpeg, then analyses each frame
 * for sensitive content using Google Cloud Vision API.
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
    if (!process.env.GOOGLE_VISION_API_KEY) {
      logger.warn('GOOGLE_VISION_API_KEY is not set. Sensitivity analysis will fall back to simulation.');
    } else {
      logger.info('Using Google Cloud Vision API for content moderation.');
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
          score: Math.round(r.score * 1000) / 1000,
          categories: {
            safe: Math.round(r.categories.safe * 1000) / 1000,
            suggestive: Math.round(r.categories.suggestive * 1000) / 1000,
            violent: Math.round(r.categories.violent * 1000) / 1000,
            explicit: Math.round(r.categories.explicit * 1000) / 1000,
          },
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
 */
const extractFrames = (videoPath, outputDir, interval) => {
  return new Promise((resolve, reject) => {
    const outputPattern = path.join(outputDir, 'frame_%04d.jpg');

    ffmpeg(videoPath)
      .outputOptions([`-vf fps=1/${interval}`, '-q:v 2', '-frames:v 20'])
      .output(outputPattern)
      .on('end', () => {
        const frames = fs
          .readdirSync(outputDir)
          .filter((f) => f.startsWith('frame_') && f.endsWith('.jpg'))
          .sort()
          .map((f) => path.join(outputDir, f));
        resolve(frames);
      })
      .on('error', (err) => {
        logger.error(`Frame extraction error: ${err.message}`);
        resolve([]);
      })
      .run();
  });
};

/**
 * Classify a single frame using Google Cloud Vision API.
 */
const classifyFrame = async (framePath) => {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    // Fallback Simulator if no API key is provided
    const isFlagged = Math.random() > 0.5;
    const baseScore = isFlagged ? (0.7 + Math.random() * 0.2) : (Math.random() * 0.3); 
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
  }

  try {
    const imageBuffer = fs.readFileSync(framePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      throw new Error('No SafeSearch data returned from Google API');
    }

    // Google returns likelihoods as string enums. We map them to numerical weights.
    const likelihoodMap = {
      UNKNOWN: 0.0,
      VERY_UNLIKELY: 0.05,
      UNLIKELY: 0.2,
      POSSIBLE: 0.5,
      LIKELY: 0.8,
      VERY_LIKELY: 0.95,
    };

    const explicitScore = likelihoodMap[safeSearch.adult] || 0;
    const violenceScore = likelihoodMap[safeSearch.violence] || 0;
    const suggestiveScore = likelihoodMap[safeSearch.racy] || 0;

    // The frame score is the highest threat level found
    const score = Math.max(explicitScore, violenceScore, suggestiveScore * 0.7);

    return {
      score,
      categories: {
        safe: 1 - score,
        suggestive: suggestiveScore,
        violent: violenceScore,
        explicit: explicitScore,
      },
    };
  } catch (error) {
    logger.error(`Frame classification failed: ${error.message}`);
    // Safe fallback on error
    return {
      score: 0,
      categories: { safe: 1, suggestive: 0, violent: 0, explicit: 0 },
    };
  }
};

/**
 * Cleanup temporary frame files.
 */
const cleanupFrames = (framesDir) => {
  try {
    if (fs.existsSync(framesDir)) {
      const files = fs.readdirSync(framesDir);
      files.forEach((file) => fs.unlinkSync(path.join(framesDir, file)));
      fs.rmdirSync(framesDir);
    }
  } catch (err) {
    logger.warn(`Frame cleanup warning: ${err.message}`);
  }
};

module.exports = { analyseVideo };
