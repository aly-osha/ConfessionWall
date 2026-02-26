const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Please add text for your comment'],
            maxlength: [500, 'Comment cannot be more than 500 characters'],
        },
        reportCount: {
            type: Number,
            default: 0,
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Comment', CommentSchema);
