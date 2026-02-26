const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Check if user is banned
            if (req.user.status === 'perm_banned') {
                res.status(403);
                throw new Error('Account permanently banned');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            next(new Error('Not authorized'));
        }
    }

    if (!token) {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            next(new Error(`User role ${req.user.role} is not authorized to access this route`));
        } else {
            next();
        }
    };
};

module.exports = { protect, authorize };
