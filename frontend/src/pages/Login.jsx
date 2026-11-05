import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Login = () => {
    const navigate = useNavigate();
    const { login, register, isLoading, error, clearError } = useAuthStore();
    const [activeTab, setActiveTab] = useState('login');
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ email: '', password: '', age: '' });

    const switchTab = (tab) => {
        setActiveTab(tab);
        clearError();
    };

    const handleLoginChange = (e) => {
        setLoginData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) clearError();
    };

    const handleRegisterChange = (e) => {
        setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) clearError();
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(loginData);
            navigate('/');
        } catch {
            // Error handled in store
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            await register({
                email: registerData.email,
                password: registerData.password,
                age: Number(registerData.age),
            });
            navigate('/');
        } catch {
            // Error handled in store
        }
    };

    return (
        <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: 'var(--bg-color)' }}>
            {/* Left Panel - Branding (5/12) */}
            <div
                className="hidden lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12"
                style={{ width: '41.67%', backgroundColor: '#2D2D2D' }}
            >
                <div style={{ textAlign: 'center', color: '#FFFFFF', maxWidth: '380px' }}>
                    {/* Logo */}
                    <div
                        className="flex items-center justify-center mb-8"
                        style={{ gap: '12px' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--accent-color)' }}>
                            forum
                        </span>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                            Confession Wall
                        </h1>
                    </div>

                    {/* Tagline */}
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '16px', lineHeight: 1.3 }}>
                        Speak freely.<br />Stay anonymous.
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#B0B0B0', lineHeight: 1.7, marginBottom: '40px' }}>
                        A safe space to share your thoughts, secrets, and stories without revealing your identity. Join our community of voices.
                    </p>

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center" style={{ gap: '10px' }}>
                        {[
                            { icon: 'visibility_off', label: 'Anonymous' },
                            { icon: 'lock', label: 'Private' },
                            { icon: 'groups', label: 'Community' },
                        ].map((f) => (
                            <span
                                key={f.label}
                                className="flex items-center"
                                style={{
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '50px',
                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#E0E0E0',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{f.icon}</span>
                                {f.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Forms (7/12) */}
            <div
                className="flex flex-col justify-center items-center p-6 sm:p-10"
                style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}
            >
                {/* Mobile logo (visible on small screens) */}
                <div className="lg:hidden flex items-center mb-8" style={{ gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--accent-color)' }}>
                        forum
                    </span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        Confession Wall
                    </h1>
                </div>

                {/* Card */}
                <div
                    style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '24px',
                        padding: '40px',
                        width: '100%',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    }}
                >
                    {/* Tab Switcher */}
                    <div
                        className="flex"
                        style={{
                            backgroundColor: '#F5F5F5',
                            borderRadius: '50px',
                            padding: '4px',
                            marginBottom: '32px',
                        }}
                    >
                        {['login', 'register'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => switchTab(tab)}
                                className="flex items-center justify-center"
                                style={{
                                    flex: 1,
                                    padding: '10px 24px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: activeTab === tab ? '#FFFFFF' : 'transparent',
                                    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>
                                    {tab === 'login' ? 'login' : 'person_add'}
                                </span>
                                {tab === 'login' ? 'Login' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* Heading */}
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        {activeTab === 'login' ? 'Welcome back' : 'Join the Wall'}
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
                        {activeTab === 'login'
                            ? 'Login to continue sharing anonymously'
                            : 'Create an anonymous identity in seconds'}
                    </p>

                    {/* Error */}
                    {error && (
                        <div
                            className="flex items-center"
                            style={{
                                gap: '8px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: 'var(--danger-color)',
                                fontSize: '0.9rem',
                                marginBottom: '20px',
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    {activeTab === 'login' && (
                        <form onSubmit={handleLoginSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    htmlFor="login-email"
                                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                                >
                                    Email address
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        mail
                                    </span>
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        name="email"
                                        value={loginData.email}
                                        onChange={handleLoginChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            borderRadius: '50px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--accent-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(246, 81, 42, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label
                                    htmlFor="login-password"
                                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        lock
                                    </span>
                                    <input
                                        id="login-password"
                                        type="password"
                                        placeholder="Enter your password"
                                        name="password"
                                        value={loginData.password}
                                        onChange={handleLoginChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            borderRadius: '50px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--accent-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(246, 81, 42, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    backgroundColor: 'var(--accent-color)',
                                    color: '#FFFFFF',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    fontFamily: 'inherit',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                    {isLoading ? 'hourglass_top' : 'arrow_forward'}
                                </span>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    )}

                    {/* Register Form */}
                    {activeTab === 'register' && (
                        <form onSubmit={handleRegisterSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    htmlFor="register-email"
                                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                                >
                                    Private Email
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        mail
                                    </span>
                                    <input
                                        id="register-email"
                                        type="email"
                                        placeholder="Never shared publicly"
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            borderRadius: '50px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--accent-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(246, 81, 42, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label
                                    htmlFor="register-password"
                                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        lock
                                    </span>
                                    <input
                                        id="register-password"
                                        type="password"
                                        placeholder="Min 6 characters"
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        required
                                        minLength="6"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            borderRadius: '50px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--accent-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(246, 81, 42, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label
                                    htmlFor="register-age"
                                    style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}
                                >
                                    Age
                                </label>
                                <div className="relative">
                                    <span
                                        className="material-symbols-outlined"
                                        style={{
                                            position: 'absolute',
                                            left: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '20px',
                                            color: 'var(--text-muted)',
                                        }}
                                    >
                                        cake
                                    </span>
                                    <input
                                        id="register-age"
                                        type="number"
                                        placeholder="Must be 13+"
                                        name="age"
                                        value={registerData.age}
                                        onChange={handleRegisterChange}
                                        required
                                        min="13"
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px 14px 48px',
                                            borderRadius: '50px',
                                            border: '1px solid var(--border-color)',
                                            fontSize: '0.95rem',
                                            fontFamily: 'inherit',
                                            backgroundColor: 'var(--bg-surface)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'var(--accent-color)';
                                            e.target.style.boxShadow = '0 0 0 3px rgba(246, 81, 42, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>
                                <small style={{ display: 'block', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Used for moderation only. Your age stays private.
                                </small>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    backgroundColor: 'var(--accent-color)',
                                    color: '#FFFFFF',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    fontFamily: 'inherit',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                                onMouseOver={(e) => {
                                    if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                    {isLoading ? 'hourglass_top' : 'person_add'}
                                </span>
                                {isLoading ? 'Creating identity...' : 'Register Anonymously'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
};

export default Login;
