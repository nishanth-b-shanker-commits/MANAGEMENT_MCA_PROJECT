import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Anchor, Eye, EyeOff, ShieldCheck, User, Lock, Mail, ChevronRight, Loader2 } from 'lucide-react';

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
                setError('Backend server is waking up... Please wait 30-60 seconds.');
            } else {
                try {
                    const health = await api.get('/health');
                    if (health.data.database !== 'connected') {
                        setError('Database connection error. Admin action required.');
                    } else {
                        setError(err.response?.data?.error || 'Access Denied: Invalid Credentials');
                    }
                } catch {
                    setError('Unable to reach server. Try again in a minute.');
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
            setError(err.response?.data?.error || 'Invalid Security Code');
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
                setStep(4);
            } else {
                alert('Registration submitted for review.');
                setStep(1);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="panel" style={{ 
                width: '460px', 
                maxWidth: '100%',
                padding: '3rem',
                animation: 'pageEnter 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        background: 'var(--primary)', 
                        borderRadius: '24px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white',
                        boxShadow: '0 12px 30px var(--primary-glow)',
                        marginBottom: '1.5rem'
                    }}>
                        <Anchor size={40} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--bg-dark)', letterSpacing: '-0.5px' }}>NMPA PORT</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>Central Management System</p>
                </div>
                
                {error && (
                    <div style={{ 
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                        color: 'var(--danger)', 
                        padding: '1rem', 
                        borderRadius: '1rem', 
                        marginBottom: '1.5rem', 
                        fontSize: '0.875rem', 
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Authority Role</label>
                            <select className="input-modern" value={role} onChange={e => setRole(e.target.value)} required style={{ appearance: 'none', cursor: 'pointer' }}>
                                <option value="" disabled>Select Department</option>
                                <option value="System Administrator">System Administrator</option>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Username</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className="input-modern" style={{ paddingLeft: '3rem' }} value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter username" />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Security Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type={showPassword ? 'text' : 'password'} className="input-modern" style={{ paddingLeft: '3rem', paddingRight: '3rem' }} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? <Loader2 className="lucide-spin" size={20} /> : <>Sign In <ChevronRight size={20} /></>}
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                            <a href="#" onClick={() => setStep(3)} style={{ color: 'var(--primary)', textDecoration: 'none' }}>Request Access Account</a>
                        </p>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Security Verification</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Enter the 6-digit code from your app.</p>
                        </div>
                        <input className="input-modern" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 800 }} value={twoFactorToken} onChange={e => setTwoFactorToken(e.target.value)} required maxLength="6" placeholder="000000" />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Verifying...' : 'Validate & Continue'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="btn" style={{ width: '100%', background: 'none', color: 'var(--text-muted)' }}>Back to Login</button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>Access Request</h4>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Authority Role</label>
                            <select className="input-modern" value={role} onChange={e => setRole(e.target.value)} required>
                                <option value="" disabled>Select Role</option>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Email Address</label>
                            <input type="email" className="input-modern" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@port.gov" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Username</label>
                            <input className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required placeholder="preferred_uid" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Password</label>
                            <input type="password" className="input-modern" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="btn" style={{ width: '100%', background: 'none', color: 'var(--text-muted)' }}>Cancel</button>
                    </form>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                            <ShieldCheck size={32} />
                            <h4 style={{ marginTop: '0.5rem', fontWeight: 800 }}>Activate Security</h4>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Scan this code with Google Authenticator now. This is required for login.</p>
                        <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                            <img src={qrCode} alt="2FA QR" style={{ display: 'block', width: '180px' }} />
                        </div>
                        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '1rem', border: '1px dashed var(--primary)' }}>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Manual Setup Key</p>
                            <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{secret}</code>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(1)}>
                            Complete Registration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
