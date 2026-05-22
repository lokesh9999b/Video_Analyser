/**
 * Authentication Routes.
 *
 * POST /api/auth/register  - Create new account
 * POST /api/auth/login     - Authenticate & get token
 * GET  /api/auth/me        - Get current user profile
 */
const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);

module.exports = router;
