const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password -email');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status (ban/unban)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        // Validate status
        if (!['active', 'warned', 'temp_banned', 'perm_banned'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status');
        }

        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent admin from banning themselves
            if (user.id === req.user.id) {
                res.status(400);
                throw new Error('You cannot change your own status');
            }

            user.status = status;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                status: updatedUser.status
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    updateUserStatus
}
