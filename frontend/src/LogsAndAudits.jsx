import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Shield, Activity, Loader2, RefreshCw, Clock, User, FileText, CheckCircle2, AlertCircle, Search } from 'lucide-react';

export default function LogsAndAudits() {
    const { user } = useContext(AuthContext);
    const [journeys, setJourneys] = useState([]);
    const [auditTrails, setAuditTrails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search and Filter State
    const [opsSearch, setOpsSearch] = useState('');
    const [opsStatus, setOpsStatus] = useState('ALL');
    const [auditSearch, setAuditSearch] = useState('');

    const isAdmin = user?.role === 'System Administrator';

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);

        try {
            const promises = [api.get('/journeys')];
            if (isAdmin) {
                promises.push(api.get('/audit-trails'));
            }

            const results = await Promise.all(promises);
            setJourneys(results[0].data);
            if (isAdmin && results[1]) {
                setAuditTrails(results[1].data);
            }
        } catch (err) {
            console.error("Failed to fetch logs data", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    // Statistics Calculations
    const complianceRate = journeys.length 
        ? Math.round((journeys.filter(j => j.status === 'Cleared').length / journeys.length) * 100) 
        : 100;

    // Filter Journeys (Operational Logs)
    const filteredJourneys = journeys.filter(j => {
        const matchesSearch = (j.vessel?.name || '').toLowerCase().includes(opsSearch.toLowerCase()) || 
                             (j.lastPortOfCall || '').toLowerCase().includes(opsSearch.toLowerCase());
        const matchesStatus = opsStatus === 'ALL' || 
                             (opsStatus === 'Pending' ? (j.status !== 'Cleared' && j.status !== 'Rejected') : j.status === opsStatus);
        return matchesSearch && matchesStatus;
    });

    // Filter Audit Trails
    const filteredAudits = auditTrails.filter(log => {
        return (log.user || '').toLowerCase().includes(auditSearch.toLowerCase()) || 
               (log.action || '').toLowerCase().includes(auditSearch.toLowerCase());
    });

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
                <Loader2 className="lucide-spin" size={40} color="var(--primary)" />
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading system logs...</p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'pageEnter 0.6s ease-out' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>Logs & Audits Console</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Consolidated, searchable view of port operations and security audits</p>
                </div>
                <button 
                    onClick={() => fetchData(false)} 
                    className="btn btn-primary" 
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={refreshing}
                >
                    <RefreshCw className={refreshing ? "lucide-spin" : ""} size={16} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Smart Analytics Cards */}
            <div className="stat-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--secondary)' }}>
                        <Activity size={24} />
                    </div>
                    <div className="stat-info">
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Vessel Journeys</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-dark)' }}>{journeys.length} Tracked</p>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="stat-info">
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Port Compliance</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-dark)' }}>{complianceRate}% Cleared</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="stat-card" style={{ padding: '1.25rem' }}>
                        <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                            <Shield size={24} />
                        </div>
                        <div className="stat-info">
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Security Events</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--bg-dark)' }}>{auditTrails.length} Audited</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Layout */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isAdmin ? 'repeat(auto-fit, minmax(500px, 1fr))' : '1fr', 
                gap: '2rem' 
            }}>
                {/* Column 1: Recent Operational Logs */}
                <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--secondary)', padding: '8px', borderRadius: '10px' }}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Operational Logs</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time clearance progress of active vessel journeys</p>
                        </div>
                    </div>

                    {/* Operational Logs Controls */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text" 
                                placeholder="Search by vessel or origin..." 
                                className="input-modern"
                                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                                value={opsSearch}
                                onChange={e => setOpsSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            className="input-modern"
                            style={{ width: '160px', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                            value={opsStatus}
                            onChange={e => setOpsStatus(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Cleared">Cleared</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="table-container" style={{ flex: 1, maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={{ borderSpacing: '0 0.5rem' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                                <tr>
                                    <th>Vessel</th>
                                    <th>Origin</th>
                                    <th>Clearances</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJourneys.map(j => (
                                    <tr key={j._id} style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--glass-border)' }}>
                                        <td style={{ fontWeight: 700, padding: '1rem' }}>{j.vessel?.name || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>{j.lastPortOfCall}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span title="Health Clearance Status" style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.health === 'Approved' ? 'var(--success)' : 'var(--danger)', boxShadow: `0 0 8px ${j.clearances?.health === 'Approved' ? 'var(--success)' : 'var(--danger)'}` }}></span>
                                                <span title="Customs Clearance Status" style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.customs === 'Approved' ? 'var(--success)' : 'var(--danger)', boxShadow: `0 0 8px ${j.clearances?.customs === 'Approved' ? 'var(--success)' : 'var(--danger)'}` }}></span>
                                                <span title="Traffic Clearance Status" style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.traffic === 'Approved' ? 'var(--success)' : 'var(--danger)', boxShadow: `0 0 8px ${j.clearances?.traffic === 'Approved' ? 'var(--success)' : 'var(--danger)'}` }}></span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className="badge" style={{ 
                                                background: j.status === 'Cleared' ? 'rgba(16, 185, 129, 0.1)' : j.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: j.status === 'Cleared' ? 'var(--success)' : j.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontWeight: 800
                                            }}>
                                                {j.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredJourneys.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                            <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                            No matching operational logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Column 2: System Audit Logs (Admins only) */}
                {isAdmin && (
                    <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>System Audit Logs</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chronological history of security and configuration changes</p>
                            </div>
                        </div>

                        {/* Audit Logs Controls */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                    type="text" 
                                    placeholder="Search by action or username..." 
                                    className="input-modern"
                                    style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                                    value={auditSearch}
                                    onChange={e => setAuditSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>Time</th>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>User</th>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAudits.map(log => (
                                        <tr key={log._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Clock size={12} />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <User size={12} color="var(--primary)" />
                                                    {log.user}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                    <FileText size={12} color="var(--text-muted)" />
                                                    <span style={{ wordBreak: 'break-word' }}>{log.action}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredAudits.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                                <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                                No matching system audit trails available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
