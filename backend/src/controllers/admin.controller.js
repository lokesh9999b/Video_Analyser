/**
 * Admin Controller.
 * Handles user management operations (admin only).
 *
 * GET    /api/admin/users          - List approved users in the admin's org
 * GET    /api/admin/users/pending  - List pending join requests for the admin's org
 * PATCH  /api/admin/users/:id/role - Update an approved user's role
 * PATCH  /api/admin/users/:id/approve - Approve a pending user + assign role
 * DELETE /api/admin/users/:id/reject  - Reject (delete) a pending join request
 * DELETE /api/admin/users/:id      - Remove an approved user from the org
 */
const User = require('../models/User');
const Video = require('../models/Video');
const { ROLES } = require('../utils/helpers');
const logger = require('../utils/logger');

// ─── Approved Users ──────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all APPROVED users in the admin's organisation.
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {
      organisation: req.user.organisation,
      status: 'approved',
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Attach video counts per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ owner: user._id });
        return { ...user, videoCount };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Pending Approvals ───────────────────────────────────────

/**
 * GET /api/admin/users/pending
 * List all PENDING join requests for the admin's organisation.
 */
const getPendingUsers = async (req, res, next) => {
  try {
    const users = await User.find({
      organisation: req.user.organisation,
      status: 'pending',
    })
      .sort({ createdAt: 1 }) // Oldest first (FIFO)
      .lean();

    res.status(200).json({
      success: true,
      data: { users, total: users.length },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/approve
 * Approve a pending user and assign their role.
 * Body: { role: 'viewer' | 'editor' | 'admin' }
 */
const approveUser = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`,
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
      status: 'pending',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found in your organisation.',
      });
    }

    user.role = role;
    user.status = 'approved';
    await user.save();

    logger.info(`User approved: ${user.email} as ${role} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `${user.name} has been approved as ${role}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id/reject
 * Reject and permanently delete a pending join request.
 */
const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
      status: 'pending',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pending user not found in your organisation.',
      });
    }

    const { email, name } = user;
    await User.findByIdAndDelete(user._id);

    logger.info(`Join request rejected: ${email} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `${name}'s join request has been rejected.`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Approved User Management ────────────────────────────────

/**
 * PATCH /api/admin/users/:id/role
 * Change an approved user's role.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !Object.values(ROLES).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
      status: 'approved',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your organisation.',
      });
    }

    user.role = role;
    await user.save();

    logger.info(`User role updated: ${user.email} → ${role} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Remove an approved user from the organisation.
 */
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      organisation: req.user.organisation,
      status: 'approved',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in your organisation.',
      });
    }

    await User.findByIdAndDelete(user._id);

    logger.info(`User deleted: ${user.email} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'User removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getPendingUsers, approveUser, rejectUser, updateUserRole, deleteUser };
