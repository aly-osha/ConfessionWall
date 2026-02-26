import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import { ShieldAlert, Trash2, ArrowLeft, RefreshCw, EyeOff, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
            navigate('/');
            return;
        }
        fetchData();
    }, [user, navigate, activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'reports') {
                const { data } = await api.get('/reports');
                setReports(data);
            } else {
                const { data } = await api.get('/admin/users');
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewReport = async (reportId, action) => {
        try {
            await api.put(`/reports/${reportId}/review`, { action });
            // Remove the reviewed report from the pending list
            setReports(reports.filter(r => r._id !== reportId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to act on report');
        }
    };

    const handleUserStatusChange = async (userId, newStatus) => {
        try {
            await api.put(`/admin/users/${userId}/status`, { status: newStatus });
            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user status');
        }
    };

    return (
        <div className="container" style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ArrowLeft size={16} /> Exit
                    </button>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-color)' }}>
                        <ShieldAlert size={24} /> Security Dashboard
                    </h2>
                </div>
                <button onClick={fetchData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button
                    className={activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('reports')}
                >
                    Pending Reports ({activeTab === 'reports' && !loading ? reports.length : '...'})
                </button>
                <button
                    className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)' }}>Loading records...</div>
            ) : activeTab === 'reports' ? (
                <div>
                    {reports.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--success-color)' }}>No pending reports. The wall is peaceful.</p>
                    ) : (
                        reports.map(report => (
                            <div key={report._id} className="card" style={{ borderLeft: '4px solid var(--danger-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <span style={{ backgroundColor: '#21262d', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '10px' }}>
                                            {report.type.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            Reported by: <Link to={`/profile/${report.reporter.username}`}>{report.reporter.username}</Link>
                                        </span>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#0d1117', padding: '15px', borderRadius: '6px', marginBottom: '15px' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '5px', color: 'var(--danger-color)' }}>Reason: {report.reason}</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Target Content:</p>
                                    <p style={{ fontStyle: 'italic', borderLeft: '2px solid var(--border-color)', paddingLeft: '10px' }}>
                                        "{report.targetId?.content || '[Content Deleted]'}"
                                    </p>
                                    {report.targetId && (
                                        <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                                            <span style={{ marginRight: '15px' }}>Author: {report.targetId.author?.username}</span>
                                            <span style={{ marginRight: '15px' }}>Warnings: <span style={{ color: 'var(--danger-color)' }}>{report.targetId.author?.warningCount}</span></span>
                                            <span>Hidden Status: {report.targetId.isHidden ? <EyeOff size={14} style={{ verticalAlign: 'middle' }} /> : <Eye size={14} style={{ verticalAlign: 'middle' }} />} {report.targetId.isHidden ? 'Yes' : 'No'}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleReviewReport(report._id, 'dismiss')} className="btn-secondary">
                                        Dismiss (Ignore)
                                    </button>
                                    <button onClick={() => handleReviewReport(report._id, 'warn')} className="btn-primary" style={{ backgroundColor: '#cc6b2e' }}>
                                        Warn User & Hide Content
                                    </button>
                                    {user.role === 'admin' && (
                                        <button onClick={() => handleReviewReport(report._id, 'ban')} className="btn-danger" style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}>
                                            Ban User & Hide Content
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#21262d', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '15px' }}>Username</th>
                                <th style={{ padding: '15px' }}>Role</th>
                                <th style={{ padding: '15px' }}>Warnings</th>
                                <th style={{ padding: '15px' }}>Status</th>
                                <th style={{ padding: '15px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '15px' }}><Link to={`/profile/${u.username}`}>{u.username}</Link></td>
                                    <td style={{ padding: '15px' }}>{u.role}</td>
                                    <td style={{ padding: '15px', color: u.warningCount > 0 ? 'var(--danger-color)' : 'inherit' }}>{u.warningCount}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem',
                                            backgroundColor: u.status === 'active' ? 'rgba(46, 160, 67, 0.2)' :
                                                u.status === 'warned' ? 'rgba(210, 153, 34, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                                            color: u.status === 'active' ? 'var(--success-color)' :
                                                u.status === 'warned' ? '#d29922' : 'var(--danger-color)'
                                        }}>
                                            {u.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <select
                                            value={u.status}
                                            onChange={(e) => handleUserStatusChange(u._id, e.target.value)}
                                            disabled={u._id === user._id || (user.role === 'moderator' && u.role === 'admin')}
                                            style={{
                                                backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)',
                                                border: '1px solid var(--border-color)', padding: '5px', borderRadius: '4px'
                                            }}
                                        >
                                            <option value="active">Active</option>
                                            <option value="warned">Warned</option>
                                            <option value="temp_banned">Temp Banned</option>
                                            <option value="perm_banned">Perm Banned</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
