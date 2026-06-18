import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { Ship, FileCheck, Activity, TrendingUp, Anchor } from 'lucide-react';
import { AuthContext } from './AuthContext';

export default function Dashboard() {
    const { t } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);

    const fetchData = async () => {
        try {
            const [vRes, jRes] = await Promise.all([
                api.get('/vessels'),
                api.get('/journeys')
            ]);
            setVessels(vRes.data);
            setJourneys(jRes.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const pendingCount = journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected').length;
    const clearedCount = journeys.filter(j => j.status === 'Cleared').length;
    
    const total = journeys.length || 1;
    const healthPct = Math.round((journeys.filter(j => j.clearances?.health === 'Approved').length / total) * 100);
    const customsPct = Math.round((journeys.filter(j => j.clearances?.customs === 'Approved').length / total) * 100);
    const trafficPct = Math.round((journeys.filter(j => j.clearances?.traffic === 'Approved').length / total) * 100);

    return (
        <div style={{ animation: 'pageEnter 0.6s ease-out' }}>
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                        <Ship size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('registeredVessels')}</h3>
                        <p>{vessels.length}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--success)' }}><TrendingUp size={20} /></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                        <Activity size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('activeJourneys')}</h3>
                        <p>{pendingCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <Anchor size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('totalClearances')}</h3>
                        <p>{clearedCount}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('clearanceProgress')}</h3>
                        <span className="badge">{t('realTimeData')}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontWeight: 600 }}>
                                <span>{t('healthDept')}</span>
                                <span style={{ color: 'var(--primary)' }}>{healthPct}%</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${healthPct}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '100px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontWeight: 600 }}>
                                <span>{t('customsDept')}</span>
                                <span style={{ color: 'var(--success)' }}>{customsPct}%</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${customsPct}%`, background: 'linear-gradient(90deg, var(--success), #34d399)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '100px' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontWeight: 600 }}>
                                <span>{t('portTrafficControl')}</span>
                                <span style={{ color: 'var(--warning)' }}>{trafficPct}%</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${trafficPct}%`, background: 'linear-gradient(90deg, var(--warning), #fbbf24)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '100px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel">
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{t('systemSummary')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--sidebar-hover-bg)', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>{t('peakActivity')}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>09:00 AM - 11:00 AM</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--sidebar-hover-bg)', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>{t('avgClearanceTime')}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>4.2 {t('hours')}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--sidebar-hover-bg)', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>{t('complianceRate')}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>98.4%</div>
                        </div>
                    </div>
                </div>
            </div>
            

        </div>
    );
}
