import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import {
    ChevronRight,
    UserPlus,
    UserMinus,
    Flag,
    ArrowUp,
    ArrowDown,
    MessageCircle,
    Shield,
    Clock,
    Sparkles,
    CornerDownRight,
    Send,
} from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { showAlert, showConfirm } from '../store/dialogStore';

const PASTEL_COLORS = ['#E8D0F9', '#C9F4E6', '#FBEB9F', '#FAD9D5', '#D4F1F4'];

/* ── tiny reusable pieces ─────────────────────────────────────── */

const VoteCapsule = ({ post, user, onVote }) => {
    const upvoted = post.upvotes?.includes(user._id);
    const downvoted = post.downvotes?.includes(user._id);
    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0,
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
            }}
        >
            <button
                onClick={() => onVote('upvote')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: upvoted ? 'var(--accent-color)' : 'transparent',
                    color: upvoted ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: upvoted ? 600 : 400,
                    transition: 'all 0.15s',
                    fontSize: '0.9rem',
                }}
            >
                <ArrowUp size={15} /> {post.upvotes?.length ?? 0}
            </button>
            <div
                style={{
                    width: 1,
                    height: '60%',
                    background: 'var(--border-color)',
                }}
            />
            <button
                onClick={() => onVote('downvote')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: downvoted ? 'var(--danger-color)' : 'transparent',
                    color: downvoted ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: downvoted ? 600 : 400,
                    transition: 'all 0.15s',
                    fontSize: '0.9rem',
                }}
            >
                <ArrowDown size={15} /> {post.downvotes?.length ?? 0}
            </button>
        </div>
    );
};

