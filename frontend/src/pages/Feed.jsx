import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    LogOut, User as UserIcon, ShieldAlert, Flag, PenLine, Flame, Clock,
    MessageCircle, GraduationCap, ArrowBigUp, ArrowBigDown, Sparkles,
    Home, Compass, Bookmark, ScrollText, TrendingUp, X, Hash, Lightbulb,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';
import NotificationBell from '../components/NotificationBell';
import { showAlert, showConfirm } from '../store/dialogStore';

const PASTEL_COLORS = ['#E8D0F9', '#C9F4E6', '#FBEB9F', '#FAD9D5', '#D4F1F4'];

const MAX_CHARS = 1000;

const SUGGESTED_TAGS = ['crush', 'hostel', 'mess', 'library', 'exam', 'placement', 'canteen', 'fest', 'faculty', 'friends'];

const CAMPU_TAGS = ['crush', 'hostel', 'mess', 'library', 'exam', 'placement', 'canteen', 'sports', 'fest', 'faculty'];

const TABS = [
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'latest', label: 'Latest', icon: Clock },
    { id: 'discussed', label: 'Most Discussed', icon: MessageCircle },
    { id: 'campu', label: 'Campu Specials', icon: GraduationCap },
];

const COMMUNITY_RULES = [
    'Be kind — no bullying, hate, or harassment.',
    'No spam, ads, or self-promotion.',
    'Respect privacy: do not share anyone\'s personal details.',
    'All confessions pass through AI moderation.',
    'Keep it campus-safe and appropriate for everyone.',
];

