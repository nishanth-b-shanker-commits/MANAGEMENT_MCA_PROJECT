import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Eye, EyeOff, ShieldCheck, User, Lock, ChevronRight, Loader2, Check, AlertTriangle } from 'lucide-react';

const ROLES = [
    { label: 'Ship Agent', value: 'Ship Agent Account', className: 'span-2' },
    { label: 'Port Authority', value: 'Port Authority Node', className: 'span-2' },
    { label: 'Customs', value: 'Customs Department', className: 'span-2' },
    { label: 'Health', value: 'Health Department', className: 'span-3' },
    { label: 'Admin', value: 'System Administrator', className: 'span-3' }
];

export default function Login() {
    const { login, lang, toggleLang, t } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Ship Agent Account');
    const [step, setStep] = useState(1); // 1: Login, 2: 2FA, 3: Register, 4: QR Code
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [userId, setUserId] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [fontSize, setFontSize] = useState(() => localStorage.getItem('appFontSize') || 'normal');
    const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        const html = document.documentElement;
        if (fontSize === 'large') {
            html.style.fontSize = '18px';
        } else if (fontSize === 'small') {
            html.style.fontSize = '14px';
        } else {
            html.style.fontSize = '16px';
        }
        localStorage.setItem('appFontSize', fontSize);
    }, [fontSize]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('appTheme', theme);
    }, [theme]);

    // Smart Captcha State
    const [captchaStatus, setCaptchaStatus] = useState('idle'); // 'idle' | 'verifying' | 'verified'
    const handleCaptchaClick = () => {
        setCaptchaStatus('verifying');
        setTimeout(() => {
            setCaptchaStatus('verified');
        }, 1200);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate Captcha
        if (captchaStatus !== 'verified') {
            setError('Please verify that you are not a robot.');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/auth/login', { username, password, role });
            if (res.data.requires2FA) {
                setUserId(res.data.userId);
                setStep(2);
            } else {
                login(res.data.user, res.data.token);
            }
        } catch (err) {
            setCaptchaStatus('idle'); // Reset Captcha on failure
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
        <div className="login-landing-container">
            {/* Top Accessibility / Utility Bar */}
            <div className="gov-top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 1.5rem', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#FF9933' }}></span>
                    <span>भारत सरकार | GOVERNMENT OF INDIA</span>
                    <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
                    <span style={{ color: 'var(--gov-text)' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय | MINISTRY OF PORTS, SHIPPING AND WATERWAYS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span className="gov-badge">{t('officialPortal') || 'Official Portal'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gov-text)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {t('accessibility') || 'Accessibility'}: 
                        <button type="button" onClick={() => setFontSize('large')} style={{ border: 'none', background: fontSize === 'large' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A+</button>
                        <button type="button" onClick={() => setFontSize('normal')} style={{ border: 'none', background: fontSize === 'normal' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A</button>
                        <button type="button" onClick={() => setFontSize('small')} style={{ border: 'none', background: fontSize === 'small' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A-</button>
                    </span>
                    <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
                    <span 
                        onClick={toggleLang} 
                        style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--primary)', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                        title="Switch Language / भाषा बदलें"
                    >
                        🌐 {lang === 'hi' ? 'English' : 'हिन्दी'}
                    </span>
                    <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
                    <span 
                        onClick={toggleTheme} 
                        style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--primary)', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
                        title="Toggle Light/Dark Theme / लाइट/डार्क थीम बदलें"
                    >
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </span>
                </div>
            </div>
            <div className="gov-tricolor-stripe"></div>

            {/* Ministry & Port Header Row */}
            <div style={{ background: 'white', padding: '10px 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={`${import.meta.env.BASE_URL}indian-emblem.png`} alt="Emblem of India" style={{ height: '60px', objectFit: 'contain' }} />
                    <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '1rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b' }}>MINISTRY OF PORTS, SHIPPING AND WATERWAYS</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>भारत सरकार / GOVERNMENT OF INDIA</div>
                    </div>
                </div>

                {/* Logo & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ height: '55px', width: '55px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#164675', letterSpacing: '-0.5px', margin: 0 }}>NMPA PORT - MANGALORE</h1>
                        <span className="gov-badge" style={{ fontSize: '0.6rem', fontWeight: 800, display: 'inline-block' }}>PORT WINDOW PORTAL</span>
                    </div>
                </div>
            </div>

            {/* Marquee Ticker */}
            <div className="marquee-ticker-container">
                <div className="marquee-ticker-text">
                    Support Kindly Raise Your Queries & Request on the Mail ID : <span style={{ color: '#2563eb' }}>support-nmpa@gov.in</span> New Toll-Free Number! Update our new Toll-Free Number for seamless assistance. We're here for you with the same great service: <strong style={{ color: '#1e293b' }}>1800-11-2026</strong>. Click on the link to pay your light dues.
                </div>
            </div>

            {/* Main Landing Body with Full Background Image */}
            <div className="login-full-body" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}bg.png)` }}>
                <div className="login-body-overlay"></div>

                <div className="login-right-card">
                    {/* Tricolor stripe on top of the card */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #FF9933 33.3%, #ffffff 33.3%, #ffffff 66.6%, #138808 66.6%)' }}></div>

                    {error && (
                        <div style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            color: 'var(--danger)', 
                            padding: '0.75rem 1rem', 
                            borderRadius: '4px', 
                            marginBottom: '1.5rem', 
                            fontSize: '0.85rem', 
                            textAlign: 'left',
                            fontWeight: 700,
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            animation: 'shake 0.4s ease'
                        }}>
                            <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#164675', margin: 0 }}>Login</h2>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>
                                    Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setStep(3); }} style={{ color: '#00add7', textDecoration: 'none', fontWeight: 800 }}>Register</a>
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '-0.75rem', marginBottom: '1.25rem', fontWeight: 600 }}>Login as</p>

                            {/* Grid tabs role selector */}
                            <div className="role-tabs-grid">
                                {ROLES.map((r) => (
                                    <button
                                        type="button"
                                        key={r.value}
                                        className={`role-tab-btn ${r.className} ${role === r.value ? 'active' : ''}`}
                                        onClick={() => setRole(r.value)}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>

                            {/* Username input */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', display: 'block' }}>
                                    User Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input 
                                        className="input-modern" 
                                        style={{ paddingLeft: '2.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)} 
                                        required 
                                        placeholder="Enter username" 
                                    />
                                </div>
                            </div>

                            {/* Password input */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', display: 'block' }}>
                                    Password <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        className="input-modern" 
                                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required 
                                        placeholder="••••••••" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Smart Captcha Verification */}
                            <div 
                                className="captcha-container-box"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    background: '#f9f9f9',
                                    border: '1px solid #d3d3d3',
                                    borderRadius: '4px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    marginBottom: '1.5rem',
                                    width: '100%',
                                    height: '74px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div 
                                        onClick={captchaStatus === 'idle' ? handleCaptchaClick : undefined}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            border: captchaStatus === 'verified' ? 'none' : '2px solid #c1c1c1',
                                            borderRadius: '2px',
                                            background: 'white',
                                            cursor: captchaStatus === 'idle' ? 'pointer' : 'default',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            position: 'relative',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {captchaStatus === 'verifying' && (
                                            <Loader2 className="lucide-spin" size={20} style={{ color: '#00add7' }} />
                                        )}
                                        {captchaStatus === 'verified' && (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                background: '#10b981',
                                                borderRadius: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Check size={18} color="white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2b2b2b', userSelect: 'none' }}>
                                        I'm not a robot
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                    <ShieldCheck size={26} style={{ color: '#164675' }} />
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>reCAPTCHA</span>
                                    <span style={{ fontSize: '0.45rem', color: '#64748b' }}>Privacy - Terms</span>
                                </div>
                            </div>

                            {/* Cyan Button aligned to the right */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button 
                                    type="submit" 
                                    className="cyan-login-btn" 
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="lucide-spin" size={16} /> : 'Login'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <ShieldCheck size={48} color="#164675" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Security Verification</h4>
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>Enter the 6-digit code from your app.</p>
                            </div>
                            <input className="input-modern" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 800 }} value={twoFactorToken} onChange={e => setTwoFactorToken(e.target.value)} required maxLength="6" placeholder="000000" />
                            <button type="submit" className="cyan-login-btn" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Verifying...' : 'Validate & Continue'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 700, padding: '0.5rem 0' }}>Back to Login</button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>Access Request</h4>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Authority Role</label>
                                <select className="input-modern" value={role} onChange={e => setRole(e.target.value)} required style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.75rem' }}>
                                    <option value="" disabled>Select Role</option>
                                    <option value="Ship Agent Account">Ship Agent</option>
                                    <option value="Port Authority Node">Port Authority</option>
                                    <option value="Customs Department">Customs</option>
                                    <option value="Health Department">Health</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Email Address</label>
                                <input type="email" className="input-modern" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@port.gov" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Username</label>
                                <input className="input-modern" value={username} onChange={e => setUsername(e.target.value)} required placeholder="preferred_uid" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Password</label>
                                <input type="password" className="input-modern" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <button type="submit" className="cyan-login-btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 700, padding: '0.5rem 0' }}>Cancel</button>
                        </form>
                    )}

                    {step === 4 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: '#164675', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <ShieldCheck size={32} style={{ margin: '0 auto' }} />
                                <h4 style={{ marginTop: '0.5rem', fontWeight: 800 }}>Activate Security</h4>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Scan this code with Google Authenticator now. This is required for login.</p>
                            <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                                <img src={qrCode} alt="2FA QR" style={{ display: 'block', width: '180px' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #164675' }}>
                                <p style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>Manual Setup Key</p>
                                <code style={{ fontSize: '1.1rem', fontWeight: 800, color: '#164675', letterSpacing: '1px' }}>{secret}</code>
                            </div>
                            <button className="cyan-login-btn" style={{ width: '100%' }} onClick={() => setStep(1)}>
                                Complete Registration
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div style={{ background: 'white', borderTop: '1px solid #cbd5e1', padding: '1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', fontWeight: 700 }}>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: '#475569', textDecoration: 'none' }}>Website Policies</a>
                    <span>|</span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: '#475569', textDecoration: 'none' }}>Help</a>
                    <span>|</span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: '#475569', textDecoration: 'none' }}>Contact Us</a>
                    <span>|</span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ color: '#475569', textDecoration: 'none' }}>Feedback</a>
                </div>
                <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
                    <p style={{ fontWeight: 'bold', color: '#1e293b' }}>National Maritime Single Window Portal (NMSWP)</p>
                    <p style={{ opacity: 0.8 }}>New Mangalore Port Authority — Ministry of Ports, Shipping and Waterways</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <span className="satyamev-jayate" style={{ color: '#b45309', fontSize: '0.8rem' }}>सत्यमेव जयते</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#00add7', textDecoration: 'none', fontWeight: 'bold' }}>india.gov.in</a>
                    </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'center' }}>
                    © 2026 New Mangalore Port Authority. All Rights Reserved.
                </div>
            </div>
        </div>
    );
}
