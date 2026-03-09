const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateAnonymousUsername = require('../utils/generateUsername');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { email, password, age } = req.body;

        if (!email || !password || !age) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            if (userExists.status === 'perm_banned' || userExists.status === 'temp_banned') {
                res.status(403);
                throw new Error('This email is banned from creating an account');
            }
            res.status(400);
            throw new Error('User already exists');
        }

        const username = await generateAnonymousUsername();

        // Create user
        const user = await User.create({
            email,
            password,
            age,
            username,
            // avatar is auto-generated in model
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check for user email (include password for comparison)
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if (user.status === 'perm_banned') {
                res.status(403);
                throw new Error('Account permanently banned');
            }

            res.json({
                _id: user._id,
                username: user.username,
                avatarUrl: user.avatarUrl,
                role: user.role,
                status: user.status,
                token: generateToken(user._id),
            });
        } else {
            res.status(401);
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user profile by ID or username
// @route   GET /api/users/:identifier
// @access  Private (or Public, but they need to see profiles)
const getUserProfile = async (req, res, next) => {
    try {
        const identifier = req.params.identifier;
        let user;

        // Check if identifier is a valid ObjectId
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(identifier).select('-email -password').populate('followers', 'username avatarUrl').populate('following', 'username avatarUrl');
        } else {
            user = await User.findOne({ username: identifier }).select('-email -password').populate('followers', 'username avatarUrl').populate('following', 'username avatarUrl');
        }

        if (user) {
            res.json(user);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
const followUser = async (req, res, next) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (userToFollow && currentUser) {
            if (req.user.id === req.params.id) {
                res.status(400);
                throw new Error("You cannot follow yourself");
            }

            if (!userToFollow.followers.includes(req.user.id)) {
                await userToFollow.updateOne({ $push: { followers: req.user.id } });
                await currentUser.updateOne({ $push: { following: req.params.id } });
                res.status(200).json({ message: 'User followed' });
            } else {
                res.status(400);
                throw new Error('You already follow this user');
            }
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
const unfollowUser = async (req, res, next) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user.id);

        if (userToUnfollow && currentUser) {
            if (userToUnfollow.followers.includes(req.user.id)) {
                await userToUnfollow.updateOne({ $pull: { followers: req.user.id } });
                await currentUser.updateOne({ $pull: { following: req.params.id } });
                res.status(200).json({ message: 'User unfollowed' });
            } else {
                res.status(400);
                throw new Error('You do not follow this user');
            }
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password -email');
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}


module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    followUser,
    unfollowUser,
    getMe
};
