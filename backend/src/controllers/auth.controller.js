/**
 * Authentication Controller.
 * Handles org registration, user join requests, login, and profile retrieval.
 *
 * POST /api/auth/org/register   - Register a new organisation (first user becomes admin)
 * POST /api/auth/user/register  - Request to join an existing org (status: pending)
 * POST /api/auth/login          - Authenticate (approved users only)
 * GET  /api/auth/orgs           - Public list of registered organisations
 * GET  /api/auth/me             - Get current user profile
 */
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');
const { ROLES } = require('../utils/helpers');

// ─── Validation Schemas ─────────────────────────────────────

const orgRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({ 'string.empty': 'Name is required' }),
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(6).max(100).required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
  organisation: Joi.string().trim().lowercase().min(2).max(80).required()
    .messages({ 'string.empty': 'Organisation name is required' }),
});

const userRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({ 'string.empty': 'Name is required' }),
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(6).max(100).required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
  organisation: Joi.string().trim().lowercase().min(2).max(80).required()
    .messages({ 'string.empty': 'Organisation name is required' }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().required()
    .messages({ 'string.empty': 'Password is required' }),
});

// ─── Helpers ────────────────────────────────────────────────

/**
 * Generate a JWT token for a user.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      organisation: user.organisation,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// ─── Controller Methods ─────────────────────────────────────

/**
 * POST /api/auth/org/register
 * Register a new organisation.
 * The registering user automatically becomes the org's first admin.
 * Returns a JWT — they are logged in immediately.
 */
const registerOrg = async (req, res, next) => {
  try {
    const { error, value } = orgRegisterSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Check if email is already registered
    const existingEmail = await User.findOne({ email: value.email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Check if org already has an admin (org already registered)
    const existingOrg = await User.findOne({ organisation: value.organisation, role: ROLES.ADMIN });
    if (existingOrg) {
      return res.status(409).json({
        success: false,
        message: `The organisation "${value.organisation}" is already registered. Please use the "Join Organisation" flow instead.`,
      });
    }

    // Create the org admin
    const user = await User.create({
      ...value,
      role: ROLES.ADMIN,
      status: 'approved',
    });

    const token = generateToken(user);

    logger.info(`New organisation registered: ${value.organisation} by ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Organisation registered successfully. You are now the admin.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisation: user.organisation,
          status: user.status,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/user/register
 * Submit a request to join an existing organisation.
 * Account is created with status: 'pending'. No JWT is returned.
 * The org admin must approve before the user can log in.
 */
const registerUser = async (req, res, next) => {
  try {
    const { error, value } = userRegisterSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Check if email is already registered
    const existingEmail = await User.findOne({ email: value.email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Verify the org exists (must have at least one admin)
    const orgAdmin = await User.findOne({ organisation: value.organisation, role: ROLES.ADMIN });
    if (!orgAdmin) {
      return res.status(404).json({
        success: false,
        message: `Organisation "${value.organisation}" was not found. Please register your organisation first.`,
      });
    }

    // Create pending user — no role assigned yet (assigned on approval)
    const user = await User.create({
      ...value,
      role: ROLES.VIEWER, // Placeholder; admin will set the real role on approval
      status: 'pending',
    });

    logger.info(`Join request submitted: ${user.email} → org: ${value.organisation}`);

    // Return 202 Accepted — no token
    res.status(202).json({
      success: true,
      pending: true,
      message: `Your request to join "${value.organisation}" has been submitted. You will be able to log in once an admin approves your request.`,
      data: {
        name: user.name,
        email: user.email,
        organisation: user.organisation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user. Only 'approved' users may obtain a token.
 */
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: value.email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Status gate — only approved users can log in
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        status: 'pending',
        message: 'Your account is awaiting approval from your organisation admin. Please check back later.',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        status: 'rejected',
        message: 'Your access request was rejected. Please contact your organisation admin.',
      });
    }

    const token = generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisation: user.organisation,
          status: user.status,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/orgs
 * Public endpoint. Returns list of registered organisations (unique names that have an admin).
 * Used by the user join form to populate the organisation dropdown.
 */
const getOrgs = async (req, res, next) => {
  try {
    const orgs = await User.distinct('organisation', { role: ROLES.ADMIN, status: 'approved' });
    const sorted = orgs.sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      data: { organisations: sorted },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get the currently authenticated user's profile.
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerOrg, registerUser, login, getOrgs, getMe };
