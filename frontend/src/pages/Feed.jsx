import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { LogOut, User as UserIcon, ShieldAlert, Flag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import LoadingScreen from '../components/LoadingScreen';
import NotificationBell from '../components/NotificationBell';
import { showAlert, showConfirm } from '../store/dialogStore';

const PASTEL_COLORS = ['#E8D0F9', '#C9F4E6', '#FBEB9F', '#FAD9D5', '#D4F1F4'];

const Feed = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showPostModal, setShowPostModal] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data } = await api.get('/posts');
            setPosts(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        try {
            setError(null);
            const { data } = await api.post('/posts', { content: newPost });
            setPosts([data, ...posts]);
            setNewPost('');
            setShowPostModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post confession');
        }
    };

    const handleDeletePost = async (id) => {
        if (!(await showConfirm('Are you sure you want to delete this confession?'))) return;
        try {
            await api.delete(`/posts/${id}`);
            setPosts(posts.filter(p => p._id !== id));
        } catch (err) {
            showAlert('Failed to delete post');
        }
    };

    const handleEditPostSubmit = async (id) => {
        if (!editContent.trim()) return;
        try {
            const { data } = await api.put(`/posts/${id}`, { content: editContent });
            setPosts(posts.map(p => p._id === id ? { ...p, content: data.content } : p));
            setEditingPostId(null);
            setEditContent('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to edit post');
        }
    };

    const handleVote = async (id, type) => {
        try {
            const { data } = await api.post(`/posts/${id}/${type}`);
            // Optimistically update the single post in the list
            setPosts(posts.map(p => p._id === id ? data : p));
        } catch (err) {
            console.error('Vote failed', err);
        }
    };

    const onLogout = () => {
        logout();
        navigate('/login');
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

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, whiteSpace: 'nowrap' }}>💭 Confession Wall</h2>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                        <Link to="/admin" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none' }}>
                            <ShieldAlert size={16} /> Dashboard
                        </Link>
                    )}
                    <NotificationBell />
                    <Link to={`/profile/${user.username}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none' }}>
                        <UserIcon size={16} /> {user.username}
                    </Link>
                    <button onClick={onLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px', border: 'none' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Feed List */}
            <div>
                {loading ? (
                    <LoadingScreen text="Loading secrets..." />
                ) : posts.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>The wall is completely empty.</p>
                ) : (
                    posts.map((post, index) => (
                        <div key={post._id} className="card" style={{ padding: '25px', backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length] }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={post.author.avatarUrl} alt="avatar" style={{ width: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)' }} />
                                    <div>
                                        <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 'bold' }}>
                                            {post.author.username}
                                        </Link>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    {(user._id === post.author._id) && (
                                        <button 
                                            onClick={() => {
                                                if (editingPostId === post._id) {
                                                    setEditingPostId(null);
                                                } else {
                                                    setEditContent(post.content);
                                                    setEditingPostId(post._id);
                                                }
                                            }}
                                            className="btn-secondary" 
                                            style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                        >
                                            {editingPostId === post._id ? 'Cancel' : 'Edit'}
                                        </button>
                                    )}
                                    {(user._id === post.author._id || user.role === 'admin' || user.role === 'moderator') && (
                                        <button 
                                            onClick={() => handleDeletePost(post._id)}
                                            className="btn-danger" 
                                            style={{ padding: '2px 8px', fontSize: '0.8rem' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>

                            {editingPostId === post._id ? (
                                <div style={{ marginBottom: '20px' }}>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows="3"
                                        maxLength={1000}
                                        style={{ width: '100%', marginBottom: '10px', padding: '10px', resize: 'vertical' }}
                                    />
                                    <button onClick={() => handleEditPostSubmit(post._id)} className="btn-primary" style={{ padding: '5px 15px' }}>Save Changes</button>
                                </div>
                            ) : (
                                <p style={{ fontSize: '1.1rem', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                            )}

                            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)' }}>
                                <button onClick={() => handleVote(post._id, 'upvote')} style={{ background: 'none', color: post.upvotes.includes(user._id) ? 'var(--accent-color)' : 'inherit', padding: 0 }}>
                                    👍{post.upvotes.length}
                                </button>
                                <button onClick={() => handleVote(post._id, 'downvote')} style={{ background: 'none', color: post.downvotes.includes(user._id) ? 'var(--danger-color)' : 'inherit', padding: 0 }}>
                                    👎{post.downvotes.length}
                                </button>
                                <Link to={`/post/${post._id}`} style={{ color: 'inherit' }}>
                                    💬 {post.commentCount} Comments
                                </Link>
                                <button
                                    onClick={() => setReportingItem({ id: post._id, type: 'post' })}
                                    style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 }}
                                >
                                    <Flag size={14} /> Report
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reporting Modal */}
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

            {/* Floating Action Button */}
            <button
                onClick={() => setShowPostModal(true)}
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    right: '40px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '32px',
                    cursor: 'pointer',
                    zIndex: 900,
                    transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                +
            </button>

            {/* New Post Modal */}
            {showPostModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90vw' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Create a Confession</h3>
                            <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handlePostSubmit}>
                            <textarea
                                placeholder="Confess something anonymously... (No bullying, or you will be banned)"
                                rows="5"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                maxLength={1000}
                                style={{ width: '100%', marginBottom: '10px', padding: '15px', resize: 'vertical', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                            />
                            {error && <div style={{ color: 'var(--danger-color)', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Verified by AI Moderation</small>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setShowPostModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={!newPost.trim() || loading}>Post Confession</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Feed;
