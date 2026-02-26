const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['post', 'comment'],
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'type', // Dynamically populate Post or Comment
        },
        reason: {
            type: String,
            required: [true, 'Please provide a reason for the report'],
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'dismissed'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

// Prevent a user from reporting the same item multiple times
ReportSchema.index({ reporter: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', ReportSchema);
