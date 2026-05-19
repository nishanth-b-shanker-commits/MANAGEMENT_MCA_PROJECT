import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon, LayoutDashboard, History, Search, Moon, Sun } from 'lucide-react';
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
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCmdOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsNotificationOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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
      enterprise: 'नया मंगलौर पोर्टल अथॉरिटी (NMPA) — भारत सरकार का उद्यम',
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
          <span style={{ color: 'var(--gov-text)' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय | MINISTRY OF PORTS, SHIPPING AND WATERWAYS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span className="gov-badge">{t('officialPortal')}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--gov-text)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {t('accessibility')}: 
            <button onClick={() => setFontSize('large')} style={{ border: 'none', background: fontSize === 'large' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A+</button>
            <button onClick={() => setFontSize('normal')} style={{ border: 'none', background: fontSize === 'normal' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A</button>
            <button onClick={() => setFontSize('small')} style={{ border: 'none', background: fontSize === 'small' ? '#cbd5e1' : 'none', cursor: 'pointer', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-main)' }}>A-</button>
          </span>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
          <span 
            onClick={toggleLang} 
            style={{ cursor: 'pointer', fontWeight: 800, color: 'var(--primary)', userSelect: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
            title="Switch Language / भाषा बदलें"
          >
            🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
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
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} title={t('dashboard')}>
              <LayoutDashboard size={20} /> <span>{t('dashboard')}</span>
            </Link>
            {user.role === 'Ship Agent Account' && (
              <Link to="/registry" className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`} title={t('registry')}>
                <FileCheck size={20} /> <span>{t('registry')}</span>
              </Link>
            )}
            <Link to="/workflow" className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`} title={t('workflow')}>
              <Ship size={20} /> <span>{t('workflow')}</span>
            </Link>
            {user.role === 'System Administrator' && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} title={t('admin')}>
                <Settings size={20} /> <span>{t('admin')}</span>
              </Link>
            )}
            <Link to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`} title={t('logs')}>
              <History size={20} /> <span>{t('logs')}</span>
            </Link>
          </nav>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
            <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} title={t('signOut')}>
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
                  background: 'var(--user-profile-bg)', 
                  border: '1px solid var(--glass-border)', 
                  cursor: 'pointer', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '12px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--user-profile-shadow)',
                  outline: 'none'
                }}
                className="hamburger-btn"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <Menu size={20} />
              </button>
              
              {/* Command Palette trigger */}
              <div 
                onClick={() => setIsCmdOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: 'var(--input-bg)', 
                  border: '1px solid var(--glass-border)', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  width: '240px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
                title="Search commands (Ctrl+K)"
              >
                <Search size={16} />
                <span style={{ flex: 1, textAlign: 'left' }}>Search commands...</span>
                <kbd style={{ 
                  background: 'rgba(0,0,0,0.08)', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  color: 'var(--text-main)'
                }}>Ctrl+K</kbd>
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{pageTitle}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Notification Center */}
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  style={{
                    background: 'var(--user-profile-bg)',
                    border: '1px solid var(--glass-border)',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--user-profile-shadow)',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    boxShadow: '0 0 8px var(--danger)'
                  }}></span>
                </button>
                {isNotificationOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '55px',
                    width: '320px',
                    background: 'var(--glass)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '1rem',
                    boxShadow: 'var(--glass-shadow)',
                    zIndex: 1000,
                    padding: '1rem',
                    textAlign: 'left',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>Notifications</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Mark all read</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.75rem', 
                        background: 'var(--input-bg)', 
                        borderLeft: '4px solid var(--primary)', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--primary)' }}>⚓</span> System Update
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                          NMPA Port Management System successfully updated to v1.2.
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.75rem', 
                        background: 'var(--input-bg)', 
                        borderLeft: '4px solid var(--success)', 
                        borderRadius: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--success)' }}>✓</span> Clearance Approval
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                          Vessel MV Ocean Express cleared customs department.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

      {/* Command Palette Modal */}
      {isCmdOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '15vh',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setIsCmdOpen(false)}>
          <div style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '1.5rem',
            width: '100%',
            maxWidth: '540px',
            boxShadow: 'var(--glass-shadow)',
            overflow: 'hidden',
            animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', borderBottom: '1px solid var(--glass-border)' }}>
              <Search size={20} color="var(--primary)" />
              <input 
                autoFocus
                type="text" 
                placeholder="Type a command or page name..." 
                value={cmdQuery}
                onChange={e => setCmdQuery(e.target.value)}
                style={{ 
                  border: 'none', 
                  background: 'none', 
                  outline: 'none', 
                  width: '100%', 
                  fontSize: '1.1rem', 
                  color: 'var(--text-main)',
                  fontWeight: 500
                }}
              />
            </div>
            
            {/* Command List */}
            <div style={{ padding: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.5rem 0.75rem' }}>Navigation</div>
              {[
                { label: t('dashboard'), path: '/', icon: <LayoutDashboard size={16} /> },
                ...(user.role === 'Ship Agent Account' ? [{ label: t('registry'), path: '/registry', icon: <FileCheck size={16} /> }] : []),
                { label: t('workflow'), path: '/workflow', icon: <Ship size={16} /> },
                ...(user.role === 'System Administrator' ? [{ label: t('admin'), path: '/admin', icon: <Settings size={16} /> }] : []),
                { label: t('logs'), path: '/logs', icon: <History size={16} /> }
              ].filter(item => item.label.toLowerCase().includes(cmdQuery.toLowerCase())).map(item => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  onClick={() => setIsCmdOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                  className="cmd-item"
                >
                  {item.icon}
                  <span>Go to {item.label}</span>
                </Link>
              ))}

              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0.75rem 0.5rem 0.5rem', borderTop: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>Preferences & System</div>
              {[
                { label: 'Toggle Light/Dark Theme', action: toggleTheme, icon: theme === 'light' ? <Moon size={16} /> : <Sun size={16} /> },
                { label: 'Switch Language (हिन्दी / English)', action: toggleLang, icon: <span>🌐</span> },
                { label: 'Sign Out / Logout', action: logout, icon: <LogOut size={16} />, danger: true }
              ].filter(item => item.label.toLowerCase().includes(cmdQuery.toLowerCase())).map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => { item.action(); setIsCmdOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    color: item.danger ? 'var(--danger)' : 'var(--text-main)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  className="cmd-item"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
