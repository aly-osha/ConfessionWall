import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Feed = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h2>Confession Wall</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                    {user.role === 'admin' && (
                        <Link to="/admin" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <ShieldAlert size={16} /> Admin
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
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Feed;
