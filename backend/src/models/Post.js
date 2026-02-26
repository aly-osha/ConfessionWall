const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Please add text for your confession'],
            maxlength: [1000, 'Confession cannot be more than 1000 characters'],
        },
        upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        commentCount: {
            type: Number,
            default: 0,
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

// Virtual for net votes
PostSchema.virtual('netVotes').get(function () {
    return this.upvotes.length - this.downvotes.length;
});

module.exports = mongoose.model('Post', PostSchema);
