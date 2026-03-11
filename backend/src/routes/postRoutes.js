const express = require('express');
const router = express.Router();
const {
    getPosts,
    getUserPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    upvotePost,
    downvotePost,
    getComments,
    addComment
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getPosts)
    .post(protect, createPost);

router.get('/user/:username', getUserPosts);

router.route('/:id')
    .get(getPostById)
    .put(protect, updatePost)
    .delete(protect, deletePost);

router.post('/:id/upvote', protect, upvotePost);
router.post('/:id/downvote', protect, downvotePost);

router.route('/:postId/comments')
    .get(getComments)
    .post(protect, addComment);


module.exports = router;
