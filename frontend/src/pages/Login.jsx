import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;
    const navigate = useNavigate();
    const { login, isLoading, error, clearError } = useAuthStore();

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
        if (error) clearError();
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData);
            navigate('/'); // Redirect to feed
        } catch (err) {
            // Error is handled in store
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
            <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <LogIn size={40} color="var(--accent-color)" />
                    <h2>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Login to enter the void</p>
                </div>

                <form onSubmit={onSubmit}>
                    {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="email"
                            placeholder="Email address"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
