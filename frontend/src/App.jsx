import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon, LayoutDashboard, History, Moon, Sun, Trash2, AlertTriangle, Info, Check, X } from 'lucide-react';
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
  const { 
    user, 
    logout, 
    notifications, 
    unreadCount, 
    toasts, 
    removeToast, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    lang,
    toggleLang,
    t
  } = useContext(AuthContext);
  
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('appFontSize') || 'normal');
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'light');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);


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



  const pageTitle = {
    '/': t('sysDashboard'),
    '/registry': t('registry'),
    '/workflow': t('workflow'),
    '/admin': t('administration'),
    '/logs': t('logs')
  }[location.pathname] || 'NMPA Port';

  const formatRelativeTime = (isoString) => {
      if (!isoString) return '';
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
  };

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

      <div className="app-container" style={{ flex: 1 }}>
        {isSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <img
              src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
              alt="NMPA Logo"
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>NMPA PORT</h2>
              <span className="gov-title-sub">{t('subTitle')}</span>
            </div>
            {/* Close button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '6px', borderRadius: '8px',
                transition: 'all 0.2s', flexShrink: 0
              }}
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav style={{ flex: 1 }}>
            <div className="nav-section-label">Main</div>
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon"><LayoutDashboard size={18} /></span>
              <span className="nav-label">{t('dashboard')}</span>
            </Link>

            <Link
              to="/workflow"
              className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon"><Ship size={18} /></span>
              <span className="nav-label">{t('workflow')}</span>
            </Link>

            {user.role === 'Ship Agent Account' && (
              <Link
                to="/registry"
                className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><FileCheck size={18} /></span>
                <span className="nav-label">{t('registry')}</span>
              </Link>
            )}

            <div className="nav-section-label">System</div>
            {user.role === 'System Administrator' && (
              <Link
                to="/admin"
                className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><Settings size={18} /></span>
                <span className="nav-label">{t('admin')}</span>
              </Link>
            )}
            <Link
              to="/logs"
              className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon"><History size={18} /></span>
              <span className="nav-label">{t('logs')}</span>
            </Link>
          </nav>

          <div className="sidebar-user-section">
            <button
              onClick={logout}
              className="nav-link"
              style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="nav-icon" style={{ color: 'var(--danger)' }}><LogOut size={18} /></span>
              <span className="nav-label" style={{ fontWeight: 700 }}>{t('signOut')}</span>
            </button>
          </div>
        </aside>
        <main className="main-content">
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                title={isSidebarOpen ? "Close Menu" : "Open Menu"}
              >
                <Menu size={20} />
              </button>
              
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
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        height: '18px',
                        minWidth: '18px',
                        borderRadius: '50%',
                        padding: '0 4px',
                        boxShadow: '0 0 6px var(--danger)'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => clearAllNotifications()}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={11} /> Clear all
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">
                          <Bell size={32} className="notification-empty-icon" />
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>No notifications</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>You are all caught up!</div>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const IconComp = n.type === 'success' ? Check : n.type === 'danger' || n.type === 'warning' ? AlertTriangle : Info;
                          return (
                            <div
                              key={n.id}
                              onClick={() => deleteNotification(n.id)}
                              className="notification-item"
                              title="Click to dismiss"
                            >
                              <div className={`notification-item-icon ${n.type}`}>
                                <IconComp size={16} />
                              </div>
                              <div className="notification-item-content">
                                <div className="notification-item-title">{n.title}</div>
                                <div className="notification-item-desc">{n.message}</div>
                                <span className="notification-item-time">{formatRelativeTime(n.timestamp)}</span>
                              </div>
                              <div className="notification-item-actions" style={{ opacity: 1 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                  className="notification-dismiss-btn"
                                  title="Dismiss"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
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

      {/* Floating Toasts */}
      <div className="toasts-container">
        {toasts.map(t => {
          const IconComp = t.type === 'success' ? Check : t.type === 'danger' || t.type === 'warning' ? AlertTriangle : Info;
          return (
            <div key={t.id} className="toast-item" onClick={() => removeToast(t.id)}>
              <div className={`notification-item-icon ${t.type}`} style={{ width: '28px', height: '28px' }}>
                <IconComp size={14} />
              </div>
              <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-main)' }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{t.message}</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
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
