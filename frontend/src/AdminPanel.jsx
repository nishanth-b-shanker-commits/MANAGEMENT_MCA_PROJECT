import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Loader2, Trash2, Eye, EyeOff, UserPlus, List, Shield } from 'lucide-react';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', email: '', role: 'Ship Agent Account' });
    const [auditTrails, setAuditTrails] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = (isBackground = false) => {
        if (!isBackground) setLoading(true);
        Promise.all([
            api.get('/users'),
            api.get('/audit-trails')
        ]).then(([usersRes, auditRes]) => {
            setUsers(usersRes.data);
            setAuditTrails(auditRes.data);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load admin data", err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchUsers();
        const interval = setInterval(() => fetchUsers(true), 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            alert('User created successfully!');
            setFormData({ username: '', password: '', email: '', role: 'Ship Agent Account' });
            fetchUsers();
        } catch (err) {
            alert('Failed to create user: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteUser = async (id, username) => {
        if (!window.confirm(`Are you sure you want to delete user ${username}?`)) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/users/${id}/status`, { status });
            fetchUsers();
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.error || err.message));
        }
    };

    const { user } = useContext(AuthContext);

    return (
        <div className="content-area">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                <div className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <UserPlus size={24} color="var(--primary)" />
                        <h3>Create New User</h3>
                    </div>
                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label>Role</label>
                            <select className="input-modern" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                                <option value="System Administrator">System Administrator</option>
                            </select>
                        </div>
                        <div>
                            <label>Email Address</label>
                            <input type="email" className="input-modern" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        </div>
                        <div>
                            <label>Username</label>
                            <input className="input-modern" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                        </div>
                        <div>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} className="input-modern" style={{ paddingRight: '2.5rem' }} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>Create User</button>
                    </form>
                </div>

                <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <List size={24} color="var(--primary)" />
                            <h3>User Roster</h3>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <Loader2 className="lucide-spin" size={32} color="var(--primary)" />
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Username</th>
                                        <th style={{ padding: '1rem' }}>Role</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{u.username}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge">{u.role}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: u.status === 'approved' ? 'var(--success)' : 'var(--warning)',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {u.status?.toUpperCase() || 'APPROVED'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {u.status === 'pending' && (
                                                        <button onClick={() => handleStatusUpdate(u._id, 'approved')} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Approve</button>
                                                    )}
                                                    {u.role !== 'System Administrator' && (
                                                        <button onClick={() => handleDeleteUser(u._id, u.username)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="panel" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Shield size={24} color="var(--primary)" />
                    <h3>System Audit Logs</h3>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--panel-bg)', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                                <th style={{ padding: '0.75rem' }}>User</th>
                                <th style={{ padding: '0.75rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditTrails.map(log => (
                                <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem' }}>{log.user}</td>
                                    <td style={{ padding: '0.75rem' }}>{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