/* ── main component ──────────────────────────────────────────── */

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [related, setRelated] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // comment _id
    const [replyContent, setReplyContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('');

    /* ── data fetching ── */
    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [postRes, commentsRes, feedRes] = await Promise.all([
                api.get(`/posts/${id}`),
                api.get(`/posts/${id}/comments`),
                api.get('/posts'),
            ]);
            setPost(postRes.data);
            setComments(
                commentsRes.data.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            );
            setRelated(
                feedRes.data.filter((p) => p._id !== id).slice(0, 5)
            );
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load post');
            setLoading(false);
        }
    };

    /* ── post actions ── */
    const handleVote = useCallback(
        async (type) => {
            if (!user) return;
            try {
                const { data } = await api.post(`/posts/${id}/${type}`);
                setPost(data);
            } catch (err) {
                showAlert(err.response?.data?.message || 'Vote failed');
            }
        },
        [id, user]
    );

    const handleFollowToggle = async () => {
        if (!user || !post) return;
        try {
            const isFollowing = post.author.followers?.some(
                (f) => f._id === user._id
            );
            if (isFollowing) {
                await api.post(`/users/${post.author._id}/unfollow`);
                setPost({
                    ...post,
                    author: {
                        ...post.author,
                        followers: post.author.followers.filter(
                            (f) => f._id !== user._id
                        ),
                    },
                });
            } else {
                await api.post(`/users/${post.author._id}/follow`);
                setPost({
                    ...post,
                    author: {
                        ...post.author,
                        followers: [
                            ...(post.author.followers || []),
                            { _id: user._id, username: user.username },
                        ],
                    },
                });
            }
        } catch (err) {
            showAlert('Failed to follow/unfollow');
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason.trim() || !reportingItem) return;
        try {
            await api.post('/reports', {
                type: reportingItem.type,
                targetId: reportingItem.id,
                reason: reportReason,
            });
            showAlert('Report submitted. Thank you for keeping the community safe.');
            setReportingItem(null);
            setReportReason('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to submit report');
        }
    };

    /* ── comment actions ── */
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data } = await api.post(`/posts/${id}/comments`, {
                content: newComment,
            });
            setComments((prev) =>
                [...prev, data].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            );
            setNewComment('');
            setPost((p) => ({ ...p, commentCount: p.commentCount + 1 }));
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to add comment');
        }
    };

    const handleReplySubmit = async (parentId) => {
        if (!replyContent.trim()) return;
        try {
            const { data } = await api.post(`/comments/${parentId}/reply`, {
                content: replyContent,
            });
            setComments((prev) =>
                [...prev, data].sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                )
            );
            setReplyingTo(null);
            setReplyContent('');
        } catch (err) {
            // Fallback: if reply endpoint doesn't exist, post as regular comment
            try {
                const { data } = await api.post(`/posts/${id}/comments`, {
                    content: replyContent,
                    parentId,
                });
                setComments((prev) =>
                    [...prev, data].sort(
                        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                    )
                );
                setReplyingTo(null);
                setReplyContent('');
            } catch (fallbackErr) {
                showAlert('Failed to post reply');
            }
        }
    };

    const handleCommentVote = async (commentId, type) => {
        try {
            const { data } = await api.post(`/comments/${commentId}/${type}`);
            setComments((prev) =>
                prev.map((c) => (c._id === commentId ? data : c))
            );
        } catch (err) {
            console.error(err);
        }
    };

    /* ── render guards ── */
    if (loading) return <LoadingScreen text="Loading confession..." />;
    if (error || !post)
        return (
            <div
                className="container"
                style={{ marginTop: 40, color: 'var(--danger-color)', textAlign: 'center' }}
            >
                <p>{error || 'Post not found'}</p>
                <Link to="/" className="btn-secondary" style={{ display: 'inline-block', marginTop: 16 }}>
                    Back to Feed
                </Link>
            </div>
        );

    const isAuthor = user?._id === post.author._id;
    const isFollowing = post.author.followers?.some((f) => f._id === user?._id);
    const canDelete =
        user && (isAuthor || user.role === 'admin' || user.role === 'moderator');

    return (
        <div className="container" style={{ marginTop: 32, marginBottom: 60 }}>
            {/* ── Breadcrumb ── */}
            <nav
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 24,
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                }}
            >
                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                    Home
                </Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--text-secondary)' }}>Confession</span>
                <ChevronRight size={14} />
                <span
                    style={{
                        color: 'var(--text-muted)',
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {post.content.slice(0, 40)}…
                </span>
            </nav>

            {/* ── Two-column layout ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 340px',
                    gap: 32,
                    alignItems: 'start',
                }}
                className="postdetail-grid"
            >
                {/* ═══ MAIN COLUMN ═══ */}
                <div style={{ minWidth: 0 }}>
                    {/* ── Hero Confession Card ── */}
                    <div
                        className="card"
                        style={{
                            padding: 0,
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Gradient top border */}
                        <div
                            style={{
                                height: 5,
                                background:
                                    'linear-gradient(90deg, #a78bfa, #f472b6, #fb923c, #a78bfa)',
                                backgroundSize: '200% 100%',
                                animation: 'gradientShift 6s ease infinite',
                            }}
                        />
                        <div style={{ padding: '32px 36px' }}>
                            {/* Author row */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: 24,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 14,
                                    }}
                                >
                                    <img
                                        src={
                                            post.author.avatarUrl ||
                                            'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
                                                post.author.username
                                        }
                                        alt={post.author.username}
                                        style={{
                                            width: 54,
                                            height: 54,
                                            borderRadius: '50%',
                                            background: 'var(--bg-surface-hover)',
                                            objectFit: 'cover',
                                        }}
                                    />
                                    <div>
                                        <Link
                                            to={`/profile/${post.author.username}`}
                                            style={{
                                                fontWeight: 700,
                                                fontSize: '1.05rem',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            {post.author.username}
                                            {post.author.role !== 'user' && (
                                                <Shield
                                                    size={13}
                                                    color="var(--danger-color)"
                                                />
                                            )}
                                        </Link>
                                        <div
                                            style={{
                                                fontSize: '0.82rem',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginTop: 2,
                                            }}
                                        >
                                            <Clock size={12} />
                                            {formatDistanceToNow(
                                                new Date(post.createdAt),
                                                { addSuffix: true }
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Follow / Report buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {user && !isAuthor && (
                                        <button
                                            onClick={handleFollowToggle}
                                            className={
                                                isFollowing
                                                    ? 'btn-secondary'
                                                    : 'btn-primary'
                                            }
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '7px 14px',
                                                fontSize: '0.82rem',
                                            }}
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <UserMinus size={14} /> Unfollow
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={14} /> Follow
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() =>
                                            setReportingItem({
                                                id: post._id,
                                                type: 'post',
                                            })
                                        }
                                        className="btn-secondary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            padding: '7px 12px',
                                            fontSize: '0.82rem',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        <Flag size={13} /> Report
                                    </button>
                                </div>
                            </div>

                            {/* Confession content */}
                            <p
                                style={{
                                    fontSize: '1.15rem',
                                    lineHeight: 1.7,
                                    marginBottom: 28,
                                    whiteSpace: 'pre-wrap',
                                    color: 'var(--text-primary, #1a1a2e)',
                                }}
                            >
                                {post.content}
                            </p>

                            {/* Voting + meta row */}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: 18,
                                    borderTop:
                                        '1px solid var(--border-color)',
                                }}
                            >
                                <VoteCapsule
                                    post={post}
                                    user={user}
                                    onVote={handleVote}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 18,
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.88rem',
                                    }}
                                >
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <MessageCircle size={15} />{' '}
                                        {post.commentCount} comments
                                    </span>
                                </div>
                            </div>

                            {/* Admin/moderator delete */}
                            {canDelete && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                    <button
                                        onClick={async () => {
                                            if (
                                                !(await showConfirm(
                                                    'Delete this confession?'
                                                ))
                                            ) {
                                                return;
                                            }
                                            try {
                                                await api.delete(`/posts/${id}`);
                                                navigate('/');
                                            } catch {
                                                showAlert('Failed to delete');
                                            }
                                        }}
                                        className="btn-danger"
                                        style={{
                                            padding: '5px 14px',
                                            fontSize: '0.78rem',
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Comment Composer ── */}
                    <div
                        className="card"
                        style={{
                            marginTop: 28,
                            padding: '24px 28px',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 14,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>
                                Join the discussion
                            </h3>
                            {/* AI Moderation Badge */}
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '4px 12px',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
                                    color: '#6d28d9',
                                    border: '1px solid #c4b5fd',
                                }}
                            >
                                <Sparkles size={12} /> AI Moderated
                            </span>
                        </div>

                        {user ? (
                            <form
                                onSubmit={handleCommentSubmit}
                                style={{ display: 'flex', gap: 12 }}
                            >
                                <img
                                    src={
                                        user.avatarUrl ||
                                        'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
                                            user.username
                                    }
                                    alt="you"
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        background: 'var(--bg-surface-hover)',
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) =>
                                            setNewComment(e.target.value)
                                        }
                                        placeholder="Write a thoughtful comment…"
                                        rows={3}
                                        maxLength={500}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: 10,
                                            border:
                                                '1px solid var(--border-color)',
                                            background: 'var(--bg-surface)',
                                            color: 'var(--text-primary, #1a1a2e)',
                                            resize: 'vertical',
                                            fontSize: '0.92rem',
                                            fontFamily: 'inherit',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginTop: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            {newComment.length}/500
                                        </span>
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={!newComment.trim()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '8px 18px',
                                                fontSize: '0.85rem',
                                                opacity: !newComment.trim()
                                                    ? 0.5
                                                    : 1,
                                                cursor: !newComment.trim()
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                            }}
                                        >
                                            <Send size={14} /> Post Comment
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <p
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                    margin: 0,
                                    textAlign: 'center',
                                    padding: '12px 0',
                                }}
                            >
                                <Link to="/login" style={{ color: 'var(--accent-color)' }}>
                                    Log in
                                </Link>{' '}
                                to join the discussion.
                            </p>
                        )}
                    </div>

                    {/* ── Comment Thread ── */}
                    <div style={{ marginTop: 28 }}>
                        <h3
                            style={{
                                marginBottom: 18,
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            Discussion
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    fontWeight: 400,
                                }}
                            >
                                ({comments.length})
                            </span>
                        </h3>

                        {comments.length === 0 ? (
                            <div
                                className="card"
                                style={{
                                    padding: '36px 24px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.9rem',
                                }}
                            >
                                No comments yet. Be the first to share your thoughts.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {comments.map((comment, idx) => {
                                    const cUpvoted =
                                        comment.upvotes?.includes(user?._id);
                                    const cDownvoted =
                                        comment.downvotes?.includes(user?._id);
                                    const canDeleteComment =
                                        user &&
                                        (user._id === comment.author._id ||
                                            user.role === 'admin' ||
                                            user.role === 'moderator');

                                    return (
                                        <div
                                            key={comment._id}
                                            className="card"
                                            style={{
                                                padding: '20px 24px',
                                                background:
                                                    PASTEL_COLORS[
                                                        idx % PASTEL_COLORS.length
                                                    ] + '55',
                                                borderLeft: `3px solid ${PASTEL_COLORS[idx % PASTEL_COLORS.length]}`,
                                            }}
                                        >
                                            {/* Comment header */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                    }}
                                                >
                                                    <img
                                                        src={
                                                            comment.author
                                                                .avatarUrl ||
                                                            'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
                                                                comment.author
                                                                    .username
                                                        }
                                                        alt=""
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            background:
                                                                'var(--bg-surface-hover)',
                                                        }}
                                                    />
                                                    <Link
                                                        to={`/profile/${comment.author.username}`}
                                                        style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.88rem',
                                                            textDecoration: 'none',
                                                            color: 'inherit',
                                                        }}
                                                    >
                                                        {comment.author.username}
                                                    </Link>
                                                    <span
                                                        style={{
                                                            fontSize: '0.78rem',
                                                            color: 'var(--text-muted)',
                                                        }}
                                                    >
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                comment.createdAt
                                                            ),
                                                            { addSuffix: true }
                                                        )}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 4,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {canDeleteComment && (
                                                        <button
                                                            onClick={async () => {
                                                                if (
                                                                    !(await showConfirm(
                                                                        'Delete this comment?'
                                                                    ))
                                                                ) {
                                                                    return;
                                                                }
                                                                try {
                                                                    await api.delete(
                                                                        `/comments/${comment._id}`
                                                                    );
                                                                    setComments(
                                                                        prev =>
                                                                            prev.filter(
                                                                                c =>
                                                                                    c._id !==
                                                                                    comment._id
                                                                            )
                                                                    );
                                                                } catch {
                                                                    showAlert(
                                                                        'Failed to delete'
                                                                    );
                                                                }
                                                            }}
                                                            className="btn-danger"
                                                            style={{
                                                                padding: '2px 8px',
                                                                fontSize: '0.68rem',
                                                            }}
                                                        >
                                                            Del
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            setReportingItem({
                                                                id: comment._id,
                                                                type: 'comment',
                                                            })
                                                        }
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: 'var(--text-muted)',
                                                            padding: 4,
                                                            display: 'flex',
                                                        }}
                                                    >
                                                        <Flag size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Comment body */}
                                            <p
                                                style={{
                                                    fontSize: '0.93rem',
                                                    lineHeight: 1.6,
                                                    margin: '0 0 12px 0',
                                                    whiteSpace: 'pre-wrap',
                                                    color: 'var(--text-primary, #1a1a2e)',
                                                }}
                                            >
                                                {comment.content}
                                            </p>

                                            {/* Comment actions */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 16,
                                                }}
                                            >
                                                {/* Mini vote */}
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            handleCommentVote(
                                                                comment._id,
                                                                'upvote'
                                                            )
                                                        }
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: cUpvoted
                                                                ? 'var(--accent-color)'
                                                                : 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            fontSize: '0.78rem',
                                                            padding: 2,
                                                        }}
                                                    >
                                                        <ArrowUp size={13} />
                                                        {comment.upvotes?.length ??
                                                            0}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleCommentVote(
                                                                comment._id,
                                                                'downvote'
                                                            )
                                                        }
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: cDownvoted
                                                                ? 'var(--danger-color)'
                                                                : 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            fontSize: '0.78rem',
                                                            padding: 2,
                                                        }}
                                                    >
                                                        <ArrowDown size={13} />
                                                        {comment.downvotes?.length ??
                                                            0}
                                                    </button>
                                                </div>

                                                {/* Reply */}
                                                {user && (
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                replyingTo ===
                                                                comment._id
                                                            ) {
                                                                setReplyingTo(
                                                                    null
                                                                );
                                                                setReplyContent(
                                                                    ''
                                                                );
                                                            } else {
                                                                setReplyingTo(
                                                                    comment._id
                                                                );
                                                                setReplyContent(
                                                                    ''
                                                                );
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color:
                                                                replyingTo ===
                                                                comment._id
                                                                    ? 'var(--accent-color)'
                                                                    : 'var(--text-muted)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                            fontSize: '0.78rem',
                                                            fontWeight:
                                                                replyingTo ===
                                                                comment._id
                                                                    ? 600
                                                                    : 400,
                                                            padding: 2,
                                                        }}
                                                    >
                                                        <CornerDownRight
                                                            size={13}
                                                        />
                                                        {replyingTo === comment._id
                                                            ? 'Cancel'
                                                            : 'Reply'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Inline reply form */}
                                            {replyingTo === comment._id && (
                                                <div
                                                    style={{
                                                        marginTop: 14,
                                                        marginLeft: 18,
                                                        paddingLeft: 14,
                                                        borderLeft:
                                                            '2px solid var(--border-color)',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: 8,
                                                            alignItems:
                                                                'flex-start',
                                                        }}
                                                    >
                                                        <textarea
                                                            value={replyContent}
                                                            onChange={(e) =>
                                                                setReplyContent(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder={`Reply to ${comment.author.username}…`}
                                                            rows={2}
                                                            maxLength={500}
                                                            autoFocus
                                                            style={{
                                                                flex: 1,
                                                                padding:
                                                                    '10px 12px',
                                                                borderRadius: 8,
                                                                border: '1px solid var(--border-color)',
                                                                background:
                                                                    'var(--bg-surface)',
                                                                color: 'var(--text-primary, #1a1a2e)',
                                                                resize: 'vertical',
                                                                fontSize:
                                                                    '0.85rem',
                                                                fontFamily:
                                                                    'inherit',
                                                                boxSizing:
                                                                    'border-box',
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() =>
                                                                handleReplySubmit(
                                                                    comment._id
                                                                )
                                                            }
                                                            disabled={
                                                                !replyContent.trim()
                                                            }
                                                            className="btn-primary"
                                                            style={{
                                                                padding:
                                                                    '8px 14px',
                                                                fontSize:
                                                                    '0.78rem',
                                                                opacity: !replyContent.trim()
                                                                    ? 0.5
                                                                    : 1,
                                                                cursor: !replyContent.trim()
                                                                    ? 'not-allowed'
                                                                    : 'pointer',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <Send size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT SIDEBAR ═══ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* ── Author Snapshot Card ── */}
                    <div
                        className="card"
                        style={{
                            padding: '28px 24px',
                            textAlign: 'center',
                            position: 'sticky',
                            top: 20,
                        }}
                    >
                        <img
                            src={
                                post.author.avatarUrl ||
                                'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
                                    post.author.username
                            }
                            alt={post.author.username}
                            style={{
                                width: 88,
                                height: 88,
                                borderRadius: '50%',
                                background: 'var(--bg-surface-hover)',
                                marginBottom: 16,
                                objectFit: 'cover',
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                marginBottom: 4,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                                {post.author.username}
                            </h3>
                            {post.author.role !== 'user' && (
                                <Shield size={15} color="var(--danger-color)" />
                            )}
                        </div>
                        {post.author.role !== 'user' && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '2px 10px',
                                    borderRadius: 999,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    background: 'var(--danger-color)',
                                    color: '#fff',
                                    marginBottom: 12,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {post.author.role}
                            </span>
                        )}

                        {/* Stats */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 32,
                                margin: '18px 0',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: '1.4rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    {post.author.followers?.length ?? 0}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    Followers
                                </div>
                            </div>
                            <div
                                style={{
                                    width: 1,
                                    background: 'var(--border-color)',
                                }}
                            />
                            <div>
                                <div
                                    style={{
                                        fontSize: '1.4rem',
                                        fontWeight: 700,
                                    }}
                                >
                                    {post.author.following?.length ?? 0}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'var(--text-muted)',
                                    }}
                                >
                                    Following
                                </div>
                            </div>
                        </div>

                        {/* Follow button */}
                        {user && !isAuthor ? (
                            <button
                                onClick={handleFollowToggle}
                                className={
                                    isFollowing ? 'btn-secondary' : 'btn-primary'
                                }
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontSize: '0.88rem',
                                }}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserMinus size={16} /> Unfollow
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={16} /> Follow Author
                                    </>
                                )}
                            </button>
                        ) : (
                            <Link
                                to={`/profile/${post.author.username}`}
                                className="btn-secondary"
                                style={{
                                    display: 'block',
                                    padding: '10px',
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    fontSize: '0.88rem',
                                }}
                            >
                                View Full Profile
                            </Link>
                        )}
                    </div>

                    {/* ── Related Confessions ── */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3
                            style={{
                                margin: '0 0 16px 0',
                                fontSize: '0.95rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Sparkles
                                size={15}
                                color="var(--accent-color)"
                            />
                            More Confessions
                        </h3>

                        {related.length === 0 ? (
                            <p
                                style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    padding: '12px 0',
                                }}
                            >
                                No other confessions yet.
                            </p>
                        ) : (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                {related.map((r, i) => (
                                    <Link
                                        key={r._id}
                                        to={`/post/${r._id}`}
                                        style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            display: 'block',
                                            padding: '12px 14px',
                                            borderRadius: 10,
                                            background:
                                                PASTEL_COLORS[
                                                    i % PASTEL_COLORS.length
                                                ] + '44',
                                            border:
                                                '1px solid var(--border-color)',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor =
                                                'var(--accent-color)';
                                            e.currentTarget.style.transform =
                                                'translateX(3px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                'var(--border-color)';
                                            e.currentTarget.style.transform =
                                                'translateX(0)';
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 6,
                                            }}
                                        >
                                            <img
                                                src={
                                                    r.author.avatarUrl ||
                                                    'https://api.dicebear.com/7.x/thumbs/svg?seed=' +
                                                        r.author.username
                                                }
                                                alt=""
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    background:
                                                        'var(--bg-surface-hover)',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontSize: '0.78rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {r.author.username}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '0.72rem',
                                                    color: 'var(--text-muted)',
                                                    marginLeft: 'auto',
                                                }}
                                            >
                                                {formatDistanceToNow(
                                                    new Date(r.createdAt),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.84rem',
                                                lineHeight: 1.5,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                color: 'var(--text-secondary)',
                                            }}
                                        >
                                            {r.content}
                                        </p>
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 14,
                                                marginTop: 8,
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)',
                                            }}
                                        >
                                            <span>
                                                👍{' '}
                                                {r.upvotes?.length ?? 0}
                                            </span>
                                            <span>
                                                💬{' '}
                                                {r.commentCount ?? 0}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Responsive: stack on mobile ── */}
            <style>{`
                @media (max-width: 900px) {
                    .postdetail-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
            `}</style>

            {/* ── Report Modal ── */}
            {reportingItem && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: 20,
                    }}
                    onClick={() => setReportingItem(null)}
                >
                    <div
                        className="card"
                        style={{
                            width: 420,
                            maxWidth: '100%',
                            padding: 28,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                            Report {reportingItem.type}
                        </h3>
                        <form onSubmit={handleReport}>
                            <textarea
                                placeholder="Why are you reporting this? (e.g., Harassment, Spam, Hate speech)"
                                value={reportReason}
                                onChange={(e) =>
                                    setReportReason(e.target.value)
                                }
                                rows={4}
                                required
                                autoFocus
                                style={{
                                    width: '100%',
                                    marginBottom: 16,
                                    padding: '12px 14px',
                                    borderRadius: 8,
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary, #1a1a2e)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 10,
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setReportingItem(null);
                                        setReportReason('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-danger"
                                    style={{
                                        background: 'var(--danger-color)',
                                        color: '#fff',
                                    }}
                                >
                                    Submit Report
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