/* Voting capsule (up/down pill) */
const VoteCapsule = ({ post, type, onVote }) => {
    const { user } = useAuthStore();
    const isUp = type === 'upvote';
    const activeList = isUp ? post.upvotes : post.downvotes;
    const active = activeList?.includes(user._id);
    const Icon = isUp ? ArrowBigUp : ArrowBigDown;
    return (
        <button
            onClick={() => onVote(post._id, type)}
            title={isUp ? 'Upvote' : 'Downvote'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '50px',
                border: `1px solid ${active ? (isUp ? 'var(--accent-color)' : 'var(--danger-color)') : 'var(--border-color)'}`,
                backgroundColor: active
                    ? (isUp ? 'var(--accent-color)' : 'var(--danger-color)')
                    : 'var(--bg-surface)',
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <Icon size={18} fill={active ? '#fff' : 'none'} />
            {activeList?.length ?? 0}
        </button>
    );
};

const Feed = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeTab, setActiveTab] = useState('trending');
    const [tagFilter, setTagFilter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState(null);
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data } = await api.get('/posts');
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        const content = newPost.trim();
        if (!content || content.length > MAX_CHARS) return;

        try {
            setPosting(true);
            setError(null);
            const { data } = await api.post('/posts', { content, tags: selectedTags });
            // Merge tags locally in case the API does not echo them back
            setPosts([{ ...data, tags: data.tags || selectedTags }, ...posts]);
            setNewPost('');
            setSelectedTags([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post confession');
        } finally {
            setPosting(false);
        }
    };

    const handleDeletePost = async (id) => {
        if (!(await showConfirm('Are you sure you want to delete this confession?'))) return;
        try {
            await api.delete(`/posts/${id}`);
            setPosts(posts.filter((p) => p._id !== id));
        } catch {
            showAlert('Failed to delete post');
        }
    };

    const handleEditPostSubmit = async (id) => {
        if (!editContent.trim()) return;
        try {
            const { data } = await api.put(`/posts/${id}`, { content: editContent });
            setPosts(posts.map((p) => (p._id === id ? { ...p, content: data.content } : p)));
            setEditingPostId(null);
            setEditContent('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to edit post');
        }
    };

    const handleVote = async (id, type) => {
        try {
            const { data } = await api.post(`/posts/${id}/${type}`);
            setPosts(posts.map((p) => (p._id === id ? data : p)));
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
                reason: reportReason,
            });
            showAlert('Report submitted successfully. Thank you.');
            setReportingItem(null);
            setReportReason('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to submit report');
        }
    };

    const toggleTag = (tag) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // Trending tags with counts, computed from all posts
    const trendingTags = useMemo(() => {
        const counts = {};
        posts.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
        return Object.entries(counts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [posts]);

    // Apply tag filter first, then the active tab ordering
    const visiblePosts = useMemo(() => {
        let list = tagFilter
            ? posts.filter((p) => (p.tags || []).includes(tagFilter))
            : [...posts];

        const score = (p) => (p.upvotes?.length ?? 0) * 2 + (p.commentCount ?? 0) * 3;

        switch (activeTab) {
            case 'trending':
                return list.sort((a, b) => score(b) - score(a));
            case 'latest':
                return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'discussed':
                return list.sort((a, b) => (b.commentCount ?? 0) - (a.commentCount ?? 0));
            case 'campu':
                return list
                    .filter((p) => (p.tags || []).some((t) => CAMPU_TAGS.includes(t)))
                    .sort((a, b) => score(b) - score(a));
            default:
                return list;
        }
    }, [posts, activeTab, tagFilter]);

    const isStaff = user && (user.role === 'admin' || user.role === 'moderator');

    if (!user) {
        navigate('/login');
        return null;
    }

    const composerChars = newPost.length;
    const nearLimit = composerChars >= MAX_CHARS - 100;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <style>{`
                @keyframes floatBlob {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    50% { transform: translateY(-20px) translateX(10px); }
                }
                @media (max-width: 1200px) { .feed-right { display: none; } }
                @media (max-width: 860px) {
                    .feed-left { position: static; width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border-color); }
                    .feed-wrap { flex-direction: column; }
                    .feed-main { padding: 20px; }
                }
            `}</style>

            {/* ============ LEFT SIDEBAR ============ */}
            <aside className="feed-left" style={{
                width: '240px',
                flexShrink: 0,
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflowY: 'auto',
                padding: '24px 16px',
                backgroundColor: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    marginBottom: '32px',
                    padding: '0 8px',
                }}>
                    <span style={{ fontSize: '1.6rem' }}>💭</span> Confession Wall
                </Link>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {[
                        { icon: Home, label: 'Feed', onClick: () => navigate('/') },
                        { icon: Compass, label: 'Explore', onClick: () => { setTagFilter(null); setActiveTab('trending'); } },
                        { icon: TrendingUp, label: 'Trending', onClick: () => { setTagFilter(null); setActiveTab('trending'); } },
                        { icon: Bookmark, label: 'Saved', onClick: () => showAlert('Saved confessions coming soon!') },
                    ].map(({ icon: Icon, label, onClick }) => (
                        <button key={label} onClick={onClick} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <Icon size={20} /> {label}
                        </button>
                    ))}

                    <div style={{ margin: '12px 8px', borderTop: '1px solid var(--border-color)' }} />

                    <Link to={`/profile/${user.username}`} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                    }}>
                        <UserIcon size={20} /> My Profile
                    </Link>

                    {isStaff && (
                        <Link to="/admin" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                        }}>
                            <ShieldAlert size={20} /> Dashboard
                        </Link>
                    )}
                </nav>

                <button onClick={onLogout} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--danger-color)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: '16px',
                }}>
                    <LogOut size={20} /> Logout
                </button>
            </aside>

            {/* ============ MAIN COLUMN ============ */}
            <div className="feed-wrap" style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                <main className="feed-main" style={{ flex: 1, maxWidth: '680px', margin: '0 auto', padding: '0 20px 60px', width: '100%' }}>

                    {/* Top ambient banner */}
                    <div style={{
                        marginTop: '24px',
                        borderRadius: '24px',
                        padding: '36px 32px',
                        background: 'linear-gradient(135deg, #F6512A 0%, #FF8A5C 55%, #FFB37E 100%)',
                        color: '#fff',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(246, 81, 42, 0.25)',
                    }}>
                        <div style={{
                            position: 'absolute', top: '-40px', right: '-40px',
                            width: '160px', height: '160px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            animation: 'floatBlob 6s ease-in-out infinite',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-60px', left: '30%',
                            width: '120px', height: '120px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            animation: 'floatBlob 8s ease-in-out infinite reverse',
                        }} />
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '4px 12px',
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                marginBottom: '12px',
                            }}>
                                <Sparkles size={13} /> AI-Moderated · Safe Space
                            </div>
                            <h2 style={{ color: '#fff', margin: '0 0 6px', fontSize: '1.6rem' }}>
                                {greeting}, {user.username} 👋
                            </h2>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
                                Share what's on your mind — anonymously. Your secrets stay safe here.
                            </p>
                        </div>
                    </div>

                    {/* Notification bell row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <NotificationBell />
                    </div>

                    {/* Post composer card */}
                    <div className="card" style={{ marginTop: '16px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--accent-color), #FFB37E)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', flexShrink: 0,
                            }}>
                                🤫
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>New Confession</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Visible to everyone · Posting as @{user.username}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePostSubmit}>
                            <textarea
                                placeholder="Confess something from your heart... (no bullying, or you'll be banned)"
                                rows={4}
                                maxLength={MAX_CHARS + 100}
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                style={{
                                    width: '100%',
                                    marginBottom: '12px',
                                    padding: '14px 18px',
                                    resize: 'vertical',
                                    borderRadius: '18px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface)',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.6,
                                }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: nearLimit ? 'var(--danger-color)' : 'var(--text-muted)',
                                    fontWeight: nearLimit ? 600 : 400,
                                }}>
                                    {composerChars} / {MAX_CHARS} characters
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Lightbulb size={13} /> Verified by AI Moderation
                                </span>
                            </div>

                            {/* Tag pills */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                                    Add tags:
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {SUGGESTED_TAGS.map((tag) => {
                                        const selected = selectedTags.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                style={{
                                                    padding: '5px 14px',
                                                    borderRadius: '50px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    border: `1px solid ${selected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                                    backgroundColor: selected ? 'var(--accent-color)' : 'var(--bg-surface)',
                                                    color: selected ? '#fff' : 'var(--text-secondary)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                #{tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {error && (
                                <div style={{ color: 'var(--danger-color)', marginBottom: '12px', fontSize: '0.88rem' }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={!newPost.trim() || composerChars > MAX_CHARS || posting}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <PenLine size={16} />
                                    {posting ? 'Posting...' : 'Post Confession'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Feed tab bar */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '24px',
                        marginBottom: '20px',
                        overflowX: 'auto',
                        paddingBottom: '4px',
                    }}>
                        {TABS.map(({ id, label, icon: Icon }) => {
                            const active = activeTab === id && !tagFilter;
                            return (
                                <button
                                    key={id}
                                    onClick={() => { setActiveTab(id); setTagFilter(null); }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '8px 18px',
                                        borderRadius: '50px',
                                        border: `1px solid ${active ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                        backgroundColor: active ? 'var(--accent-color)' : 'var(--bg-surface)',
                                        color: active ? '#fff' : 'var(--text-secondary)',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Icon size={16} /> {label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active tag filter chip */}
                    {tagFilter && (
                        <div style={{ marginBottom: '16px' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
                                borderRadius: '50px',
                                backgroundColor: 'var(--success-bg)',
                                color: 'var(--success-color)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                            }}>
                                <Hash size={14} /> {tagFilter}
                                <button
                                    onClick={() => setTagFilter(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        </div>
                    )}

                    {/* Feed list */}
                    {loading ? (
                        <LoadingScreen text="Loading secrets..." />
                    ) : visiblePosts.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '50px 30px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🕊️</div>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                {tagFilter
                                    ? `No confessions tagged #${tagFilter} yet. Be the first to share one!`
                                    : activeTab === 'campu'
                                        ? 'No campus specials right now. Check back soon!'
                                        : 'The wall is quiet... for now. Post the first confession!'}
                            </p>
                        </div>
                    ) : (
                        visiblePosts.map((post, index) => (
                            <div
                                key={post._id}
                                className="card"
                                style={{
                                    padding: '24px',
                                    backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length],
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                        <img
                                            src={post.author.avatarUrl}
                                            alt="avatar"
                                            style={{
                                                width: '42px', height: '42px', borderRadius: '50%',
                                                backgroundColor: 'var(--bg-surface-hover)', flexShrink: 0,
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <div style={{ minWidth: 0 }}>
                                            <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 600, display: 'block' }}>
                                                {post.author.username}
                                            </Link>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
                                        {user._id === post.author._id && (
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
                                                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                            >
                                                {editingPostId === post._id ? 'Cancel' : 'Edit'}
                                            </button>
                                        )}
                                        {(user._id === post.author._id || isStaff) && (
                                            <button
                                                onClick={() => handleDeletePost(post._id)}
                                                className="btn-danger"
                                                style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editingPostId === post._id ? (
                                    <div style={{ marginBottom: '18px' }}>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={3}
                                            maxLength={MAX_CHARS}
                                            style={{
                                                width: '100%', marginBottom: '10px', padding: '12px 16px',
                                                resize: 'vertical', borderRadius: '14px',
                                                border: '1px solid var(--border-color)',
                                                backgroundColor: 'var(--bg-surface)', fontSize: '0.95rem',
                                            }}
                                        />
                                        <button
                                            onClick={() => handleEditPostSubmit(post._id)}
                                            className="btn-primary"
                                            style={{ padding: '6px 18px', fontSize: '0.85rem' }}
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '1rem', marginBottom: '14px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                        {post.content}
                                    </p>
                                )}

                                {(post.tags || []).length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                        {post.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                onClick={() => setTagFilter(tag)}
                                                style={{
                                                    padding: '3px 12px',
                                                    borderRadius: '50px',
                                                    backgroundColor: 'rgba(255,255,255,0.75)',
                                                    border: '1px solid var(--border-color)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <VoteCapsule post={post} type="upvote" onVote={handleVote} />
                                        <VoteCapsule post={post} type="downvote" onVote={handleVote} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                                        <Link to={`/post/${post._id}`} style={{
                                            color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem',
                                        }}>
                                            <MessageCircle size={16} /> {post.commentCount ?? 0} Comments
                                        </Link>
                                        <button
                                            onClick={() => setReportingItem({ id: post._id, type: 'post' })}
                                            style={{
                                                background: 'none', border: 'none', color: 'inherit',
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                fontSize: '0.9rem', cursor: 'pointer', padding: 0,
                                            }}
                                        >
                                            <Flag size={15} /> Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </main>

                {/* ============ RIGHT SIDEBAR ============ */}
                <aside className="feed-right" style={{
                    width: '300px',
                    flexShrink: 0,
                    padding: '24px 20px',
                }}>
                    <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Community rules */}
                        <div className="card" style={{ padding: '22px', marginBottom: 0 }}>
                            <h3 style={{
                                margin: '0 0 14px', fontSize: '1.05rem',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <ScrollText size={18} style={{ color: 'var(--accent-color)' }} /> Community Rules
                            </h3>
                            <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {COMMUNITY_RULES.map((rule) => (
                                    <li key={rule} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        {rule}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Trending tags */}
                        <div className="card" style={{ padding: '22px', marginBottom: 0 }}>
                            <h3 style={{
                                margin: '0 0 14px', fontSize: '1.05rem',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <TrendingUp size={18} style={{ color: 'var(--accent-color)' }} /> Trending Tags
                            </h3>
                            {trendingTags.length === 0 ? (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Tag your confessions to start a trend!
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {trendingTags.map(({ tag, count }, i) => (
                                        <button
                                            key={tag}
                                            onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 12px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                backgroundColor: tagFilter === tag ? 'var(--success-bg)' : 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'background-color 0.2s ease',
                                            }}
                                            onMouseOver={(e) => { if (tagFilter !== tag) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; }}
                                            onMouseOut={(e) => { if (tagFilter !== tag) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <span style={{
                                                width: '26px', height: '26px', borderRadius: '8px',
                                                backgroundColor: PASTEL_COLORS[i % PASTEL_COLORS.length],
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {i + 1}
                                            </span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>
                                                #{tag}
                                            </span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {count} {count === 1 ? 'post' : 'posts'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Community stats footer */}
                        <div style={{ textAlign: 'center', padding: '0 12px' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                💭 Confession Wall · {posts.length} confessions and counting
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ============ REPORT MODAL ============ */}
            {reportingItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                }}
                    onClick={() => setReportingItem(null)}
                >
                    <div className="card" style={{ width: '420px', maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <h3 style={{ margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Flag size={18} style={{ color: 'var(--danger-color)' }} /> Report Confession
                            </h3>
                            <button
                                onClick={() => setReportingItem(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}
                            >
                                &times;
                            </button>
                        </div>
                        <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Why are you reporting this? Our moderators will review it.
                        </p>
                        <form onSubmit={handleReport}>
                            <textarea
                                placeholder="Reason (e.g., Harassment, Spam, Hate speech)"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                rows={4}
                                required
                                style={{
                                    width: '100%', marginBottom: '16px', padding: '12px 16px',
                                    resize: 'vertical', borderRadius: '14px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-surface)', fontSize: '0.95rem',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setReportingItem(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-danger" style={{ backgroundColor: 'var(--danger-color)', color: '#fff' }}>
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

export default Feed;
