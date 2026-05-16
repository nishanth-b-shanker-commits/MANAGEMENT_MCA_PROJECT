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
    const [step, setStep] = useState(1); // 1: Login, 2: 2FA, 3: Register, 4: QR Code
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [userId, setUserId] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', { username, password, role });
            if (res.data.requires2FA) {
                setUserId(res.data.userId);
                setStep(2);
            } else {
                login(res.data.user, res.data.token);
            }
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Backend server is waking up... Please wait 30-60 seconds and try again.');
            } else {
                // Check health to see if DB is the issue
                try {
                    const health = await api.get('/health');
                    if (health.data.database !== 'connected') {
                        setError('Database connection failed. Please ensure MongoDB IP Whitelist allows access (0.0.0.0/0).');
                    } else {
                        setError(err.response?.data?.error || 'Login failed: Invalid credentials');
                    }
                } catch {
                    setError(err.response?.data?.error || 'Login failed');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/verify-2fa', { userId, token: twoFactorToken });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || '2FA Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', { username, password, email, role });
            if (res.data.qrCodeUrl) {
                setQrCode(res.data.qrCodeUrl);
                setSecret(res.data.secret);
                setStep(4); // Show QR Code Step
            } else {
                alert('Registration submitted! Your account is pending approval by the System Administrator.');
                setStep(1);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
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

                {step === 2 && (
                    <form onSubmit={handle2FA}>
                        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Two-Factor Authentication</h4>
                        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Enter the 6-digit code from your Authenticator app.</p>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label>Verification Code</label>
                            <input className="input-modern" value={twoFactorToken} onChange={e => setTwoFactorToken(e.target.value)} required maxLength="6" placeholder="000000" />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(1)} style={{ color: 'var(--primary)' }}>Back to Login</a>
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
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(1)} style={{ color: 'var(--primary)' }}>Back to Login</a>
                        </p>
                    </form>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Setup 2FA Security</h4>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Scan this QR code with Google Authenticator. You will need it to log in once your account is approved.</p>
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px', marginBottom: '1rem' }}>
                            <img src={qrCode} alt="2FA QR" style={{ display: 'block' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Manual Key:</p>
                            <code style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '1px' }}>{secret}</code>
                        </div>
                        <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--warning)' }}>Account status: <strong>PENDING APPROVAL</strong>. Please scan now and then click below.</p>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(1)}>
                            Done, Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
