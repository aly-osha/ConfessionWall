const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

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
                type,
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
            let targetDoc = report.type === 'post' ? await Post.findById(report.targetId) : await Comment.findById(report.targetId);
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
        if (report.type === 'post') {
            targetDoc = await Post.findById(report.targetId);
        } else {
            targetDoc = await Comment.findById(report.targetId);
        }

        if (targetDoc) {
            // Ensure content is hidden
            targetDoc.isHidden = true;
            await targetDoc.save();

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
