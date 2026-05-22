/**
 * Pulse Video Platform — Backend Entry Point
 *
 * Express.js server with Socket.io, MongoDB, and video processing pipeline.
 * Entry point: index.js
 */
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load environment config first
const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const videoRoutes = require('./src/routes/video.routes');
const adminRoutes = require('./src/routes/admin.routes');

// ─── Initialize Express App ─────────────────────────────────

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// ─── Create Required Directories ─────────────────────────────

const dirs = ['uploads', 'processed', 'thumbnails', 'logs'];
dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dir}/`);
  }
});

// ─── Middleware ──────────────────────────────────────────────

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (thumbnails)
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// ─── Routes ─────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pulse Video Platform API is running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    server.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════╗
║         🎬 Pulse Video Platform API               ║
║────────────────────────────────────────────────── ║
║  Environment : ${config.nodeEnv.padEnd(33)}║
║  Port        : ${String(config.port).padEnd(33)}║
║  Client URL  : ${config.clientUrl.padEnd(33)}║
║  API Health  : http://localhost:${config.port}/api/health  ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

startServer();

module.exports = app;
