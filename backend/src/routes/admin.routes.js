/**
 * Admin Routes.
 * All routes require authentication + admin role.
 *
 * GET    /api/admin/users              - List approved users in organisation
 * GET    /api/admin/users/pending      - List pending join requests
 * PATCH  /api/admin/users/:id/approve  - Approve a pending user + assign role
 * DELETE /api/admin/users/:id/reject   - Reject (delete) a pending join request
 * PATCH  /api/admin/users/:id/role     - Update an approved user's role
 * DELETE /api/admin/users/:id          - Remove an approved user
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  getUsers,
  getPendingUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  deleteUser,
} = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(auth);
router.use(authorize('admin'));

// Approved user management
router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Pending approval management
// NOTE: specific routes (/pending, /approve, /reject) must be defined
//       before the generic /:id route to avoid param conflicts
router.get('/users/pending', getPendingUsers);
router.patch('/users/:id/approve', approveUser);
router.delete('/users/:id/reject', rejectUser);

module.exports = router;
