import React, { useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Anchor, Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon, LayoutDashboard } from 'lucide-react';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import VesselRegistry from './VesselRegistry';
import ClearanceWorkflow from './ClearanceWorkflow';
import AdminPanel from './AdminPanel';
import './index.css';

function PrivateRoute({ children }) {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
}

function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

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
    '/admin': 'Administration'
  }[location.pathname] || 'NMPA Port';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white' }}>
            <Anchor size={24} />
          </div>
          <h2>NMPA PORT</h2>
        </div>
        <nav style={{ flex: 1 }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          {user.role === 'Ship Agent Account' && (
            <Link to="/registry" className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`}>
              <FileCheck size={20} /> Vessel Registry
            </Link>
          )}
          <Link to="/workflow" className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`}>
            <Ship size={20} /> Journey Workflow
          </Link>
          {user.role === 'System Administrator' && (
            <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
              <Settings size={20} /> Admin Panel
            </Link>
          )}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
          <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
            </Routes></Layout>} />
          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
