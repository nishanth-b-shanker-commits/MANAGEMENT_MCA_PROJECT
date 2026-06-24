import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import { Eye, EyeOff, ShieldCheck, User, Lock, ChevronRight, Loader2, Check, AlertTriangle, Ship, Activity, FileCheck, Globe } from 'lucide-react';

const ROLES = [
    { label: 'Ship Agent', value: 'Ship Agent Account', className: 'span-2' },
    { label: 'Port Authority', value: 'Port Authority Node', className: 'span-2' },
    { label: 'Customs', value: 'Customs Department', className: 'span-2' },
    { label: 'Health', value: 'Health Department', className: 'span-3' },
    { label: 'Admin', value: 'System Administrator', className: 'span-3' }
];

export default function Login() {
    const { 
        login, 
        lang, 
        toggleLang, 
        t, 
        theme, 
        toggleTheme, 
        fontSize, 
        setFontSize 
    } = useContext(AuthContext);

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

    // Smart Captcha State
    const [captchaStatus, setCaptchaStatus] = useState('idle'); // 'idle' | 'verifying' | 'verified'
    const handleCaptchaClick = () => {
        setCaptchaStatus('verifying');
        setTimeout(() => {
            setCaptchaStatus('verified');
        }, 1200);
    };

    // Modal States
    const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    // Feedback Form States
    const [feedbackName, setFeedbackName] = useState('');
    const [feedbackEmail, setFeedbackEmail] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const getRoleTranslation = (val) => {
        if (val === 'Ship Agent Account') return t('shipAgent');
        if (val === 'Port Authority Node') return t('portAuthority');
        if (val === 'Customs Department') return t('customs');
        if (val === 'Health Department') return t('health');
        if (val === 'System Administrator') return t('adminRole');
        return val;
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
            // If the server/mock returned a proper error response, show it directly
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CANCELED') {
                setError('Unable to connect to server. Please check your connection.');
            } else {
                setError('Login failed. Please check your credentials and try again.');
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

    const handleFeedbackSubmit = (e) => {
        e.preventDefault();
        setFeedbackSubmitted(true);
        // Reset feedback form fields after mock delay
        setTimeout(() => {
            setFeedbackName('');
            setFeedbackEmail('');
            setFeedbackMessage('');
            setFeedbackRating(5);
        }, 100);
    };

    return (
        <div className="login-landing-container" style={{ position: 'relative' }}>
            <div 
                className="layout-background" 
                style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: -1, 
                    backgroundImage: `url(${import.meta.env.BASE_URL}bg.png)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    pointerEvents: 'none'
                }}
            />
            {/* Top Accessibility / Utility Bar */}
            <div className="gov-top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 1.5rem', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#FF9933' }}></span>
                    <span>भारत सरकार | {t('govIndia')}</span>
                    <span className="gov-separator">|</span>
                    <span style={{ color: 'var(--gov-text)' }}>{t('ministryBranding')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span className="gov-badge">{t('officialPortal')}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--gov-text)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {t('accessibility')}: 
                        <button type="button" onClick={() => setFontSize('large')} className={fontSize === 'large' ? 'active' : ''}>A+</button>
                        <button type="button" onClick={() => setFontSize('normal')} className={fontSize === 'normal' ? 'active' : ''}>A</button>
                        <button type="button" onClick={() => setFontSize('small')} className={fontSize === 'small' ? 'active' : ''}>A-</button>
                    </span>
                    <span className="gov-separator">|</span>
                    <span 
                        onClick={toggleLang} 
                        className="gov-link"
                        title="Switch Language / भाषा बदलें"
                    >
                        🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
                    </span>
                    <span className="gov-separator">|</span>
                    <span 
                        onClick={toggleTheme} 
                        className="gov-link"
                        title="Toggle Light/Dark Theme / लाइट/डार्क थीम बदलें"
                    >
                        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                    </span>
                </div>
            </div>
            <div className="gov-tricolor-stripe"></div>

            {/* Ministry & Port Header Row */}
            <div className="login-gov-header">
                <div className="login-emblem-wrapper">
                    <img src={`${import.meta.env.BASE_URL}indian-emblem.png`} alt="Emblem of India" style={{ height: '60px', objectFit: 'contain' }} />
                    <div className="login-emblem-text">
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('ministryBranding')}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)' }}>भारत सरकार / GOVERNMENT OF INDIA</div>
                    </div>
                </div>

                {/* Logo & Title */}
                <div className="login-port-title-wrapper">
                    <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ height: '55px', width: '55px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.5px', margin: 0 }}>{t('portBranding')}</h1>
                        <span className="gov-badge" style={{ fontSize: '0.6rem', fontWeight: 800, display: 'inline-block' }}>{t('portWindowPortal')}</span>
                    </div>
                </div>
            </div>

            {/* Marquee Ticker */}
            <div className="marquee-ticker-container">
                <div className="marquee-ticker-text">
                    {t('supportQueries')}: <span style={{ color: '#00add7', fontWeight: 700 }}>support-nmpa@gov.in</span> | {t('tollFreeMsg')} <strong style={{ color: 'var(--text-main)' }}>1800-11-2026</strong> | {t('payLightDues')}
                </div>
            </div>

            {/* Main Landing Body */}
            <div className="login-full-body">
                <div className="login-body-overlay"></div>

                <div className="login-left-hero">
                    <div>
                        <span className="gov-badge" style={{ background: 'rgba(255,153,51,0.15)', color: '#ff9933', border: '1px solid rgba(255,153,51,0.3)', padding: '4px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800 }}>
                            {lang === 'en' ? 'NMPA Port — New Mangalore Port Authority' : 'एनएमपीए पोर्ट — नव मंगलौर पोर्ट प्राधिकरण'}
                        </span>
                        <h2 style={{ marginTop: '0.75rem' }}>
                            {lang === 'en' ? 'NMPA Port Digital Clearance System Website' : 'एनएमपीए पोर्ट डिजिटल क्लीयरेंस सिस्टम वेबसाइट'}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.5, marginTop: '0.75rem', fontWeight: 600 }}>
                            {lang === 'en' 
                                ? "India's premier deep-draft major port at Panambur, Mangalore — enabling paperless vessel clearances, real-time berthing allocation, and end-to-end digital cargo management under the Ministry of Ports, Shipping & Waterways."
                                : 'पनाम्बुर, मंगलौर स्थित भारत का प्रमुख गहरे मसौदे का बंदरगाह — कागज़ रहित जहाज क्लीयरेंस, वास्तविक समय बर्थिंग आवंटन और पोर्ट, शिपिंग और जलमार्ग मंत्रालय के अंतर्गत डिजिटल कार्गो प्रबंधन।'}
                        </p>
                    </div>

                    <div className="login-hero-badges">
                        <div className="login-hero-badge-card">
                            <div className="login-hero-badge-icon">
                                <Ship size={20} />
                            </div>
                            <h3>{lang === 'en' ? '14 Active Berths' : '14 सक्रिय बर्थ'}</h3>
                            <p>
                                {lang === 'en' 
                                    ? 'Three dock basins — Eastern, Western & Oil — with 15.4 m deep-draft outer channel and live berth availability.'
                                    : 'तीन डॉक बेसिन — पूर्वी, पश्चिमी और तेल — 15.4 मी. गहरे मसौदे के बाहरी चैनल और लाइव बर्थ उपलब्धता के साथ।'}
                            </p>
                        </div>
                        <div className="login-hero-badge-card">
                            <div className="login-hero-badge-icon">
                                <Globe size={20} />
                            </div>
                            <h3>{lang === 'en' ? '50 MMT Record Throughput' : '50 MMT रिकॉर्ड थ्रूपुट'}</h3>
                            <p>
                                {lang === 'en' 
                                    ? 'NMPA achieved a historic 50.04 million tonnes cargo throughput in FY 2025-26, Karnataka\'s maritime gateway.'
                                    : 'एनएमपीए ने वित्त वर्ष 2025-26 में 50.04 मिलियन टन कार्गो थ्रूपुट का ऐतिहासिक रिकॉर्ड बनाया।'}
                            </p>
                        </div>
                        <div className="login-hero-badge-card">
                            <div className="login-hero-badge-icon">
                                <FileCheck size={20} />
                            </div>
                            <h3>{lang === 'en' ? 'RFID Cargo Gate System' : 'RFID कार्गो गेट सिस्टम'}</h3>
                            <p>
                                {lang === 'en' 
                                    ? 'Paperless RFID-based gate entry for cargo, sequential PHO → Customs → Port Traffic approvals.'
                                    : 'कार्गो के लिए कागज़ रहित RFID-आधारित गेट प्रवेश, PHO → सीमा शुल्क → पोर्ट ट्रैफिक अनुमोदन।'}
                            </p>
                        </div>
                        <div className="login-hero-badge-card">
                            <div className="login-hero-badge-icon">
                                <ShieldCheck size={20} />
                            </div>
                            <h3>{lang === 'en' ? 'TOTP 2FA Security' : 'TOTP 2FA सुरक्षा'}</h3>
                            <p>
                                {lang === 'en' 
                                    ? 'Government-grade two-factor authentication securing all NMPA officer and agent portals.'
                                    : 'सभी एनएमपीए अधिकारी और एजेंट पोर्टल को सुरक्षित करने वाला सरकारी-श्रेणी का दो-कारक प्रमाणीकरण।'}
                            </p>
                        </div>
                    </div>
                </div>

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
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{t('login')}</h2>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                    {t('dontHaveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); setStep(3); }} style={{ color: '#00add7', textDecoration: 'none', fontWeight: 800 }}>{t('register')}</a>
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '-0.75rem', marginBottom: '1.25rem', fontWeight: 600 }}>{t('loginAs')}</p>

                            {/* Grid tabs role selector */}
                            <div className="role-tabs-grid">
                                {ROLES.map((r) => (
                                    <button
                                        type="button"
                                        key={r.value}
                                        className={`role-tab-btn ${r.className} ${role === r.value ? 'active' : ''}`}
                                        onClick={() => setRole(r.value)}
                                    >
                                        {getRoleTranslation(r.value)}
                                    </button>
                                ))}
                            </div>

                            {/* Username input */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>
                                    {t('usernameLabel')} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        className="login-input-modern" 
                                        style={{ paddingLeft: '2.75rem' }} 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value)} 
                                        required 
                                        placeholder={t('usernameLabel')} 
                                    />
                                </div>
                            </div>

                            {/* Password input */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'block' }}>
                                    {t('passwordLabel')} <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        className="login-input-modern" 
                                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        required 
                                        placeholder="••••••••" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Smart Captcha Verification */}
                            <div className="captcha-container-box">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div 
                                        onClick={captchaStatus === 'idle' ? handleCaptchaClick : undefined}
                                        className={`captcha-checkbox ${captchaStatus === 'verified' ? 'verified' : ''}`}
                                    >
                                        {captchaStatus === 'verifying' && (
                                            <Loader2 className="lucide-spin" size={20} style={{ color: '#00add7' }} />
                                        )}
                                        {captchaStatus === 'verified' && (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                background: 'var(--success)',
                                                borderRadius: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Check size={18} color="white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', userSelect: 'none' }}>
                                        {t('notRobot')}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                    <ShieldCheck size={26} style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>reCAPTCHA</span>
                                    <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)' }}>Privacy - Terms</span>
                                </div>
                            </div>

                            {/* Cyan Button aligned to the right */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button 
                                    type="submit" 
                                    className="cyan-login-btn" 
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="lucide-spin" size={16} /> : t('login')}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handle2FA} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('securityVerification')}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{t('enterCode')}</p>
                            </div>
                            <input className="login-input-modern" style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 800 }} value={twoFactorToken} onChange={e => setTwoFactorToken(e.target.value)} required maxLength="6" placeholder="000000" />
                            <button type="submit" className="cyan-login-btn" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Verifying...' : t('validateBtn')}
                            </button>
                            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, padding: '0.5rem 0' }}>{t('backToLogin')}</button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{t('accessRequest')}</h4>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('authorityRole')}</label>
                                <select className="login-input-modern" value={role} onChange={e => setRole(e.target.value)} required style={{ padding: '0.75rem' }}>
                                    <option value="" disabled>{t('selectRole')}</option>
                                    <option value="Ship Agent Account">{t('shipAgent')}</option>
                                    <option value="Port Authority Node">{t('portAuthority')}</option>
                                    <option value="Customs Department">{t('customs')}</option>
                                    <option value="Health Department">{t('health')}</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('emailAddressLabel')}</label>
                                <input type="email" className="login-input-modern" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@port.gov" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('usernameLabel')}</label>
                                <input className="login-input-modern" value={username} onChange={e => setUsername(e.target.value)} required placeholder="preferred_uid" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' }}>{t('passwordLabel')}</label>
                                <input type="password" className="login-input-modern" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                            </div>
                            <button type="submit" className="cyan-login-btn" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                                {loading ? 'Submitting...' : t('submitRequest')}
                            </button>
                            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, padding: '0.5rem 0' }}>{t('cancel')}</button>
                        </form>
                    )}

                    {step === 4 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <ShieldCheck size={32} style={{ margin: '0 auto' }} />
                                <h4 style={{ marginTop: '0.5rem', fontWeight: 800 }}>{t('activateSecurity')}</h4>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{t('scanQrCodeLogin')}</p>
                            <div style={{ background: 'white', padding: '1.5rem', display: 'inline-block', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' }}>
                                <img src={qrCode} alt="2FA QR" style={{ display: 'block', width: '180px' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--input-bg)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.25rem' }}>{t('manualSetupKey')}</p>
                                <code style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{secret}</code>
                            </div>
                            <button className="cyan-login-btn" style={{ width: '100%' }} onClick={() => setStep(1)}>
                                {t('completeRegistration')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="login-gov-footer">
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', fontWeight: 700 }}>
                    <a href="#" onClick={e => { e.preventDefault(); setIsPoliciesOpen(true); }}>{t('websitePolicies')}</a>
                    <span>|</span>
                    <a href="#" onClick={e => { e.preventDefault(); setIsHelpOpen(true); }}>{t('help')}</a>
                    <span>|</span>
                    <a href="#" onClick={e => { e.preventDefault(); setIsContactOpen(true); }}>{t('contactUs')}</a>
                    <span>|</span>
                    <a href="#" onClick={e => { e.preventDefault(); setIsFeedbackOpen(true); }}>{t('feedback')}</a>
                </div>
                <div style={{ textAlign: 'center', lineHeight: '1.6' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>National Maritime Single Window Portal (NMSWP)</p>
                    <p style={{ opacity: 0.8 }}>New Mangalore Port Authority — Ministry of Ports, Shipping and Waterways</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <span className="satyamev-jayate" style={{ fontSize: '0.8rem' }}>सत्यमेव जयते</span>
                        <span style={{ color: 'var(--glass-border)' }}>|</span>
                        <a href="https://india.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#00add7', textDecoration: 'none', fontWeight: 'bold' }}>india.gov.in</a>
                    </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                    © 2026 New Mangalore Port Authority. All Rights Reserved.
                </div>
            </div>

            {/* WEBSITE POLICIES MODAL */}
            {isPoliciesOpen && (
                <div className="login-modal-overlay" onClick={() => setIsPoliciesOpen(false)}>
                    <div className="login-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h3>{t('websitePolicies')}</h3>
                            <button className="login-modal-close" onClick={() => setIsPoliciesOpen(false)}>&times;</button>
                        </div>
                        <div className="login-modal-body">
                            <h4>Privacy Policy</h4>
                            <p>We are committed to protecting your personal data and privacy. All details entered on the portal are encrypted and handled securely under government regulations.</p>
                            <h4>Hyperlinking Policy</h4>
                            <p>Prior permission is required before hyperlinks can be directed from any website to this portal.</p>
                            <h4>Copyright Policy</h4>
                            <p>Material featured on this portal may be reproduced free of charge. However, the material must be reproduced accurately and not used in a derogatory manner or in a misleading context.</p>
                            <h4>Security Policy</h4>
                            <p>The single window portal uses standard security protocols. Users are advised not to share their passwords or 2FA keys.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* HELP MODAL */}
            {isHelpOpen && (
                <div className="login-modal-overlay" onClick={() => setIsHelpOpen(false)}>
                    <div className="login-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h3>{t('help')}</h3>
                            <button className="login-modal-close" onClick={() => setIsHelpOpen(false)}>&times;</button>
                        </div>
                        <div className="login-modal-body">
                            <h4>System Requirements</h4>
                            <p>For the best experience, use Google Chrome, Mozilla Firefox, or Microsoft Edge. Ensure JavaScript and cookies are enabled.</p>
                            <h4>User Login Guide</h4>
                            <ol style={{ paddingLeft: '1.25rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                <li>Select your port authority/user role from the grid.</li>
                                <li>Enter your authorized username and password.</li>
                                <li>Verify the "I'm not a robot" CAPTCHA.</li>
                                <li>If 2FA is active, enter the 6-digit TOTP code generated by Google Authenticator on your mobile device.</li>
                            </ol>
                            <h4>Frequently Asked Questions</h4>
                            <p><strong>Q: What if I forget my password?</strong><br/>A: Please contact your organization coordinator or submit a query to support-nmpa@gov.in.</p>
                            <p><strong>Q: Why does my Captcha keep resetting?</strong><br/>A: Captcha resets after a login attempt fails or times out. Simply recheck the box to re-verify.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTACT US MODAL */}
            {isContactOpen && (
                <div className="login-modal-overlay" onClick={() => setIsContactOpen(false)}>
                    <div className="login-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h3>{t('contactUs')}</h3>
                            <button className="login-modal-close" onClick={() => setIsContactOpen(false)}>&times;</button>
                        </div>
                        <div className="login-modal-body">
                            <h4>NMPA Mangalore Office</h4>
                            <p>New Mangalore Port Authority<br/>
                            Panambur, Mangalore,<br/>
                            Karnataka - 575010</p>
                            <h4>General & Tech Support</h4>
                            <p>📧 Support Email: <a href="mailto:support-nmpa@gov.in" style={{ color: 'var(--primary)', fontWeight: 600 }}>support-nmpa@gov.in</a></p>
                            <p>📞 Toll-Free Helpline: <strong style={{ color: 'var(--text-main)' }}>1800-11-2026</strong> (Available 24x7)</p>
                            <h4>Departmental Nodes</h4>
                            <p>Customs Department Desk: ext 201<br/>
                            Health Department Desk: ext 205<br/>
                            Traffic Control Room: ext 309</p>
                        </div>
                    </div>
                </div>
            )}

            {/* FEEDBACK MODAL */}
            {isFeedbackOpen && (
                <div className="login-modal-overlay" onClick={() => setIsFeedbackOpen(false)}>
                    <div className="login-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="login-modal-header">
                            <h3>{t('feedback')}</h3>
                            <button className="login-modal-close" onClick={() => { setIsFeedbackOpen(false); setFeedbackSubmitted(false); }}>&times;</button>
                        </div>
                        <div className="login-modal-body">
                            {feedbackSubmitted ? (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem' }}>
                                        <Check size={32} />
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Thank you for your feedback!</h4>
                                    <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Your suggestions help us improve the single window portal experience.</p>
                                    <button className="cyan-login-btn" style={{ marginTop: '1.5rem' }} onClick={() => { setIsFeedbackOpen(false); setFeedbackSubmitted(false); }}>Close</button>
                                </div>
                            ) : (
                                <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Name</label>
                                        <input className="login-input-modern" required value={feedbackName} onChange={e => setFeedbackName(e.target.value)} placeholder="Enter your name" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Email Address</label>
                                        <input type="email" className="login-input-modern" required value={feedbackEmail} onChange={e => setFeedbackEmail(e.target.value)} placeholder="name@domain.com" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Rating</label>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    type="button"
                                                    key={star}
                                                    onClick={() => setFeedbackRating(star)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: star <= feedbackRating ? '#f59e0b' : 'var(--border)', padding: 0 }}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Suggestions / Remarks</label>
                                        <textarea className="login-input-modern" rows="3" required value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} placeholder="Share your experience with the portal..." style={{ resize: 'vertical', fontFamily: 'inherit' }}></textarea>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <button type="button" className="role-tab-btn" style={{ padding: '0.5rem 1rem', borderRadius: '4px' }} onClick={() => setIsFeedbackOpen(false)}>Cancel</button>
                                        <button type="submit" className="cyan-login-btn">Submit Feedback</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
