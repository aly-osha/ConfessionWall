import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { ArrowLeft, UserPlus, UserMinus, ShieldAlert, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import LoadingScreen from '../components/LoadingScreen';
import { showAlert, showConfirm } from '../store/dialogStore';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get(`/users/${username}`);
            setProfile(data);

            // Fetch user's posts
            const postsResponse = await api.get(`/posts/user/${username}`);
            setPosts(postsResponse.data);

            setLoading(false);
        } catch (err) {
            setError('User not found');
            setLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        try {
            const isFollowing = profile.followers.some(f => f._id === currentUser._id);
            if (isFollowing) {
                await api.post(`/users/${profile._id}/unfollow`);
                // Optimistic update
                setProfile({
                    ...profile,
                    followers: profile.followers.filter(f => f._id !== currentUser._id)
                });
            } else {
                await api.post(`/users/${profile._id}/follow`);
                // Optimistic update
                setProfile({
                    ...profile,
                    followers: [...profile.followers, { _id: currentUser._id, username: currentUser.username }]
                });
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

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
            return;
        }

        try {
            const { data } = await api.put('/users/password', { currentPassword, newPassword });
            setPasswordMessage({ type: 'success', text: data.message });
            setCurrentPassword('');
            setNewPassword('');
            setTimeout(() => setShowPasswordChange(false), 2000);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
        }
    };

    if (loading) return <LoadingScreen text="Loading profile..." />;
    if (error || !profile) return <div className="container" style={{ marginTop: '40px', color: 'var(--danger-color)' }}>{error}</div>;

    const isOwnProfile = currentUser._id === profile._id;
    const isFollowing = profile.followers.some(f => f._id === currentUser._id);

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowLeft size={16} /> Back
            </button>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
                <img src={profile.avatarUrl} alt="avatar" style={{ width: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-surface-hover)', marginBottom: '20px' }} />

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

                <div style={{ display: 'flex', gap: '40px', margin: '20px 0', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.followers.length}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Followers</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.following.length}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Following</div>
                    </div>
                </div>

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
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input
                                    type="password"
                                    placeholder="New Password"
                                    className="form-control"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
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

            <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Recent Confessions</h3>

            {posts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <p>This user hasn't confessed anything publically.</p>
                </div>
            ) : (
                <div>
                    {posts.map(post => (
                        <div key={post._id} className="card" style={{ padding: '25px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    {(currentUser._id === post.author._id) && (
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
                                    {(currentUser._id === post.author._id || currentUser.role === 'admin' || currentUser.role === 'moderator') && (
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
                                <span>▲ {post.upvotes.length}</span>
                                <span>▼ {post.downvotes.length}</span>
                                <Link to={`/post/${post._id}`} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <MessageCircle size={14} /> {post.commentCount} Comments
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default Profile;
