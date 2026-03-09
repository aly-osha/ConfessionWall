const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { moderateContent } = require('../services/moderationService');

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public (or Private if you want only users to see)
const getPosts = async (req, res, next) => {
    try {
        // Only show posts that are not hidden
        const posts = await Post.find({ isHidden: false })
            .populate('author', 'username avatarUrl') // Get author details
            .sort({ createdAt: -1 }); // Newest first
        res.json(posts);
    } catch (error) {
        next(error);
    }
};

// @desc    Get posts by specific user
// @route   GET /api/posts/user/:username
// @access  Public
const getUserPosts = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Only show posts that are not hidden
        const posts = await Post.find({ author: user._id, isHidden: false })
            .populate('author', 'username avatarUrl')
            .sort({ createdAt: -1 }); // Newest first

        res.json(posts);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id).populate(
            'author',
            'username avatarUrl'
        );

        if (post && !post.isHidden) {
            res.json(post);
        } else {
            res.status(404);
            throw new Error('Post not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
    try {
        const { content } = req.body;

        if (!content) {
            res.status(400);
            throw new Error('Please add content');
        }

        // AI MODERATION CHECK BEFORE SAVING
        const moderationResult = await moderateContent(content);

        if (moderationResult.isFlagged) {
            res.status(400);
            throw new Error(`Post rejected: ${moderationResult.reason}`);
        }

        const post = await Post.create({
            author: req.user.id,
            content,
        });

        // Populate newly created post with author inline
        const populatedPost = await Post.findById(post._id).populate(
            'author',
            'username avatarUrl'
        );

        res.status(201).json(populatedPost);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error('Post not found');
        }

        // Check if user is the author or an admin/moderator
        if (
            post.author.toString() !== req.user.id &&
            req.user.role === 'user'
        ) {
            res.status(401);
            throw new Error('User not authorized to delete this post');
        }

        // Use deleteOne() instead of remove() in newer Mongoose versions
        await Post.deleteOne({ _id: post._id });

        // Also delete associated comments
        await Comment.deleteMany({ post: post._id });

        res.json({ id: req.params.id, message: 'Post deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Upvote a post
// @route   POST /api/posts/:id/upvote
// @access  Private
const upvotePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error('Post not found');
        }

        // Check if user already upvoted
        if (post.upvotes.includes(req.user.id)) {
            // Remove upvote (toggle)
            post.upvotes.pull(req.user.id);
        } else {
            // Add upvote, remove downvote if exists
            post.upvotes.push(req.user.id);
            if (post.downvotes.includes(req.user.id)) {
                post.downvotes.pull(req.user.id);
            }
        }

        await post.save();
        const populatedPost = await Post.findById(post._id).populate('author', 'username avatarUrl');
        res.json(populatedPost);
    } catch (error) {
        next(error);
    }
};

// @desc    Downvote a post
// @route   POST /api/posts/:id/downvote
// @access  Private
const downvotePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            res.status(404);
            throw new Error('Post not found');
        }

        if (post.downvotes.includes(req.user.id)) {
            // Remove downvote (toggle)
            post.downvotes.pull(req.user.id);
        } else {
            // Add downvote, remove upvote if exists
            post.downvotes.push(req.user.id);
            if (post.upvotes.includes(req.user.id)) {
                post.upvotes.pull(req.user.id);
            }
        }

        await post.save();
        const populatedPost = await Post.findById(post._id).populate('author', 'username avatarUrl');
        res.json(populatedPost);
    } catch (error) {
        next(error);
    }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
const getComments = async (req, res, next) => {
    try {
        const comments = await Comment.find({ post: req.params.postId, isHidden: false })
            .populate('author', 'username avatarUrl')
            .sort({ createdAt: 1 }); // Oldest first usually for comments
        res.json(comments);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment
// @route   POST /api/posts/:postId/comments
// @access  Private
const addComment = async (req, res, next) => {
    try {
        const { content } = req.body;
        const postId = req.params.postId;

        if (!content) {
            res.status(400);
            throw new Error('Please add content');
        }

        const post = await Post.findById(postId);

        if (!post) {
            res.status(404);
            throw new Error('Post not found');
        }

        // AI MODERATION CHECK
        const moderationResult = await moderateContent(content);

        if (moderationResult.isFlagged) {
            res.status(400);
            throw new Error(`Comment rejected: ${moderationResult.reason}`);
        }

        const comment = await Comment.create({
            post: postId,
            author: req.user.id,
            content,
        });

        // Update comment count on post
        post.commentCount += 1;
        await post.save();

        const populatedComment = await Comment.findById(comment._id).populate(
            'author',
            'username avatarUrl'
        );

        res.status(201).json(populatedComment);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            res.status(404);
            throw new Error('Comment not found');
        }

        // Check if user is the author or an admin/moderator
        if (
            comment.author.toString() !== req.user.id &&
            req.user.role === 'user'
        ) {
            res.status(401);
            throw new Error('User not authorized to delete this comment');
        }

        const postId = comment.post;

        // Use deleteOne() instead of remove()
        await Comment.deleteOne({ _id: comment._id });

        // Update comment count on post
        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });

        res.json({ id: req.params.id, message: 'Comment deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPosts,
    getUserPosts,
    getPostById,
    createPost,
    deletePost,
    upvotePost,
    downvotePost,
    getComments,
    addComment,
    deleteComment
};
