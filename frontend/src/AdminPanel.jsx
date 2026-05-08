import React, { useState, useEffect } from 'react';
import api from './api';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users')
            .then(res => {
                setUsers(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load users", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="content-area">
            <div className="panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>User & Security Management</h3>
                        <p className="text-muted" style={{ marginTop: '0.25rem' }}>Overview of all registered personnel and their 2FA compliance.</p>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
                        <p style={{ marginTop: '1rem' }}>Loading user data...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Username</th>
                                    <th style={{ padding: '1rem' }}>Role Authority</th>
                                    <th style={{ padding: '1rem' }}>Security Status</th>
                                    <th style={{ padding: '1rem' }}>Registration Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 && (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No users found.</td></tr>
                                )}
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{u.username}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                                                color: 'var(--secondary)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {u.is2FAEnabled ? (
                                                <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <i className="fa-solid fa-shield-check"></i> 2FA Enforced
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <i className="fa-solid fa-shield-exclamation"></i> No 2FA (Admin)
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
