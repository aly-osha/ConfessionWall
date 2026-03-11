const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getUserProfile,
    followUser,
    unfollowUser,
    changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

// Order matters: specific routes before dynamic parameters
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

// Dynamic routes
router.get('/:identifier', getUserProfile); // Identifier can be ID or username

module.exports = router;
