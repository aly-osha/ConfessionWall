const express = require('express');
const router = express.Router();
const { deleteComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:id').delete(protect, deleteComment);

module.exports = router;
