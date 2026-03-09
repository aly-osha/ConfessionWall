const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        let query = {};

        // If the requester is a moderator, restrict to only users (not other admins/mods)
        if (req.user && req.user.role === 'moderator') {
            query.role = 'user';
        }

        const users = await User.find(query).select('-password -email');
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

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        // Validate role
        if (!['user', 'moderator'].includes(role)) {
            res.status(400);
            throw new Error('Invalid role');
        }

        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent changing an admin's role
            if (user.role === 'admin') {
                res.status(400);
                throw new Error('You cannot change an admin\'s role');
            }

            // Prevent admin from changing their own role (even though the above check catches it, this is for clarity)
            if (user.id === req.user.id) {
                res.status(400);
                throw new Error('You cannot change your own role');
            }

            user.role = role;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                role: updatedUser.role
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
    updateUserStatus,
    updateUserRole
}
