import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Eye, EyeOff, ShieldCheck, User, Lock, Mail, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const ROLES = [
    { label: 'Ship Agent', value: 'Ship Agent Account' },
    { label: 'Port Authority', value: 'Port Authority Node' },
    { label: 'Customs', value: 'Customs Department' },
    { label: 'Health', value: 'Health Department' },
    { label: 'Admin', value: 'System Administrator' }
];

export default function Login() {
    const { login } = useContext(AuthContext);
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

    // Captcha State
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState(0);
    const [captchaInput, setCaptchaInput] = useState('');

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptchaQuestion(`${num1} + ${num2}`);
        setCaptchaAnswer(num1 + num2);
        setCaptchaInput('');
    };

    useEffect(() => {
        generateCaptcha();
    }, []);


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate Captcha
        if (parseInt(captchaInput, 10) !== captchaAnswer) {
            setError('Invalid Captcha. Please solve the math captcha correctly.');
            generateCaptcha();
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
            <div className="gov-top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 1.5rem', background: '#f8fafc', fontSize: '0.7rem' }}>
                <div>
                    <span>Last Updated: 11/06/2026</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>Accessibility: 
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: '0 4px', color: 'var(--text-main)' }}>A-</button>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: '0 4px', color: 'var(--text-main)' }}>A</button>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: '0 4px', color: 'var(--text-main)' }}>A+</button>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'var(--text-main)' }}>High Contrast</button>
                </div>
            </div>

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
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#164675', letterSpacing: '-0.5px', margin: 0 }}>NMPA SETU</h1>
                        <span className="gov-badge" style={{ fontSize: '0.6rem', fontWeight: 800, display: 'inline-block' }}>PORT WINDOW PORTAL</span>
                    </div>
                </div>

                {/* Contacts & Language */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>📞 Call Us: 1800-11-2026</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span style={{ color: '#164675', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>🌐 English</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span className="satyamev-jayate" style={{ fontSize: '0.85rem', color: '#c2410c' }}>सत्यमेव जयते</span>
                </div>
            </div>

            {/* Marquee Ticker */}
            <div className="marquee-ticker-container">
                <div className="marquee-ticker-text">
                    Support Kindly Raise Your Queries & Request on the Mail ID : <span style={{ color: '#2563eb' }}>support-nmpa@gov.in</span> New Toll-Free Number! Update our new Toll-Free Number for seamless assistance. We're here for you with the same great service: <strong style={{ color: '#1e293b' }}>1800-11-2026</strong>. Click on the link to pay your light dues.
                </div>
            </div>

            {/* Navigation Bar */}
            <div style={{ background: '#164675', padding: '0 1.5rem', height: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'center' }}>
                    {["Home", "About", "Services", "Procedures", "Trading Partners", "National Producer", "News and Updates", "UMIS Dashboard"].map((item, idx) => (
                        <a 
                            key={idx} 
                            href="#" 
                            onClick={e => e.preventDefault()}
                            style={{ 
                                color: 'white', 
                                textDecoration: 'none', 
                                fontSize: '0.8rem', 
                                fontWeight: 700, 
                                opacity: 0.9, 
                                transition: 'opacity 0.2s', 
                                borderBottom: item === 'Home' ? '3px solid #00add7' : 'none',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 4px'
                            }}
                        >
                            {item}
                        </a>
                    ))}
                </div>
                <div>
                    <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        style={{ 
                            background: '#00add7', 
                            color: 'white', 
                            border: 'none', 
                            padding: '6px 16px', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem', 
                            fontWeight: 700, 
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(0, 173, 215, 0.3)'
                        }}
                    >
                        Sign In / Sign Up
                    </button>
                </div>
            </div>

            {/* Main Split Landing Page Content */}
            <div className="login-split-body">
                {/* Left Side: Port Background Image & Overlay */}
                <div className="login-left-panel">
                    <div className="login-left-content">
                        <h2>Make Your Shipments Hassle-Free</h2>
                        <h3>Login as an Authority / Agent</h3>
                        <p>Ship Agent, Customs, Health, Port Authority, Admin</p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="login-right-panel">
                    <div className="panel" style={{ 
                        width: '460px', 
                        maxWidth: '100%',
                        padding: '2.5rem',
                        position: 'relative',
                        overflow: 'visible',
                        background: 'white',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                    }}>
                        {/* Tab Indicator Top Stripe */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(to right, #FF9933 33.3%, #ffffff 33.3%, #ffffff 66.6%, #138808 66.6%)' }}></div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Login</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>Login as</p>
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                <span style={{ color: '#64748b' }}>Don't have an account? </span>
                                <a href="#" onClick={(e) => { e.preventDefault(); setStep(3); }} style={{ color: '#00add7', textDecoration: 'none' }}>Register</a>
                            </div>
                        </div>

                        {step === 1 && (
                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Horizontal Role Selector Tabs */}
                                <div className="role-tabs-container">
                                    {ROLES.map((r) => (
                                        <button
                                            type="button"
                                            key={r.value}
                                            className={`role-tab-btn ${role === r.value ? 'active' : ''}`}
                                            onClick={() => setRole(r.value)}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', display: 'block' }}>
                                        User Name <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input 
                                            className="input-modern" 
                                            style={{ paddingLeft: '2.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} 
                                            value={username} 
                                            onChange={e => setUsername(e.target.value)} 
                                            required 
                                            placeholder="Enter username" 
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', display: 'block' }}>
                                        Password <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input 
                                            type={showPassword ? 'text' : 'password'} 
                                            className="input-modern" 
                                            style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} 
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
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Captcha Verification */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div className="captcha-container">
                                        <span className="captcha-question">{captchaQuestion}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>=</span>
                                        <input 
                                            type="number"
                                            className="input-modern"
                                            style={{ width: '100px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem', textAlign: 'center' }}
                                            value={captchaInput}
                                            onChange={e => setCaptchaInput(e.target.value)}
                                            required
                                            placeholder="Answer"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={generateCaptcha} 
                                            className="captcha-refresh-btn"
                                            title="Refresh Captcha"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                                    <a href="#" onClick={e => e.preventDefault()} style={{ color: '#00add7', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
                                        Forgot / Reset Password?
                                    </a>
                                    <button 
                                        type="submit" 
                                        className="btn" 
                                        style={{ 
                                            background: '#00add7', 
                                            color: 'white', 
                                            padding: '0.6rem 2rem', 
                                            borderRadius: '4px', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 700, 
                                            boxShadow: '0 4px 12px rgba(0, 173, 215, 0.25)' 
                                        }} 
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="lucide-spin" size={16} /> : 'Login'}
                                    </button>
                                </div>

                                <div style={{ textAlign: 'center', position: 'relative', margin: '1rem 0 1.5rem' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e2e8f0', zIndex: 1 }}></div>
                                    <span style={{ position: 'relative', background: 'white', padding: '0 1rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, zIndex: 2 }}>Login With</span>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button 
                                        type="button" 
                                        onClick={() => alert("Mobile Number login is currently disabled.")}
                                        style={{ 
                                            flex: 1, 
                                            background: '#e0f2fe', 
                                            color: '#0369a1', 
                                            border: 'none', 
                                            padding: '0.75rem', 
                                            borderRadius: '4px', 
                                            fontWeight: 700, 
                                            fontSize: '0.8rem', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Mobile Number
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => alert("Udyog Aadhaar login is currently disabled.")}
                                        style={{ 
                                            flex: 1, 
                                            background: '#e0f2fe', 
                                            color: '#0369a1', 
                                            border: 'none', 
                                            padding: '0.75rem', 
                                            borderRadius: '4px', 
                                            fontWeight: 700, 
                                            fontSize: '0.8rem', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Udyog Aadhaar
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
                                <button type="submit" className="btn" style={{ width: '100%', background: '#00add7', color: 'white', fontWeight: 700 }} disabled={loading}>
                                    {loading ? 'Verifying...' : 'Validate & Continue'}
                                </button>
                                <button type="button" onClick={() => setStep(1)} className="btn" style={{ width: '100%', background: 'none', color: '#64748b' }}>Back to Login</button>
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
                                <button type="submit" className="btn" style={{ width: '100%', background: '#00add7', color: 'white', fontWeight: 700, marginTop: '0.5rem' }} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                                <button type="button" onClick={() => setStep(1)} className="btn" style={{ width: '100%', background: 'none', color: '#64748b' }}>Cancel</button>
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
                                <button className="btn" style={{ width: '100%', background: '#00add7', color: 'white', fontWeight: 700 }} onClick={() => setStep(1)}>
                                    Complete Registration
                                </button>
                            </div>
                        )}
                    </div>
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
