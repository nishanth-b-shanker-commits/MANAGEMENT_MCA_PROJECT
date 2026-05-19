import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon, LayoutDashboard, History } from 'lucide-react';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import VesselRegistry from './VesselRegistry';
import ClearanceWorkflow from './ClearanceWorkflow';
import AdminPanel from './AdminPanel';
import LogsAndAudits from './LogsAndAudits';
import './index.css';

function PrivateRoute({ children }) {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('appFontSize') || 'normal');

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

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
    if (!user) return;
    
    let timeoutId;
    const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            alert('You have been logged out due to 60 seconds of inactivity.');
            logout();
        }, 60000);
    };

    resetTimer(); 

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
        clearTimeout(timeoutId);
        events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  if (!user) return <Login />;

  const translations = {
    en: {
      dashboard: 'Dashboard',
      registry: 'Vessel Registry',
      workflow: 'Journey Workflow',
      admin: 'Admin Panel',
      logs: 'Logs & Audits',
      signOut: 'Sign Out',
      namaste: 'Namaste',
      officialPortal: 'Official Portal',
      accessibility: 'Accessibility',
      title: 'National Maritime Single Window Portal',
      enterprise: 'New Mangalore Port Authority (NMPA) — Govt. of India Enterprise',
      helpline: 'Toll-Free Helpline',
      supportDesk: '24x7 support desk',
      email: 'Helpdesk Email',
      rights: 'All Rights Reserved.',
      satyamev: 'सत्यमेव जयते',
      sysDashboard: 'System Dashboard',
      administration: 'Administration',
      subTitle: 'Govt of India Enterprise'
    },
    hi: {
      dashboard: 'डैशबोर्ड',
      registry: 'पोत पंजीकरण',
      workflow: 'यात्रा कार्यप्रवाह',
      admin: 'प्रशासन पैनल',
      logs: 'लॉग और ऑडिट',
      signOut: 'बाहर निकलें',
      namaste: 'नमस्ते',
      officialPortal: 'आधिकारिक पोर्टल',
      accessibility: 'सुगम्यता',
      title: 'राष्ट्रीय समुद्री एकल खिड़की पोर्टल',
      enterprise: 'नया मंगलौर पोर्ट अथॉरिटी (NMPA) — भारत सरकार का उद्यम',
      helpline: 'टोल-फ्री हेल्पलाइन',
      supportDesk: '24x7 सहायता डेस्क',
      email: 'हेल्पडेस्क ईमेल',
      rights: 'सर्वाधिकार सुरक्षित।',
      satyamev: 'सत्यमेव जयते',
      sysDashboard: 'प्रणाली डैशबोर्ड',
      administration: 'प्रशासन',
      subTitle: 'भारत सरकार का उद्यम'
    }
  };

  const t = (key) => translations[lang][key] || translations['en'][key] || key;

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    localStorage.setItem('appLang', newLang);
  };

  const pageTitle = {
    '/': t('sysDashboard'),
    '/registry': t('registry'),
    '/workflow': t('workflow'),
    '/admin': t('administration'),
    '/logs': t('logs')
  }[location.pathname] || 'NMPA Port';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Indian Government Header Banner */}
      <div className="gov-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#FF9933' }}></span>
          <span>भारत सरकार | GOVERNMENT OF INDIA</span>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
          <span style={{ color: '#475569' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय | MINISTRY OF PORTS, SHIPPING AND WATERWAYS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span className="gov-badge">{t('officialPortal')}</span>
          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {t('accessibility')}: 
            <button onClick={() => setFontSize('large')} style={{ border: 'none', background: fontSize === 'large' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>A+</button>
            <button onClick={() => setFontSize('normal')} style={{ border: 'none', background: fontSize === 'normal' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>A</button>
            <button onClick={() => setFontSize('small')} style={{ border: 'none', background: fontSize === 'small' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>A-</button>
          </span>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
          <span 
            onClick={toggleLang} 
            style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--primary)', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
            title="Switch Language / भाषा बदलें"
          >
            🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
          </span>
        </div>
      </div>
      <div className="gov-tricolor-stripe"></div>

      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ flex: 1 }}>
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <img
              src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
              alt="NMPA Logo"
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>NMPA PORT</h2>
              <span className="gov-title-sub">{t('subTitle')}</span>
            </div>
          </div>
          <nav style={{ flex: 1 }}>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> <span>{t('dashboard')}</span>
            </Link>
            {user.role === 'Ship Agent Account' && (
              <Link to="/registry" className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`}>
                <FileCheck size={20} /> <span>{t('registry')}</span>
              </Link>
            )}
            <Link to="/workflow" className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`}>
              <Ship size={20} /> <span>{t('workflow')}</span>
            </Link>
            {user.role === 'System Administrator' && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <Settings size={20} /> <span>{t('admin')}</span>
              </Link>
            )}
            <Link to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`}>
              <History size={20} /> <span>{t('logs')}</span>
            </Link>
          </nav>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
            <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
              <LogOut size={20} /> <span>{t('signOut')}</span>
            </button>
          </div>
        </aside>
        <main className="main-content">
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                style={{ 
                  background: 'rgba(255,255,255,0.8)', 
                  border: '1px solid var(--glass-border)', 
                  cursor: 'pointer', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '12px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
                  outline: 'none'
                }}
                className="hamburger-btn"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <Menu size={20} />
              </button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-dark)' }}>{pageTitle}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className="user-profile">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{t('namaste')}, {user.username}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                  <UserIcon size={20} />
                </div>
              </div>
            </div>
          </header>
          <div className="content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <footer className="gov-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>🚢 {t('title')}</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>{t('enterprise')}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <p>📞 {t('helpline')}: <b>1800-11-2026</b> ({t('supportDesk')})</p>
                  <p style={{ marginTop: '2px' }}>✉️ {t('email')}: <b>support-nmpa@gov.in</b></p>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                <span className="satyamev-jayate">{t('satyamev')}</span>
                <span>© 2026 New Mangalore Port Authority. {t('rights')}</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<Layout><Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/registry" element={<PrivateRoute><VesselRegistry /></PrivateRoute>} />
              <Route path="/workflow" element={<PrivateRoute><ClearanceWorkflow /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
              <Route path="/logs" element={<PrivateRoute><LogsAndAudits /></PrivateRoute>} />
            </Routes></Layout>} />
          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
