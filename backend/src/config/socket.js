/**
 * Socket.io server configuration.
 * Handles real-time communication for video processing updates.
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./env');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.io server on the given HTTP server.
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} - The Socket.io server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware — verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userOrg = decoded.organisation;
      next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: user=${socket.userId}`);

    // Join user-specific room for targeted events
    socket.join(`user:${socket.userId}`);

    // Join organisation room for org-wide broadcasts
    if (socket.userOrg) {
      socket.join(`org:${socket.userOrg}`);
    }

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: user=${socket.userId}, reason=${reason}`);
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

/**
 * Get the Socket.io server instance.
 * @returns {Server} - The Socket.io server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket() first.');
  }
  return io;
};

/**
 * Emit a video processing update to a specific user.
 * @param {string} userId - The target user's ID
 * @param {object} data - The processing update data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToUser };
