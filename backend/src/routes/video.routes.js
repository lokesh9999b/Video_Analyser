/**
 * Video Routes.
 *
 * POST   /api/videos/upload   - Upload a video (Editor, Admin)
 * GET    /api/videos/stats    - Get dashboard statistics (All authenticated)
 * GET    /api/videos          - List videos with filters (All authenticated)
 * GET    /api/videos/:id      - Get single video details (All authenticated)
 * DELETE /api/videos/:id      - Delete a video (Editor: own, Admin: any)
 * GET    /api/videos/:id/stream - Stream a video (All authenticated)
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const upload = require('../middleware/upload');
const {
  uploadVideo,
  getVideos,
  getVideo,
  deleteVideo,
  stream,
  getStats,
} = require('../controllers/video.controller');

// All routes require authentication
router.use(auth);

// Stats endpoint (must be before /:id to avoid route conflict)
router.get('/stats', getStats);

// Upload — only editors and admins
router.post('/upload', authorize('editor', 'admin'), upload.single('video'), uploadVideo);

// List and detail — all authenticated users
router.get('/', getVideos);
router.get('/:id', getVideo);

// Delete — editors (own) and admins (any)
router.delete('/:id', authorize('editor', 'admin'), deleteVideo);

// Stream — all authenticated users
router.get('/:id/stream', stream);

module.exports = router;
