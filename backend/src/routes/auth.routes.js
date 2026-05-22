/**
 * Authentication Routes.
 *
 * POST /api/auth/org/register   - Register a new organisation (founder becomes admin)
 * POST /api/auth/user/register  - Submit join request to an existing org (status: pending)
 * POST /api/auth/login          - Authenticate (approved users only)
 * GET  /api/auth/orgs           - Public list of registered organisations
 * GET  /api/auth/me             - Get current user profile (protected)
 */
const express = require('express');
const router = express.Router();
const { registerOrg, registerUser, login, getOrgs, getMe } = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// Public routes
router.post('/org/register', registerOrg);
router.post('/user/register', registerUser);
router.post('/login', login);
router.get('/orgs', getOrgs);

// Protected routes
router.get('/me', auth, getMe);

module.exports = router;
