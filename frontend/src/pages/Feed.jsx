import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { LogOut, User as UserIcon, ShieldAlert, Flag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Feed = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('');

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
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post confession');
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
            alert('Report submitted successfully. Thank you.');
            setReportingItem(null);
            setReportReason('');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit report');
        }
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>💭 Confession Wall</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    {(user.role === 'admin' || user.role === 'moderator') && (
                        <Link to="/admin" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldAlert size={16} /> Dashboard
                        </Link>
                    )}
                    <Link to={`/profile/${user.username}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <UserIcon size={16} /> {user.username}
                    </Link>
                    <button onClick={onLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Post Box */}
            <div className="card">
                <form onSubmit={handlePostSubmit}>
                    <textarea
                        placeholder="Confess something anonymously... (No bullying, or you will be banned)"
                        rows="3"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        maxLength={1000}
                        style={{ marginBottom: '10px', resize: 'vertical' }}
                    />
                    {error && <div style={{ color: 'var(--danger-color)', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ color: 'var(--text-muted)' }}>Verified by AI Moderation</small>
                        <button type="submit" className="btn-primary" disabled={!newPost.trim()}>Post Confession</button>
                    </div>
                </form>
            </div>

            {/* Feed List */}
            <div>
                {loading ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading secrets...</p>
                ) : posts.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>The wall is completely empty.</p>
                ) : (
                    posts.map((post) => (
                        <div key={post._id} className="card" style={{ padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={post.author.avatarUrl} alt="avatar" style={{ width: '40px', borderRadius: '50%', backgroundColor: '#21262d' }} />
                                    <div>
                                        <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 'bold' }}>
                                            {post.author.username}
                                        </Link>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: '1.1rem', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>{post.content}</p>

                            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)' }}>
                                <button onClick={() => handleVote(post._id, 'upvote')} style={{ background: 'none', color: post.upvotes.includes(user._id) ? 'var(--accent-color)' : 'inherit', padding: 0 }}>
                                    ▲ {post.upvotes.length}
                                </button>
                                <button onClick={() => handleVote(post._id, 'downvote')} style={{ background: 'none', color: post.downvotes.includes(user._id) ? 'var(--danger-color)' : 'inherit', padding: 0 }}>
                                    ▼ {post.downvotes.length}
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

        </div>
    );
};

export default Feed;
