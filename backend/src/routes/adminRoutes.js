const express = require('express');
const router = express.Router();
const { getUsers, updateUserStatus, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/users')
    .get(protect, authorize('admin', 'moderator'), getUsers);

router.route('/users/:id/status')
    .put(protect, authorize('admin', 'moderator'), updateUserStatus);

router.route('/users/:id/role')
    .put(protect, authorize('admin'), updateUserRole);

module.exports = router;
