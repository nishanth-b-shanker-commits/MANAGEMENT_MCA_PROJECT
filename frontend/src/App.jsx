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
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img
            src="/MANAGEMENT_MCA_PROJECT/nmpa-logo.png"
            alt="NMPA Logo"
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          />
          <h2>NMPA PORT</h2>
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
                <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{user.username}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>
        <div className="content-area">
          {children}
        </div>
      </main>
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
