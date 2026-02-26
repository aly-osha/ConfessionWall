const express = require('express');
const router = express.Router();
const {
    createReport,
    getReports,
    reviewReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReport)
    .get(protect, authorize('admin', 'moderator'), getReports);

router.route('/:id/review')
    .put(protect, authorize('admin', 'moderator'), reviewReport);

module.exports = router;
