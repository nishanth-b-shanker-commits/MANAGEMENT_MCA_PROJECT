import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Anchor } from 'lucide-react';

export default function Login() {
    const { login } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [step, setStep] = useState(1); // 1: Login, 2: 2FA, 3: Register
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [userId, setUserId] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password, role });
            if (res.data.requires2FA) {
                setUserId(res.data.userId);
                setStep(2);
            } else {
                login(res.data.user, res.data.token);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    const handle2FA = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/verify-2fa', { userId, token: twoFactorToken });
            login(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || '2FA Verification failed');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { username, password, role });
            if (res.data.qrCodeUrl) {
                setQrCode(res.data.qrCodeUrl);
                alert('Scan this QR code with Google Authenticator! You will be redirected to login.');
                setStep(1);
            } else {
                alert('Registered successfully!');
                setStep(1);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
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
                            <input type="password" className="input-modern" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(3)} style={{ color: 'var(--primary)' }}>Register New Account</a>
                        </p>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handle2FA}>
                        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Two-Factor Authentication</h4>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label>Enter 6-digit code</label>
                            <input className="input-modern" value={twoFactorToken} onChange={e => setTwoFactorToken(e.target.value)} required maxLength="6" />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Verify</button>
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
                            <label>Username</label>
                            <input className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label>Password</label>
                            <input type="password" className="input-modern" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                            <a href="#" onClick={() => setStep(1)} style={{ color: 'var(--primary)' }}>Back to Login</a>
                        </p>
                        {qrCode && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <p>Scan this with Google Authenticator:</p>
                                <img src={qrCode} alt="2FA QR" style={{ marginTop: '0.5rem' }} />
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
