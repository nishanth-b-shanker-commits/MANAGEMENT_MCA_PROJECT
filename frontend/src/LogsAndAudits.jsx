import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Shield, Activity, Loader2, RefreshCw, Clock, User, FileText, CheckCircle2, AlertCircle, Search, Download } from 'lucide-react';

export default function LogsAndAudits() {
    const { user, t } = useContext(AuthContext);
    const [journeys, setJourneys] = useState([]);
    const [auditTrails, setAuditTrails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search and Filter State
    const [opsSearch, setOpsSearch] = useState('');
    const [opsStatus, setOpsStatus] = useState('ALL');
    const [opsDateRange, setOpsDateRange] = useState('ALL');
    const [auditSearch, setAuditSearch] = useState('');
    const [auditDateRange, setAuditDateRange] = useState('ALL');
    const [auditCategory, setAuditCategory] = useState('ALL');
    
    // Inspector modal state
    const [selectedLog, setSelectedLog] = useState(null);

    const hasAuditAccess = user?.role === 'System Administrator' || user?.role === 'Port Authority Node';

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);

        try {
            const promises = [api.get('/journeys')];
            if (hasAuditAccess) {
                promises.push(api.get('/audit-trails'));
            }

            const results = await Promise.all(promises);
            setJourneys(results[0].data);
            if (hasAuditAccess && results[1]) {
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
    }, [hasAuditAccess]);

    // Statistics Calculations
    const complianceRate = journeys.length 
        ? Math.round((journeys.filter(j => j.status === 'Cleared').length / journeys.length) * 100) 
        : 100;

    // Highlight matched text helper
    const highlightText = (text, search) => {
        if (!search) return text;
        const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        const parts = String(text).split(regex);
        return parts.map((part, i) => 
            regex.test(part) 
                ? <mark key={i} style={{ backgroundColor: 'rgba(255, 153, 51, 0.25)', color: 'inherit', padding: '0 2px', borderRadius: '2px', fontWeight: 'bold' }}>{part}</mark> 
                : part
        );
    };

    // Helper to extract log metadata
    const getLogMetadata = (log) => {
        const action = (log.action || '').toLowerCase();
        let severity = 'info';
        let category = 'SYSTEM';
        
        if (action.includes('delete') || action.includes('reject') || action.includes('fail')) {
            severity = 'danger';
        } else if (action.includes('create') || action.includes('approve') || action.includes('register') || action.includes('success') || action.includes('cleared')) {
            severity = 'success';
        } else if (action.includes('update') || action.includes('change') || action.includes('status')) {
            severity = 'warning';
        }
        
        if (action.includes('user')) {
            category = 'USER';
        } else if (action.includes('clearance') || action.includes('status') || action.includes('approve')) {
            category = 'CLEARANCE';
        } else if (action.includes('journey') || action.includes('vessel')) {
            category = 'VOYAGE';
        }
        
        return { severity, category };
    };

    const matchesDate = (timestamp, range) => {
        if (range === 'ALL' || !timestamp) return true;
        const date = new Date(timestamp);
        const now = new Date();
        if (isNaN(date.getTime())) return true;
        
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (range === 'TODAY') {
            return date.toDateString() === now.toDateString();
        }
        if (range === '7DAYS') {
            return diffDays <= 7;
        }
        return true;
    };

    // Filter Journeys (Operational Logs)
    const filteredJourneys = journeys.filter(j => {
        const matchesSearch = (j.vessel?.name || '').toLowerCase().includes(opsSearch.toLowerCase()) || 
                             (j.lastPortOfCall || '').toLowerCase().includes(opsSearch.toLowerCase());
        const matchesStatus = opsStatus === 'ALL' || 
                             (opsStatus === 'Pending' ? (j.status !== 'Cleared' && j.status !== 'Rejected') : j.status === opsStatus);
        const matchesOpsDate = matchesDate(j.eta || j.createdAt, opsDateRange);
        return matchesSearch && matchesStatus && matchesOpsDate;
    });

    // Filter Audit Trails
    const filteredAudits = auditTrails.filter(log => {
        const matchesSearch = (log.user || '').toLowerCase().includes(auditSearch.toLowerCase()) || 
                             (log.action || '').toLowerCase().includes(auditSearch.toLowerCase());
        const matchesAuditDate = matchesDate(log.timestamp, auditDateRange);
        
        const { category } = getLogMetadata(log);
        const matchesCategory = auditCategory === 'ALL' || category === auditCategory;
        
        return matchesSearch && matchesAuditDate && matchesCategory;
    });

    // Helper function to export to CSV
    const exportToCSV = (headers, rows, filename) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => 
                row.map(val => {
                    const cleanVal = (val === null || val === undefined) ? '' : String(val);
                    return `"${cleanVal.replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportOperationalLogs = () => {
        const headers = ['Vessel Name', 'Origin', 'Health Clearance', 'Customs Clearance', 'Traffic Clearance', 'Overall Status'];
        const rows = filteredJourneys.map(j => [
            j.vessel?.name || 'N/A',
            j.lastPortOfCall || '',
            j.clearances?.health || 'Pending',
            j.clearances?.customs || 'Pending',
            j.clearances?.traffic || 'Pending',
            j.status || ''
        ]);
        exportToCSV(headers, rows, `operational_logs_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportAuditLogs = () => {
        const headers = ['Timestamp', 'User', 'Action'];
        const rows = filteredAudits.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.user || '',
            log.action || ''
        ]);
        exportToCSV(headers, rows, `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
                <Loader2 className="lucide-spin" size={40} color="var(--primary)" />
                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('loadingSystemLogs')}</p>
            </div>
        );
    }

    return (
        <div style={{ animation: 'pageEnter 0.6s ease-out' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{t('logsAuditsConsole')}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('logsAuditsSub')}</p>
                </div>
                <button 
                    onClick={() => fetchData(false)} 
                    className="btn btn-primary" 
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    disabled={refreshing}
                >
                    <RefreshCw className={refreshing ? "lucide-spin" : ""} size={16} />
                    {refreshing ? t('refreshing') : t('refresh')}
                </button>
            </div>

            {/* Smart Analytics Cards */}
            <div className="stat-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--secondary)' }}>
                        <Activity size={24} />
                    </div>
                    <div className="stat-info" style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('vesselJourneys')}</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{journeys.length} {t('tracked')}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active clearance pipeline</span>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: '1.25rem' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div className="stat-info" style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('portCompliance')}</h4>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{complianceRate}% {t('clearedStatus')}</p>
                        <div style={{ marginTop: '0.25rem', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${complianceRate}%`, background: 'var(--success)', borderRadius: '3px' }}></div>
                        </div>
                    </div>
                </div>
                {hasAuditAccess && (
                    <div className="stat-card" style={{ padding: '1.25rem' }}>
                        <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                            <Shield size={24} />
                        </div>
                        <div className="stat-info" style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t('securityEvents')}</h4>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>{auditTrails.length} {t('audited')}</p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>
                                Last action by: {auditTrails[0]?.user || 'System'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Layout */}
            <div className="logs-grid">
                {/* Column 1: Recent Operational Logs */}
                <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                        <div style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--secondary)', padding: '8px', borderRadius: '10px' }}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t('recentOpsLogs')}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('recentOpsLogsSub')}</p>
                        </div>
                    </div>

                    {/* Operational Logs Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text" 
                                placeholder={t('searchVesselOrigin')} 
                                className="input-modern"
                                style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                                value={opsSearch}
                                onChange={e => setOpsSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            className="input-modern"
                            style={{ width: '130px', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                            value={opsStatus}
                            onChange={e => setOpsStatus(e.target.value)}
                        >
                            <option value="ALL">{t('allStatuses')}</option>
                            <option value="Cleared">{t('clearedStatus')}</option>
                            <option value="Pending">{t('pendingStatus')}</option>
                            <option value="Rejected">{t('rejectedStatus')}</option>
                        </select>
                        <select 
                            className="input-modern"
                            style={{ width: '130px', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                            value={opsDateRange}
                            onChange={e => setOpsDateRange(e.target.value)}
                        >
                            <option value="ALL">{t('allTime') || 'All Time'}</option>
                            <option value="TODAY">{t('today') || 'Today'}</option>
                            <option value="7DAYS">{t('last7Days') || 'Last 7 Days'}</option>
                        </select>
                        <button 
                            onClick={exportOperationalLogs}
                            className="btn" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                padding: '0.6rem 1.2rem', 
                                fontSize: '0.875rem',
                                background: 'rgba(14, 165, 233, 0.1)',
                                color: 'var(--secondary)',
                                border: '1px solid rgba(14, 165, 233, 0.2)',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                transition: 'all 0.2s ease'
                            }}
                            title={t('exportOpsTitle')}
                        >
                            <Download size={16} />
                            <span>{t('exportBtn')}</span>
                        </button>
                    </div>

                    <div className="table-container" style={{ flex: 1, maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={{ borderSpacing: '0 0.5rem' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                                <tr>
                                    <th>{t('vessel')}</th>
                                    <th>{t('origin')}</th>
                                    <th>{t('clearancesLabel')}</th>
                                    <th>{t('status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJourneys.map(j => (
                                    <tr 
                                        key={j._id} 
                                        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={() => setSelectedLog({ type: 'ops', data: j })}
                                        className="cmd-item"
                                    >
                                        <td style={{ fontWeight: 700, padding: '1rem' }}>{highlightText(j.vessel?.name || 'N/A', opsSearch)}</td>
                                        <td style={{ padding: '1rem' }}>{highlightText(j.lastPortOfCall, opsSearch)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span title={`Health Clearance: ${j.clearances?.health}`} style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.health === 'Approved' ? 'var(--success)' : j.clearances?.health === 'Rejected' ? 'var(--danger)' : 'var(--warning)', boxShadow: `0 0 8px ${j.clearances?.health === 'Approved' ? 'var(--success)' : j.clearances?.health === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}></span>
                                                <span title={`Customs Clearance: ${j.clearances?.customs}`} style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.customs === 'Approved' ? 'var(--success)' : j.clearances?.customs === 'Rejected' ? 'var(--danger)' : 'var(--warning)', boxShadow: `0 0 8px ${j.clearances?.customs === 'Approved' ? 'var(--success)' : j.clearances?.customs === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}></span>
                                                <span title={`Traffic Clearance: ${j.clearances?.traffic}`} style={{ width: '10px', height: '10px', borderRadius: '50%', background: j.clearances?.traffic === 'Approved' ? 'var(--success)' : j.clearances?.traffic === 'Rejected' ? 'var(--danger)' : 'var(--warning)', boxShadow: `0 0 8px ${j.clearances?.traffic === 'Approved' ? 'var(--success)' : j.clearances?.traffic === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}` }}></span>
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
                                            {t('noMatchingOpsLogs')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Column 2: System Audit Logs (Admins only) */}
                {hasAuditAccess && (
                    <div className="panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3>{t('systemAuditLogs')}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('systemAuditLogsSub')}</p>
                            </div>
                        </div>

                        {/* Audit Logs Controls */}
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input 
                                    type="text" 
                                    placeholder={t('searchActionUser')} 
                                    className="input-modern"
                                    style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                                    value={auditSearch}
                                    onChange={e => setAuditSearch(e.target.value)}
                                />
                            </div>
                            <select 
                                className="input-modern"
                                style={{ width: '120px', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                                value={auditDateRange}
                                onChange={e => setAuditDateRange(e.target.value)}
                            >
                                <option value="ALL">{t('allTime') || 'All Time'}</option>
                                <option value="TODAY">{t('today') || 'Today'}</option>
                                <option value="7DAYS">{t('last7Days') || 'Last 7 Days'}</option>
                            </select>
                            <select 
                                className="input-modern"
                                style={{ width: '120px', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                                value={auditCategory}
                                onChange={e => setAuditCategory(e.target.value)}
                            >
                                <option value="ALL">All Categories</option>
                                <option value="USER">Users</option>
                                <option value="CLEARANCE">Clearances</option>
                                <option value="VOYAGE">Voyages</option>
                                <option value="SYSTEM">System</option>
                            </select>
                            <button 
                                onClick={exportAuditLogs}
                                className="btn" 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem',  
                                    padding: '0.6rem 1.2rem', 
                                    fontSize: '0.875rem',
                                    background: 'rgba(37, 99, 235, 0.1)',
                                    color: 'var(--primary)',
                                    border: '1px solid rgba(37, 99, 235, 0.2)',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                title={t('exportAuditsTitle')}
                            >
                                <Download size={16} />
                                <span>{t('exportBtn')}</span>
                            </button>
                        </div>

                        <div style={{ flex: 1, maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>{t('timeLabel')}</th>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>{t('userLabel')}</th>
                                        <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem' }}>{t('actionLabel')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAudits.map(log => {
                                        const { severity, category } = getLogMetadata(log);
                                        const severityColor = severity === 'danger' ? 'var(--danger)' : severity === 'success' ? 'var(--success)' : severity === 'warning' ? 'var(--warning)' : 'var(--primary)';
                                        return (
                                            <tr 
                                                key={log._id} 
                                                style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background 0.2s', cursor: 'pointer' }}
                                                onClick={() => setSelectedLog({ type: 'audit', data: log })}
                                                className="cmd-item"
                                            >
                                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} />
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <User size={12} color={severityColor} />
                                                        {highlightText(log.user, auditSearch)}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                        <span style={{ 
                                                            display: 'inline-block', 
                                                            width: '6px', 
                                                            height: '6px', 
                                                            borderRadius: '50%', 
                                                            background: severityColor,
                                                            marginRight: '4px'
                                                        }}></span>
                                                        <span style={{ wordBreak: 'break-word', fontWeight: severity === 'danger' ? '600' : 'normal' }}>
                                                            {highlightText(log.action, auditSearch)}
                                                        </span>
                                                        <span className="badge" style={{ 
                                                            fontSize: '0.6rem', 
                                                            padding: '2px 6px', 
                                                            marginLeft: 'auto',
                                                            background: severity === 'danger' ? 'rgba(239, 68, 68, 0.08)' : severity === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                                            color: severityColor
                                                        }}>
                                                            {category}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredAudits.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                                <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                                {t('noMatchingAuditTrails')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Details Inspector Modal */}
            {selectedLog && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        inset: 0, 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        backdropFilter: 'blur(8px)', 
                        webkitBackdropFilter: 'blur(8px)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        zIndex: 10000,
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={() => setSelectedLog(null)}
                >
                    <div 
                        className="modal-card" 
                        style={{ 
                            width: '95%', 
                            maxWidth: '550px', 
                            maxHeight: '85vh', 
                            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            textAlign: 'left'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={22} color="var(--primary)" />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedLog.type === 'ops' ? 'Operational Log Inspector' : 'Security Audit Inspector'}</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedLog(null)} 
                                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                &times;
                            </button>
                        </div>

                        {selectedLog.type === 'ops' ? (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vessel Name</label>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>{selectedLog.data.vessel?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IMO Number</label>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>{selectedLog.data.vessel?.imoNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origin Port</label>
                                        <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>{selectedLog.data.lastPortOfCall || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Status</label>
                                        <div style={{ marginTop: '2px' }}>
                                            <span className="badge" style={{ 
                                                background: selectedLog.data.status === 'Cleared' ? 'rgba(16, 185, 129, 0.1)' : selectedLog.data.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: selectedLog.data.status === 'Cleared' ? 'var(--success)' : selectedLog.data.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontWeight: 800
                                            }}>
                                                {selectedLog.data.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', background: 'var(--sidebar-hover-bg)' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)' }}>Clearance Checklist</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Health Department Clearance</span>
                                            <span className="badge" style={{ 
                                                background: selectedLog.data.clearances?.health === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : selectedLog.data.clearances?.health === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: selectedLog.data.clearances?.health === 'Approved' ? 'var(--success)' : selectedLog.data.clearances?.health === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontSize: '0.7rem'
                                            }}>{selectedLog.data.clearances?.health?.toUpperCase()}</span>
                                        </div>
                                        {selectedLog.data.notes?.health && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-4px', paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>Note: {selectedLog.data.notes.health}</p>}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Customs Department Clearance</span>
                                            <span className="badge" style={{ 
                                                background: selectedLog.data.clearances?.customs === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : selectedLog.data.clearances?.customs === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: selectedLog.data.clearances?.customs === 'Approved' ? 'var(--success)' : selectedLog.data.clearances?.customs === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontSize: '0.7rem'
                                            }}>{selectedLog.data.clearances?.customs?.toUpperCase()}</span>
                                        </div>
                                        {selectedLog.data.notes?.customs && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-4px', paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>Note: {selectedLog.data.notes.customs}</p>}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Traffic Clearance (Port Authority)</span>
                                            <span className="badge" style={{ 
                                                background: selectedLog.data.clearances?.traffic === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : selectedLog.data.clearances?.traffic === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: selectedLog.data.clearances?.traffic === 'Approved' ? 'var(--success)' : selectedLog.data.clearances?.traffic === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontSize: '0.7rem'
                                            }}>{selectedLog.data.clearances?.traffic?.toUpperCase()}</span>
                                        </div>
                                        {selectedLog.data.notes?.traffic && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-4px', paddingLeft: '8px', borderLeft: '2px solid var(--border)' }}>Note: {selectedLog.data.notes.traffic}</p>}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ETA (Scheduled Arrival)</label>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>{selectedLog.data.eta ? new Date(selectedLog.data.eta).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ETD (Scheduled Departure)</label>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>{selectedLog.data.etd ? new Date(selectedLog.data.etd).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manifest & Clearance Documents</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        {selectedLog.data.documents?.map((doc, idx) => (
                                            <span key={idx} className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontSize: '0.75rem' }}>
                                                <FileText size={12} /> {doc}
                                            </span>
                                        )) || <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No documents uploaded.</p>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Authorized User</label>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '2px' }}>{selectedLog.data.user}</p>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Log Timestamp</label>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '2px' }}>{new Date(selectedLog.data.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event Action</label>
                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px', background: 'rgba(22, 70, 117, 0.05)', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid var(--primary)' }}>
                                        {selectedLog.data.action}
                                    </p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Event Category</label>
                                        <div style={{ marginTop: '2px' }}>
                                            <span className="badge" style={{ background: 'var(--sidebar-hover-bg)', color: 'var(--primary)', fontWeight: 800 }}>
                                                {getLogMetadata(selectedLog.data).category}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Severity Rating</label>
                                        <div style={{ marginTop: '2px' }}>
                                            {(() => {
                                                const { severity } = getLogMetadata(selectedLog.data);
                                                const color = severity === 'danger' ? 'var(--danger)' : severity === 'success' ? 'var(--success)' : severity === 'warning' ? 'var(--warning)' : 'var(--primary)';
                                                return (
                                                    <span className="badge" style={{ 
                                                        background: severity === 'danger' ? 'rgba(239, 68, 68, 0.1)' : severity === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)',
                                                        color: color, 
                                                        fontWeight: 800 
                                                    }}>
                                                        {severity.toUpperCase()}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', background: 'var(--sidebar-hover-bg)' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Metadata & Trace Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Source IP:</span> <span style={{ fontWeight: 600 }}>192.168.12.77</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Event ID:</span> <span style={{ fontWeight: 600 }}>evt_{selectedLog.data._id}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Server Node:</span> <span style={{ fontWeight: 600 }}>in_mngl_pt01</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)' }}>Client Protocol:</span> <span style={{ fontWeight: 600 }}>HTTPS/2.0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }} 
                                onClick={() => setSelectedLog(null)}
                            >
                                Close Inspector
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
