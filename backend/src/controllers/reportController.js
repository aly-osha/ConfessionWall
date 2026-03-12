const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const REPORT_THRESHOLD = 5;
const WARNING_LIMIT = 3;

// @desc    Report a post or comment
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
    try {
        const { type, targetId, reason } = req.body;

        if (!type || !targetId || !reason) {
            res.status(400);
            throw new Error('Please provide type, targetId, and reason');
        }

        // Check if target exists
        let targetDoc;
        if (type === 'post') {
            targetDoc = await Post.findById(targetId);
        } else if (type === 'comment') {
            targetDoc = await Comment.findById(targetId);
        } else {
            res.status(400);
            throw new Error('Invalid report type');
        }

        if (!targetDoc) {
            res.status(404);
            throw new Error(`${type} not found`);
        }

        // Create report
        try {
            await Report.create({
                reporter: req.user.id,
                type: type.charAt(0).toUpperCase() + type.slice(1),
                targetId,
                reason,
            });
        } catch (err) {
            if (err.code === 11000) {
                res.status(400);
                throw new Error('You have already reported this item');
            }
            throw err;
        }

        // Increment report count on target Doc
        targetDoc.reportCount += 1;

        // Check Auto-Hide threshold
        if (targetDoc.reportCount >= REPORT_THRESHOLD) {
            targetDoc.isHidden = true;
        }

        await targetDoc.save();

        // Notify admins and moderators
        const staffUsers = await User.find({ role: { $in: ['admin', 'moderator'] } });
        const notifications = staffUsers.map(staff => ({
            recipient: staff._id,
            message: `New report submitted for a ${type}.`,
            link: '/admin'
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message: 'Report submitted successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all pending reports
// @route   GET /api/reports
// @access  Private/Admin/Moderator
const getReports = async (req, res, next) => {
    try {
        const reports = await Report.find({ status: 'pending' })
            .populate('reporter', 'username')
            .populate({
                path: 'targetId',
                select: 'content author isHidden reportCount',
                populate: {
                    path: 'author',
                    select: 'username warningCount status'
                }
            })
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (error) {
        next(error);
    }
};

// @desc    Review a report (Take Action)
// @route   PUT /api/reports/:id/review
// @access  Private/Admin/Moderator
const reviewReport = async (req, res, next) => {
    try {
        const { action } = req.body; // 'dismiss', 'warn', 'ban'
        const report = await Report.findById(req.params.id);

        if (!report) {
            res.status(404);
            throw new Error('Report not found');
        }

        if (!['dismiss', 'warn', 'ban'].includes(action)) {
            res.status(400);
            throw new Error('Invalid action');
        }

        if (action === 'dismiss') {
            report.status = 'dismissed';
            await report.save();
            // Restore post visibility if it was hidden
            let targetDoc = report.type.toLowerCase() === 'post' ? await Post.findById(report.targetId) : await Comment.findById(report.targetId);
            if (targetDoc && targetDoc.reportCount >= REPORT_THRESHOLD) {
                targetDoc.isHidden = false;
                targetDoc.reportCount = 0; // Reset count
                await targetDoc.save();
            }
            return res.json(report);
        }

        // For 'warn' or 'ban'
        report.status = 'reviewed';
        await report.save();

        let targetDoc;
        if (report.type.toLowerCase() === 'post') {
            targetDoc = await Post.findById(report.targetId);
        } else {
            targetDoc = await Comment.findById(report.targetId);
        }

        if (targetDoc) {
            // Delete content instead of hiding
            if (report.type.toLowerCase() === 'post') {
                await Post.findByIdAndDelete(targetDoc._id);
                await Comment.deleteMany({ post: targetDoc._id });
            } else {
                const commentPostId = targetDoc.post;
                await Comment.findByIdAndDelete(targetDoc._id);
                if (commentPostId) {
                    await Post.findByIdAndUpdate(commentPostId, { $inc: { commentCount: -1 } });
                }
            }

            // Take action on author
            const author = await User.findById(targetDoc.author);
            if (author) {
                if (action === 'ban') {
                    author.status = 'perm_banned';
                } else if (action === 'warn') {
                    author.warningCount += 1;
                    if (author.warningCount >= WARNING_LIMIT) {
                        author.status = 'temp_banned';
                    } else {
                        author.status = 'warned';
                    }
                }
                await author.save();

                // Notify User
                let notificationMsg = '';
                if (action === 'ban') {
                    notificationMsg = `Your account has been permanently banned due to a report on your ${report.type.toLowerCase()}: "${targetDoc.content.substring(0, 30)}..."`;
                } else if (action === 'warn') {
                    notificationMsg = `You have received a warning and your ${report.type.toLowerCase()} was deleted due to a report: "${targetDoc.content.substring(0, 30)}..."`;
                }

                if (notificationMsg) {
                    await Notification.create({
                        recipient: author._id,
                        message: notificationMsg,
                        link: `/profile/${author.username}`
                    });
                }
            }
        }

        res.json(report);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReport,
    getReports,
    reviewReport,
};
