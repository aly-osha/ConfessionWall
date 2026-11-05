import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import {
    ArrowLeft,
    UserPlus,
    UserMinus,
    ShieldAlert,
    MessageCircle,
    Settings,
    Shield,
    Eye,
    Edit,
    Trash2,
    Users,
    UserCheck,
    Lock,
    Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LoadingScreen from '../components/LoadingScreen';
import { showAlert, showConfirm } from '../store/dialogStore';
import NotificationBell from '../components/NotificationBell';

const PASTEL_COLORS = ['#E8D0F9', '#C9F4E6', '#FBEB9F', '#FAD9D5', '#D4F1F4'];

const TABS = [
    { id: 'confessions', label: 'My Confessions', icon: MessageCircle },
    { id: 'upvoted', label: 'Upvoted', icon: UserCheck },
    { id: 'followers', label: 'Followers', icon: Users },
    { id: 'following', label: 'Following', icon: UserPlus },
];

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [upvotedPosts, setUpvotedPosts] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('confessions');
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get(`/users/${username}`);
            setProfile(data);
            setFollowers(data.followers || []);
            setFollowing(data.following || []);

            // Fetch user's posts
            const postsResponse = await api.get(`/posts/user/${username}`);
            setPosts(postsResponse.data);

            // Fetch upvoted posts if it's own profile
            if (currentUser && data._id === currentUser._id) {
                try {
                    const upvotedResponse = await api.get(`/posts/upvoted/${data._id}`);
                    setUpvotedPosts(upvotedResponse.data);
                } catch (err) {
                    setUpvotedPosts([]);
                }
            }

            setLoading(false);
        } catch (err) {
            setError('User not found');
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        try {
            const isFollowing = followers.some(f => f._id === currentUser._id);
            if (isFollowing) {
                await api.post(`/users/${profile._id}/unfollow`);
                setFollowers(followers.filter(f => f._id !== currentUser._id));
            } else {
                await api.post(`/users/${profile._id}/follow`);
                setFollowers([...followers, { _id: currentUser._id, username: currentUser.username }]);
            }
        } catch (err) {
            showAlert('Failed to follow/unfollow');
        }
    };

    const handleDeletePost = async (id) => {
        if (!(await showConfirm('Are you sure you want to delete this confession?'))) return;
        try {
            await api.delete(`/posts/${id}`);
            setPosts(posts.filter(p => p._id !== id));
            setUpvotedPosts(upvotedPosts.filter(p => p._id !== id));
        } catch (err) {
            showAlert('Failed to delete post');
        }
    };

    const handleEditPostSubmit = async (id) => {
        if (!editContent.trim()) return;
        try {
            const { data } = await api.put(`/posts/${id}`, { content: editContent });
            setPosts(posts.map(p => p._id === id ? { ...p, content: data.content } : p));
            setUpvotedPosts(upvotedPosts.map(p => p._id === id ? { ...p, content: data.content } : p));
            setEditingPostId(null);
            setEditContent('');
        } catch (err) {
            showAlert(err.response?.data?.message || 'Failed to edit post');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            const { data } = await api.put('/users/password', { currentPassword, newPassword });
            setPasswordMessage({ type: 'success', text: data.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setShowPasswordChange(false), 2000);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
        }
    };

    if (loading) return <LoadingScreen text="Loading profile..." />;
    if (error || !profile) return <div className="container" style={{ marginTop: '40px', color: 'var(--danger-color)' }}>{error}</div>;

    const isOwnProfile = currentUser._id === profile._id;
    const isFollowing = followers.some(f => f._id === currentUser._id);

    const renderPost = (post, index) => (
        <div key={post._id} className="card" style={{ padding: '25px', marginBottom: '15px', backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {currentUser._id === post.author._id && (
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
                            style={{ padding: '2px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Edit size={12} /> {editingPostId === post._id ? 'Cancel' : 'Edit'}
                        </button>
                    )}
                    {(currentUser._id === post.author._id || currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                        <button
                            onClick={() => handleDeletePost(post._id)}
                            className="btn-danger"
                            style={{ padding: '2px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {editingPostId === post._id ? (
                <div style={{ marginBottom: '15px' }}>
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
                <p style={{ fontSize: '1.05rem', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{post.content}</p>
            )}

            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>👍{post.upvotes.length}</span>
                <span>👎{post.downvotes.length}</span>
                <Link to={`/post/${post._id}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MessageCircle size={14} /> {post.commentCount} Comments
                </Link>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'confessions':
                return posts.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p>No confessions yet.</p>
                    </div>
                ) : (
                    <div>{posts.map(renderPost)}</div>
                );
            case 'upvoted':
                if (!isOwnProfile) {
                    return (
                        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <Lock size={32} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
                            <p>Upvoted confessions are private.</p>
                        </div>
                    );
                }
                return upvotedPosts.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p>No upvoted confessions yet.</p>
                    </div>
                ) : (
                    <div>{upvotedPosts.map(renderPost)}</div>
                );
            case 'followers':
                return followers.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p>No followers yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {followers.map((follower) => (
                            <div key={follower._id} className="card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={follower.avatarUrl || ''}
                                    alt={follower.username}
                                    style={{ width: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)' }}
                                />
                                <Link to={`/profile/${follower.username}`} style={{ fontWeight: 'bold' }}>
                                    {follower.username}
                                </Link>
                            </div>
                        ))}
                    </div>
                );
            case 'following':
                return following.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <p>Not following anyone yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {following.map((user) => (
                            <div key={user._id} className="card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={user.avatarUrl || ''}
                                    alt={user.username}
                                    style={{ width: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)' }}
                                />
                                <Link to={`/profile/${user.username}`} style={{ fontWeight: 'bold' }}>
                                    {user.username}
                                </Link>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container" style={{ marginTop: '40px', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <NotificationBell />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px', alignItems: 'start' }}>
                {/* Main Content Column */}
                <div>
                    {/* Hero Profile Card */}
                    <div className="card" style={{ padding: '40px 20px', marginBottom: '30px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img
                                src={profile.avatarUrl}
                                alt="avatar"
                                style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)', marginBottom: '20px', objectFit: 'cover' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                <h2 style={{ margin: 0 }}>{profile.username}</h2>
                                {profile.role !== 'user' && (
                                    <span style={{ backgroundColor: 'var(--danger-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <ShieldAlert size={12} /> {profile.role}
                                    </span>
                                )}
                            </div>

                            {profile.status !== 'active' && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', marginBottom: '15px' }}>
                                    Status: {profile.status.replace('_', ' ').toUpperCase()}
                                </p>
                            )}

                            {/* Stats Strip */}
                            <div style={{ display: 'flex', gap: '40px', margin: '20px 0', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{posts.length}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Confessions</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{followers.length}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Followers</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{following.length}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Following</div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isOwnProfile && (
                                <div style={{ marginTop: '20px', width: '100%', maxWidth: '300px' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', marginBottom: '10px' }}
                                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    >
                                        {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
                                    </button>

                                    {showPasswordChange && (
                                        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <input
                                                type="password"
                                                placeholder="Current Password"
                                                className="form-control"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                required
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                                            />
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                className="form-control"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm New Password"
                                                className="form-control"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}
                                            />
                                            <button type="submit" className="btn-primary" style={{ padding: '8px' }}>
                                                Update Password
                                            </button>
                                            {passwordMessage.text && (
                                                <div style={{ color: passwordMessage.type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)', fontSize: '0.9rem', textAlign: 'center' }}>
                                                    {passwordMessage.text}
                                                </div>
                                            )}
                                        </form>
                                    )}
                                </div>
                            )}

                            {!isOwnProfile && (
                                <button
                                    onClick={handleFollowToggle}
                                    className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 20px' }}
                                >
                                    {isFollowing ? <><UserMinus size={18} /> Unfollow</> : <><UserPlus size={18} /> Follow</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="card" style={{ padding: '0', marginBottom: '20px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
                                            border: 'none',
                                            borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                                            color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)',
                                            fontWeight: activeTab === tab.id ? '600' : '400',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Icon size={16} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div>{renderTabContent()}</div>
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Account Safety Card */}
                    <div className="card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <Shield size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Account Safety</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: profile.status === 'active' ? '#22c55e' : '#ef4444' }} />
                                <span>Account Status: <strong>{profile.status === 'active' ? 'Active' : profile.status.replace('_', ' ')}</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                                <span>Two-Factor Auth: <strong>Enabled</strong></span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bell size={14} style={{ color: 'var(--text-muted)' }} />
                                <span>Login Alerts: <strong>On</strong></span>
                            </div>
                        </div>
                        {isOwnProfile && (
                            <button className="btn-secondary" style={{ width: '100%', marginTop: '15px', padding: '8px', fontSize: '0.85rem' }}>
                                <Settings size={14} style={{ marginRight: '5px' }} />
                                Security Settings
                            </button>
                        )}
                    </div>

                    {/* Anonymity Notice */}
                    <div className="card" style={{ padding: '20px', backgroundColor: 'var(--bg-surface-hover)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <Eye size={20} style={{ color: 'var(--text-muted)' }} />
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Anonymity Notice</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            All confessions posted on this platform are completely anonymous.
                            Your identity is never revealed to other users. However, administrators
                            may access account information for moderation purposes.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    {isOwnProfile && (
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>Quick Actions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Link to="/" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '10px' }}>
                                    <MessageCircle size={16} /> Write a Confession
                                </Link>
                                <button
                                    onClick={() => navigate('/')}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', width: '100%' }}
                                >
                                    <Users size={16} /> View Feed
                                </button>
                                <button
                                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', width: '100%' }}
                                >
                                    <Lock size={16} /> Change Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
