import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Loader2, Trash2, Eye, EyeOff, UserPlus, List, ShieldCheck, CheckCircle, XCircle, Search, CalendarDays } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Parse ISO string and format exactly as stored (avoids local-timezone shifting)
const formatCreatedDate = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = MONTHS[d.getMonth()];
    const year  = d.getFullYear();
    const hh    = String(d.getHours()).padStart(2, '0');
    const mm    = String(d.getMinutes()).padStart(2, '0');
    const ampm  = d.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = d.getHours() % 12 || 12;
    return {
        date: `${day} ${month} ${year}`,
        time: `${String(hour12).padStart(2,'0')}:${mm} ${ampm}`
    };
};

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: '', password: '', email: '', role: 'Ship Agent Account' });
    const [showPassword, setShowPassword] = useState(false);
    const [newQrCode, setNewQrCode] = useState(null);
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [formError, setFormError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    // Real-time duplicate detection — computed from live users list
    const dupErrors = {
        username: formData.username.trim() &&
            users.some(u => (u.username || '').toLowerCase() === formData.username.trim().toLowerCase())
            ? `Username "${formData.username.trim()}" is already taken.`
            : '',
        email: formData.email.trim() &&
            users.some(u => (u.email || '').toLowerCase() === formData.email.trim().toLowerCase())
            ? `Email "${formData.email.trim()}" is already registered.`
            : '',
    };
    const hasDupError = !!(dupErrors.username || dupErrors.email);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [syncAge, setSyncAge] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, username }

    // ── Core fetch ──────────────────────────────────────────────────────────
    const fetchUsers = React.useCallback((isBackground = false) => {
        if (!isBackground) setLoading(true);
        api.get('/users')
            .then(res => {
                setUsers(res.data);
                setLoading(false);
                setLastSyncTime(new Date());
            })
            .catch(err => {
                console.error('Failed to load users', err);
                setLoading(false);
            });
    }, []);

    // ── Live sync: event-driven + heartbeat poll ─────────────────────────
    useEffect(() => {
        fetchUsers(); // initial load

        // Instant same-tab sync: fired by mockBackend setDb whenever users table changes
        const onDbChanged = (e) => {
            if (!e.detail?.table || e.detail.table === 'users') {
                fetchUsers(true);
            }
        };
        // Cross-tab sync: fired by browser when another tab writes to localStorage
        const onStorage = (e) => {
            if (!e.key || e.key === 'mock_users') {
                fetchUsers(true);
            }
        };

        window.addEventListener('nmpa:db-changed', onDbChanged);
        window.addEventListener('storage', onStorage);

        // Heartbeat fallback poll every 30 s (reduced from 5 s — events cover the rest)
        const heartbeat = setInterval(() => fetchUsers(true), 30000);

        return () => {
            window.removeEventListener('nmpa:db-changed', onDbChanged);
            window.removeEventListener('storage', onStorage);
            clearInterval(heartbeat);
        };
    }, [fetchUsers]);

    // ── Sync-age ticker ("Updated X s ago") ─────────────────────────────
    useEffect(() => {
        if (!lastSyncTime) return;
        const tick = () => {
            const secs = Math.round((Date.now() - lastSyncTime.getTime()) / 1000);
            setSyncAge(secs < 5 ? 'just now' : `${secs}s ago`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [lastSyncTime]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setCreateSuccess('');
        if (hasDupError) return; // guard: blocked by inline errors
        try {
            const res = await api.post('/users', formData);
            setCreateSuccess(`User "${formData.username}" created successfully!`);
            setFormData({ username: '', password: '', email: '', role: 'Ship Agent Account' });
            if (res.data.qrCodeUrl) {
                setNewQrCode({ username: formData.username, url: res.data.qrCodeUrl, secret: res.data.secret });
            }
            fetchUsers();
        } catch (err) {
            setFormError(err.response?.data?.error || 'Failed to create user. Please try again.');
        }
    };

    const handleDeleteUser = async (id, username) => {
        setDeleteConfirm({ id, username });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const { id, username } = deleteConfirm;
        setDeleteConfirm(null);
        // Optimistic removal — row vanishes immediately
        setUsers(prev => prev.filter(u => u._id !== id));
        try {
            await api.delete(`/users/${id}`);
            fetchUsers(true); // explicitly refetch to sync both local mock and real DB
        } catch (err) {
            // Roll back on error
            fetchUsers(true);
            setFormError('Failed to delete user: ' + (err.response?.data?.error || err.message));
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

    const handleReset2FA = async (id, username) => {
        if (!window.confirm(`Configure/Reset 2FA for ${username}? This will generate a new QR code.`)) return;
        try {
            const res = await api.put(`/users/${id}/reset-2fa`);
            setNewQrCode({ username, url: res.data.qrCodeUrl, secret: res.data.secret });
            fetchUsers(true); // explicitly refetch to sync both local mock and real DB
        } catch (err) {
            setFormError('Failed to reset 2FA: ' + (err.response?.data?.error || err.message));
        }
    };

    const { user, t } = useContext(AuthContext);

    return (
        <div className="content-area">
            {newQrCode && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="panel" style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{t('twoFaConfig')}</h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>{t('scanQrCode')} <strong>{newQrCode.username}</strong>.</p>
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <img src={newQrCode.url} alt="2FA QR" style={{ display: 'block' }} />
                        </div>
                        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{t('manualKey')}:</p>
                            <code style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '1px' }}>{newQrCode.secret}</code>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setNewQrCode(null)}>{t('close')}</button>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="panel" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
                        <Trash2 size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Delete User?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            This will permanently remove <strong>{deleteConfirm.username}</strong> from the system.
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn" style={{ flex: 1, background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>Cancel</button>
                            <button onClick={confirmDelete} className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white', fontWeight: 700 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-grid">
                <div className="panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <UserPlus size={24} color="var(--primary)" />
                        <h3>{t('createNewUser')}</h3>
                    </div>
                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Form-level error banner */}
                        {formError && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600, animation: 'shake 0.3s ease' }}>
                                <XCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                                {formError}
                            </div>
                        )}
                        {/* Success banner */}
                        {createSuccess && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
                                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                                {createSuccess}
                            </div>
                        )}

                        <div>
                            <label>{t('role')}</label>
                            <select className="input-modern" value={formData.role} onChange={e => { setFormData({...formData, role: e.target.value}); setFormError(''); setCreateSuccess(''); }} required>
                                <option value="Ship Agent Account">Ship Agent</option>
                                <option value="Port Authority Node">Port Authority</option>
                                <option value="Customs Department">Customs</option>
                                <option value="Health Department">Health</option>
                                <option value="System Administrator">System Administrator</option>
                            </select>
                        </div>

                        {/* Email field with inline duplicate warning */}
                        <div>
                            <label>{t('emailAddress')}</label>
                            <input
                                type="email"
                                className="input-modern"
                                style={{ borderColor: dupErrors.email ? 'var(--danger)' : '', outline: dupErrors.email ? '1px solid var(--danger)' : '' }}
                                value={formData.email}
                                onChange={e => { setFormData({...formData, email: e.target.value}); setFormError(''); setCreateSuccess(''); }}
                                required
                            />
                            {dupErrors.email && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
                                    <XCircle size={13} />
                                    {dupErrors.email}
                                </div>
                            )}
                        </div>

                        {/* Username field with inline duplicate warning */}
                        <div>
                            <label>{t('username')}</label>
                            <input
                                className="input-modern"
                                style={{ borderColor: dupErrors.username ? 'var(--danger)' : '', outline: dupErrors.username ? '1px solid var(--danger)' : '' }}
                                value={formData.username}
                                onChange={e => { setFormData({...formData, username: e.target.value}); setFormError(''); setCreateSuccess(''); }}
                                required
                            />
                            {dupErrors.username && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
                                    <XCircle size={13} />
                                    {dupErrors.username}
                                </div>
                            )}
                        </div>

                        <div>
                            <label>{t('password')}</label>
                            <div style={{ position: 'relative' }}>
                                <input type={showPassword ? 'text' : 'password'} className="input-modern" style={{ paddingRight: '2.5rem' }} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '0.5rem', opacity: hasDupError ? 0.5 : 1, cursor: hasDupError ? 'not-allowed' : 'pointer' }}
                            disabled={hasDupError}
                            title={hasDupError ? 'Fix duplicate username or email before creating' : ''}
                        >
                            {t('createUser')}
                        </button>
                    </form>
                </div>

                <div className="panel">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <List size={24} color="var(--primary)" />
                                <h3>{t('userRoster')}</h3>
                                {/* Live sync badge */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: '999px', padding: '0.15rem 0.55rem', fontSize: '0.65rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.05em' }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block', animation: 'livePulse 1.4s ease-in-out infinite' }} />
                                    LIVE
                                </span>
                            </div>
                            {user?.role === 'System Administrator' && (
                                <button onClick={() => handleReset2FA(user._id, user.username)} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ShieldCheck size={16} /> {t('configureMy2fa')}
                                </button>
                            )}
                        </div>
                        {/* Sync age */}
                        {syncAge && (
                            <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                                Synced {syncAge} · {users.length} user{users.length !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder={t('searchUserPlaceholder')} 
                            className="input-modern"
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                            value={searchUserQuery}
                            onChange={e => setSearchUserQuery(e.target.value)}
                        />
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
                                        <th style={{ padding: '1rem' }}>{t('username')}</th>
                                        <th style={{ padding: '1rem' }}>{t('role')}</th>
                                        <th style={{ padding: '1rem' }}>{t('status')}</th>
                                        <th style={{ padding: '1rem' }}>{t('createdDate')}</th>
                                        <th style={{ padding: '1rem' }}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => {
                                        return (u.username || '').toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                                               (u.role || '').toLowerCase().includes(searchUserQuery.toLowerCase());
                                    }).map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500' }}>{u.username}</td>
                                            <td style={{ padding: '1rem' }}><span className="badge">{u.role}</span></td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    color: u.status === 'approved' ? 'var(--success)' : u.status === 'pending' ? 'var(--warning)' : 'var(--danger)',
                                                    fontSize: '0.875rem', fontWeight: '600'
                                                }}>
                                                    {u.status?.toUpperCase() || 'PENDING'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {(() => {
                                                    const fmt = formatCreatedDate(u.createdAt);
                                                    return fmt ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <CalendarDays size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                {fmt.date}
                                                            </span>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                                                {fmt.time}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                                                    );
                                                })()}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                    {u.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleStatusUpdate(u._id, 'approved')} title="Approve" style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}><CheckCircle size={20} /></button>
                                                            <button onClick={() => handleStatusUpdate(u._id, 'rejected')} title="Reject" style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={20} /></button>
                                                        </>
                                                    )}
                                                    {u.username !== 'Admin' && (
                                                        <button onClick={() => handleDeleteUser(u._id, u.username)} title="Delete User" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.filter(u => {
                                        return (u.username || '').toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                                               (u.role || '').toLowerCase().includes(searchUserQuery.toLowerCase());
                                    }).length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                                <Search size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                                {t('noMatchingUsers')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
