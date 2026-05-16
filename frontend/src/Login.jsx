import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Anchor, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [step, setStep] = useState(1); 
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password, role });
            login(res.data.user, res.data.token);
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Backend server is waking up... Please wait 30-60 seconds and try again.');
            } else {
                setError(err.response?.data?.error || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { username, password, email, role });
            alert('Registration successful! You can now log in.');
            setStep(1);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div className="panel" style={{ width: '400px', maxWidth: '90%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Anchor size={48} color="var(--primary)" />
                    <h2 style={{ marginTop: '1rem' }}>NMPA Port System</h2>
                </div>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                {step === 1 && (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Role</label>
                            <select className="input-modern" value={role} onChange={e => setRole(e.target.value)} required>
                                <option value="" disabled>Select Role</option>
                                <option value="System Administrator">System Administrator</option>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Username</label>
                            <input className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} className="input-modern" style={{ paddingRight: '2.5rem' }} value={password} onChange={e => setPassword(e.target.value)} required />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Please wait...' : 'Login'}
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(3)} style={{ color: 'var(--primary)' }}>Register New Account</a>
                        </p>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleRegister}>
                        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Register Account</h4>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Role</label>
                            <select className="input-modern" value={role} onChange={e => setRole(e.target.value)} required>
                                <option value="" disabled>Select Role</option>
                                <option value="System Administrator">System Administrator</option>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Email Address</label>
                            <input type="email" className="input-modern" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Username</label>
                            <input className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} className="input-modern" style={{ paddingRight: '2.5rem' }} value={password} onChange={e => setPassword(e.target.value)} required />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(1)} style={{ color: 'var(--primary)' }}>Back to Login</a>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
