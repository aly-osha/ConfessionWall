import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { showAlert } from '../store/dialogStore';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.addEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleBellClick = async () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            try {
                await api.put('/notifications/read');
                // Optimistically clear the dot
                setUnreadCount(0);
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error('Failed to mark notifications as read', error);
            }
        }
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
                onClick={handleBellClick}
                className="btn-secondary"
                style={{ position: 'relative', padding: '8px', border: 'none', background: 'transparent' }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--danger-color)',
                        borderRadius: '50%',
                    }} />
                )}
            </button>

            {isOpen && (
                <div className="card" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '320px',
                    padding: '0',
                    marginTop: '10px',
                    zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface-hover)' }}>
                        <h4 style={{ margin: 0 }}>Notifications</h4>
                    </div>
                    
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No notifications yet.
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification._id} style={{
                                    padding: '15px',
                                    borderBottom: '1px solid var(--border-color)',
                                    backgroundColor: notification.isRead ? 'transparent' : 'rgba(46, 160, 67, 0.05)',
                                    transition: 'background-color 0.2s'
                                }}>
                                    {notification.link ? (
                                        <Link to={notification.link} style={{ display: 'block' }} onClick={() => setIsOpen(false)}>
                                            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {notification.message}
                                            </p>
                                        </Link>
                                    ) : (
                                        <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                            {notification.message}
                                        </p>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
