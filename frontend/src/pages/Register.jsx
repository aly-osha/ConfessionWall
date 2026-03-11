import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        age: '',
    });

    const { email, password, age } = formData;
    const navigate = useNavigate();
    const { register, isLoading, error, clearError } = useAuthStore();

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
            await register({
                email,
                password,
                age: Number(age)
            });
            navigate('/'); // Redirect to feed
        } catch (err) {
            // Error is handled in store
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
            <div className="card">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💭</div>
                    <h2>Join the Wall</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Create an anonymous identity</p>
                </div>

                <form onSubmit={onSubmit}>
                    {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="email"
                            placeholder="Private Email (never shared)"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="password"
                            placeholder="Password (min 6 characters)"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            minLength="6"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <input
                            type="number"
                            placeholder="Age (must be 13+)"
                            name="age"
                            value={age}
                            onChange={onChange}
                            required
                            min="13"
                        />
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>
                            We need your age for moderation purposes. Your age remains private.
                        </small>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }} disabled={isLoading}>
                        {isLoading ? 'Generating Identity...' : 'Register Anonymously'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                    Already have an identity? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
