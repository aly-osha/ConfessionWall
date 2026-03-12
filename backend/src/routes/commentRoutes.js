const express = require('express');
const router = express.Router();
const { deleteComment, updateComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:id')
    .delete(protect, deleteComment)
    .put(protect, updateComment);

module.exports = router;
