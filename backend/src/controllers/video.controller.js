/**
 * Video Controller.
 * Handles video upload, listing, detail retrieval, deletion, and streaming.
 */
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { processVideo } = require('../services/processing.service');
const { streamVideo } = require('../services/streaming.service');
const { VIDEO_STATUS, SENSITIVITY } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * POST /api/videos/upload
 * Upload a new video file and start the processing pipeline.
 */
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided. Please select a video to upload.',
      });
    }

    const { title, description, category } = req.body;

    if (!title || !title.trim()) {
      // Cleanup uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Video title is required.',
      });
    }

    // Create video document
    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'uncategorised',
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: VIDEO_STATUS.PROCESSING,
      processingProgress: 0,
      owner: req.user._id,
      organisation: req.user.organisation,
    });

    logger.info(`Video uploaded: ${video._id} by user ${req.user._id}`);

    // Start processing pipeline in the background (non-blocking)
    processVideo(video._id.toString(), req.user._id.toString()).catch((err) => {
      logger.error(`Background processing error for ${video._id}: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing has started.',
      data: { video },
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * GET /api/videos
 * List videos for the current user's organisation with filtering and pagination.
 *
 * Query params:
 *   - page (default: 1)
 *   - limit (default: 12)
 *   - status (filter by processing status)
 *   - sensitivity (filter by sensitivity classification)
 *   - search (text search in title/description)
 *   - sortBy (createdAt, title, fileSize — default: createdAt)
 *   - order (asc, desc — default: desc)
 */
const getVideos = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      status,
      sensitivity,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      category,
    } = req.query;

    // Build query — scoped to user's organisation
    const query = { organisation: req.user.organisation };

    // Apply filters
    if (status && Object.values(VIDEO_STATUS).includes(status)) {
      query.status = status;
    }
    if (sensitivity && Object.values(SENSITIVITY).includes(sensitivity)) {
      query.sensitivity = sensitivity;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ['createdAt', 'title', 'fileSize', 'duration', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    // Execute query
    const [videos, total] = await Promise.all([
      Video.find(query)
        .populate('owner', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Video.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        videos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/videos/:id
 * Get a single video's details.
 */
const getVideo = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
    }).populate('owner', 'name email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/videos/:id
 * Delete a video and its associated files.
 * Editors can delete their own videos; Admins can delete any video in the org.
 */
const deleteVideo = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id,
      organisation: req.user.organisation,
    };

    // Editors can only delete their own videos
    if (req.user.role === 'editor') {
      query.owner = req.user._id;
    }

    const video = await Video.findOne(query);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or you do not have permission to delete it.',
      });
    }

    // Delete associated files
    const filesToDelete = [video.filePath, video.processedPath, video.thumbnailPath];
    filesToDelete.forEach((filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          logger.warn(`Failed to delete file ${filePath}: ${err.message}`);
        }
      }
    });

    await Video.findByIdAndDelete(video._id);

    logger.info(`Video deleted: ${video._id} by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/videos/:id/stream
 * Stream a video with HTTP range request support.
 */
const stream = async (req, res, next) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found.',
      });
    }

    // Use processed file if available, otherwise use original
    const filePath = video.processedPath || video.filePath;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server.',
      });
    }

    // Delegate to streaming service
    streamVideo(req, res, filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/videos/stats
 * Get video statistics for the dashboard.
 */
const getStats = async (req, res, next) => {
  try {
    const org = req.user.organisation;

    const [total, processing, completed, failed, safe, flagged] = await Promise.all([
      Video.countDocuments({ organisation: org }),
      Video.countDocuments({ organisation: org, status: VIDEO_STATUS.PROCESSING }),
      Video.countDocuments({ organisation: org, status: VIDEO_STATUS.COMPLETED }),
      Video.countDocuments({ organisation: org, status: VIDEO_STATUS.FAILED }),
      Video.countDocuments({ organisation: org, sensitivity: SENSITIVITY.SAFE }),
      Video.countDocuments({ organisation: org, sensitivity: SENSITIVITY.FLAGGED }),
    ]);

    // Total storage used
    const storageResult = await Video.aggregate([
      { $match: { organisation: org } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } },
    ]);

    const totalStorage = storageResult.length > 0 ? storageResult[0].totalSize : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          processing,
          completed,
          failed,
          safe,
          flagged,
          totalStorage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadVideo, getVideos, getVideo, deleteVideo, stream, getStats };
