import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Flag } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { showAlert, showConfirm } from '../store/dialogStore';

const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportingItem, setReportingItem] = useState(null); // { id, type: 'post' | 'comment' }
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchPostAndComments();
    }, [id]);

    const fetchPostAndComments = async () => {
        try {
            const [postRes, commentsRes] = await Promise.all([
                api.get(`/posts/${id}`),
                api.get(`/posts/${id}/comments`)
            ]);
            setPost(postRes.data);
            setComments(commentsRes.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch post');
            setLoading(false);
        }
    };

    const handleVote = async (type) => {
        try {
            const { data } = await api.post(`/posts/${id}/${type}`);
            setPost(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const { data } = await api.post(`/posts/${id}/comments`, { content: newComment });
            setComments([...comments, data]);
            setNewComment('');
            setPost({ ...post, commentCount: post.commentCount + 1 });
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to add comment');
        }
    };

    const handleDeletePost = async () => {
        if (!(await showConfirm('Are you sure you want to delete this confession?'))) return;
        try {
            await api.delete(`/posts/${id}`);
            navigate('/');
        } catch (err) {
            showAlert('Failed to delete post');
        }
    };

    const handleEditPost = async () => {
        if (!editContent.trim()) return;
        try {
            const { data } = await api.put(`/posts/${id}`, { content: editContent });
            setPost({ ...post, content: data.content });
            setIsEditing(false);
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to edit post');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!(await showConfirm('Delete this comment?'))) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(c => c._id !== commentId));
            setPost({ ...post, commentCount: post.commentCount - 1 });
        } catch (err) {
            showAlert('Failed to delete comment');
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportReason.trim() || !reportingItem) return;

        try {
            await api.post('/reports', {
                type: reportingItem.type,
                targetId: reportingItem.id,
                reason: reportReason
            });
            showAlert('Report submitted successfully. Thank you.');
            setReportingItem(null);
            setReportReason('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to submit report');
        }
    };

    if (loading) return <LoadingScreen text="Loading..." />;
    if (error || !post) return <div className="container" style={{ marginTop: '40px', color: 'var(--danger-color)' }}>{error || 'Post not found'}</div>;

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowLeft size={16} /> Back
            </button>

            {/* Main Post */}
            <div className="card" style={{ padding: '30px', position: 'relative' }}>
                {(user._id === post.author._id || user.role === 'admin' || user.role === 'moderator') && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                        {user._id === post.author._id && (
                            <button
                                onClick={() => {
                                    if (isEditing) {
                                        setIsEditing(false);
                                    } else {
                                        setEditContent(post.content);
                                        setIsEditing(true);
                                    }
                                }}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit'}
                            </button>
                        )}
                        <button
                            onClick={handleDeletePost}
                            className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                            Delete
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <img src={post.author.avatarUrl} alt="avatar" style={{ width: '50px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)' }} />
                    <div>
                        <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {post.author.username}
                        </Link>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <div style={{ marginBottom: '30px' }}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows="4"
                            maxLength={1000}
                            style={{ width: '100%', marginBottom: '10px', padding: '10px', resize: 'vertical' }}
                        />
                        <button onClick={handleEditPost} className="btn-primary" style={{ padding: '5px 15px' }}>Save Changes</button>
                    </div>
                ) : (
                    <p style={{ fontSize: '1.2rem', marginBottom: '30px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button
                            onClick={() => handleVote('upvote')}
                            style={{ background: 'none', color: post.upvotes.includes(user._id) ? 'var(--accent-color)' : 'inherit', padding: 0 }}
                        >
                            ▲ {post.upvotes.length}
                        </button>
                        <button
                            onClick={() => handleVote('downvote')}
                            style={{ background: 'none', color: post.downvotes.includes(user._id) ? 'var(--danger-color)' : 'inherit', padding: 0 }}
                        >
                            ▼ {post.downvotes.length}
                        </button>
                    </div>

                    <button
                        onClick={() => setReportingItem({ id: post._id, type: 'post' })}
                        style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                    >
                        <Flag size={14} /> Report
                    </button>
                </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)', margin: '30px 0' }} />

            {/* Write Comment */}
            <h3 style={{ marginBottom: '15px' }}>Comments ({post.commentCount})</h3>
            <div className="card">
                <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Write a comment... (AI Monitored)"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={500}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" disabled={!newComment.trim()}>Post</button>
                </form>
            </div>

            {/* Comment List */}
            <div>
                {comments.map((comment) => (
                    <div key={comment._id} className="card" style={{ padding: '15px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={comment.author.avatarUrl} alt="avatar" style={{ width: '30px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)' }} />
                                <div>
                                    <Link to={`/profile/${comment.author.username}`} style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {comment.author.username}
                                    </Link>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {(user._id === comment.author._id || user.role === 'admin' || user.role === 'moderator') && (
                                    <button
                                        onClick={() => handleDeleteComment(comment._id)}
                                        className="btn-danger"
                                        style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                    >
                                        Del
                                    </button>
                                )}
                                <button
                                    onClick={() => setReportingItem({ id: comment._id, type: 'comment' })}
                                    style={{ background: 'none', color: 'var(--text-muted)', padding: 0 }}
                                >
                                    <Flag size={14} />
                                </button>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.95rem', marginLeft: '40px' }}>{comment.content}</p>
                    </div>
                ))}
            </div>

            {/* Reporting Modal / Inline Form */}
            {reportingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h3 style={{ marginBottom: '15px' }}>Report Content</h3>
                        <form onSubmit={handleReport}>
                            <textarea
                                placeholder="Why are you reporting this? (e.g., Harassment, Spam)"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                rows={4}
                                required
                                style={{ marginBottom: '15px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setReportingItem(null)}>Cancel</button>
                                <button type="submit" className="btn-danger" style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}>Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SinglePost;
