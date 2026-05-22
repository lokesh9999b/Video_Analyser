/**
 * Admin Routes.
 * All routes require authentication + admin role.
 *
 * GET    /api/admin/users          - List users in organisation
 * PATCH  /api/admin/users/:id/role - Update user's role
 * DELETE /api/admin/users/:id      - Delete a user
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { getUsers, updateUserRole, deleteUser } = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(auth);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

module.exports = router;
