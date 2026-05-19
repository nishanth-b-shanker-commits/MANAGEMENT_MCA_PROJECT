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

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

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
    '/': 'System Dashboard',
    '/registry': 'Vessel Registry',
    '/workflow': 'Clearance Workflow',
    '/admin': 'Administration',
    '/logs': 'Logs & Audits'
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
          <span className="gov-badge">Official Portal</span>
          <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Accessibility: <b>A+</b> <b>A</b> <b>A-</b></span>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>|</span>
          <span style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--primary)' }}>English / हिन्दी</span>
        </div>
      </div>
      <div className="gov-tricolor-stripe"></div>

      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ flex: 1 }}>
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <img
              src="/MANAGEMENT_MCA_PROJECT/nmpa-logo.png"
              alt="NMPA Logo"
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>NMPA PORT</h2>
              <span className="gov-title-sub">Govt of India Enterprise</span>
            </div>
          </div>
          <nav style={{ flex: 1 }}>
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={20} /> <span>Dashboard</span>
            </Link>
            {user.role === 'Ship Agent Account' && (
              <Link to="/registry" className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`}>
                <FileCheck size={20} /> <span>Vessel Registry</span>
              </Link>
            )}
            <Link to="/workflow" className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`}>
              <Ship size={20} /> <span>Journey Workflow</span>
            </Link>
            {user.role === 'System Administrator' && (
              <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
                <Settings size={20} /> <span>Admin Panel</span>
              </Link>
            )}
            <Link to="/logs" className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`}>
              <History size={20} /> <span>Logs & Audits</span>
            </Link>
          </nav>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
            <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
              <LogOut size={20} /> <span>Sign Out</span>
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
                  <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>Namaste, {user.username}</div>
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
                  <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>🚢 National Maritime Single Window Portal</p>
                  <p style={{ opacity: 0.8, fontSize: '0.7rem', marginTop: '4px' }}>New Mangalore Port Authority (NMPA) — Govt. of India Enterprise</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <p>📞 Toll-Free Helpline: <b>1800-11-2026</b> (24x7 support desk)</p>
                  <p style={{ marginTop: '2px' }}>✉️ Helpdesk Email: <b>support-nmpa@gov.in</b></p>
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
                <span className="satyamev-jayate">सत्यमेव जयते</span>
                <span style={{ opacity: 0.6 }}>© 2026 New Mangalore Port Authority. All Rights Reserved.</span>
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
