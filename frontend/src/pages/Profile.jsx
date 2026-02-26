import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { ArrowLeft, UserPlus, UserMinus, ShieldAlert, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            alert('Failed to follow/unfollow');
        }
    };

    if (loading) return <div className="container" style={{ marginTop: '40px', textAlign: 'center' }}>Loading profile...</div>;
    if (error || !profile) return <div className="container" style={{ marginTop: '40px', color: 'var(--danger-color)' }}>{error}</div>;

    const isOwnProfile = currentUser._id === profile._id;
    const isFollowing = profile.followers.some(f => f._id === currentUser._id);

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ArrowLeft size={16} /> Back
            </button>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
                <img src={profile.avatarUrl} alt="avatar" style={{ width: '120px', borderRadius: '50%', backgroundColor: '#21262d', marginBottom: '20px' }} />

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
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </div>
                            <p style={{ fontSize: '1.05rem', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{post.content}</p>

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
