import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Anchor, Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, User } from 'lucide-react';
import './index.css';

function Dashboard() {
  return (
    <div className="content-area">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}>
            <Ship />
          </div>
          <div className="stat-info">
            <h3>Active Vessels</h3>
            <p>12</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <FileCheck />
          </div>
          <div className="stat-info">
            <h3>Pending Clearances</h3>
            <p>5</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)' }}>
            <Clock />
          </div>
          <div className="stat-info">
            <h3>Avg. Port Time</h3>
            <p>2.4 Days</p>
          </div>
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Recent Clearances</h3>
        <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading recent clearances...</p>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Anchor size={28} />
          <span>NMPA PORT</span>
        </div>
        <nav style={{ flex: 1 }}>
          <Link to="/" className="nav-link active"><Ship size={20} /> Dashboard</Link>
          <Link to="/registry" className="nav-link"><FileCheck size={20} /> Registry</Link>
          <Link to="/workflow" className="nav-link"><Clock size={20} /> Workflow</Link>
          <Link to="/admin" className="nav-link"><Settings size={20} /> Admin</Link>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-link" style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
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
                <User size={20} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>System Admin</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Role</div>
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
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registry" element={<div className="content-area"><div className="panel"><h3>Vessel Registry</h3><p className="text-muted mt-4">Registry module under construction...</p></div></div>} />
          <Route path="/workflow" element={<div className="content-area"><div className="panel"><h3>Clearance Workflow</h3><p className="text-muted mt-4">Workflow engine integration pending...</p></div></div>} />
          <Route path="/admin" element={<div className="content-area"><div className="panel"><h3>Admin Panel</h3><p className="text-muted mt-4">RBAC Service integration pending...</p></div></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
