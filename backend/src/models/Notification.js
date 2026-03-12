const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String, // optional link to a post/profile
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Notification', NotificationSchema);
