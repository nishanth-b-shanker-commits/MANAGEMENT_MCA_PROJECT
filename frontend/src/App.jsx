import React, { useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Anchor, Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon } from 'lucide-react';
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

    resetTimer(); // Start timer immediately

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
        clearTimeout(timeoutId);
        events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  if (!user) return <Login />;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Anchor size={28} />
          <span>NMPA PORT</span>
        </div>
        <nav style={{ flex: 1 }}>
          <Link to="/" className="nav-link"><Ship size={20} /> Dashboard</Link>
          {user.role === 'Ship Agent Account' && <Link to="/registry" className="nav-link"><FileCheck size={20} /> Registry</Link>}
          <Link to="/workflow" className="nav-link"><Clock size={20} /> Workflow</Link>
          {user.role === 'System Administrator' && <Link to="/admin" className="nav-link"><Settings size={20} /> Admin</Link>}
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout} className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Menu size={24} /></button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Overview</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Bell size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</div>
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/registry" element={<PrivateRoute><VesselRegistry /></PrivateRoute>} />
              <Route path="/workflow" element={<PrivateRoute><ClearanceWorkflow /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
            </Routes>
          </Layout>
        </Router>
    </AuthProvider>
  );
}

export default App;
