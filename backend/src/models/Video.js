/**
 * Video model — stores video metadata, processing status, and sensitivity results.
 */
const mongoose = require('mongoose');
const { VIDEO_STATUS, SENSITIVITY } = require('../utils/helpers');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    processedPath: {
      type: String,
      default: null,
    },
    thumbnailPath: {
      type: String,
      default: null,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: null,
    },
    resolution: {
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: Object.values(VIDEO_STATUS),
      default: VIDEO_STATUS.UPLOADING,
    },
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    sensitivity: {
      type: String,
      enum: Object.values(SENSITIVITY),
      default: SENSITIVITY.PENDING,
    },
    sensitivityScore: {
      type: Number,
      default: null,
      min: 0,
      max: 1,
    },
    sensitivityDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organisation: {
      type: String,
      required: true,
      lowercase: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'uncategorised',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient querying
videoSchema.index({ organisation: 1, createdAt: -1 });
videoSchema.index({ owner: 1, createdAt: -1 });
videoSchema.index({ status: 1 });
videoSchema.index({ sensitivity: 1 });
videoSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Video', videoSchema);
