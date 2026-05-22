/**
 * Authentication Controller.
 * Handles user registration, login, and profile retrieval.
 */
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const config = require('../config/env');
const logger = require('../utils/logger');
const { ROLES } = require('../utils/helpers');

// ─── Validation Schemas ─────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({ 'string.empty': 'Name is required' }),
  email: Joi.string().trim().email().lowercase().required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(6).max(100).required()
    .messages({ 'string.min': 'Password must be at least 6 characters' }),
  organisation: Joi.string().trim().lowercase().min(2).max(50).required()
    .messages({ 'string.empty': 'Organisation name is required' }),
  role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.EDITOR),
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
 * @param {object} user - The user document
 * @returns {string} - Signed JWT token
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
 * POST /api/auth/register
 * Create a new user account.
 */
const register = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body, {
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    const user = await User.create(value);
    const token = generateToken(user);

    logger.info(`New user registered: ${user.email} (${user.role}) in org: ${user.organisation}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organisation: user.organisation,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
const login = async (req, res, next) => {
  try {
    // Validate input
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
        },
        token,
      },
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

module.exports = { register, login, getMe };
