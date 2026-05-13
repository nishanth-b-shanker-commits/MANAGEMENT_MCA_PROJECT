import React, { useState, useEffect } from 'react';
import api from './api';
import { Ship, FileCheck } from 'lucide-react';

export default function Dashboard() {
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);

    useEffect(() => {
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
        fetchData();
    }, []);

    const pendingCount = journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected').length;
    
    // Calculate accurate analytics
    const total = journeys.length || 1; // Avoid division by zero
    const healthPct = Math.round((journeys.filter(j => j.clearances?.health === 'Approved').length / total) * 100);
    const customsPct = Math.round((journeys.filter(j => j.clearances?.customs === 'Approved').length / total) * 100);
    const trafficPct = Math.round((journeys.filter(j => j.clearances?.traffic === 'Approved').length / total) * 100);

    return (
        <div className="content-area">
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}>
                        <Ship size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Active Vessels</h3>
                        <p>{vessels.length}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                        <FileCheck size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>Pending Clearances</h3>
                        <p>{pendingCount}</p>
                    </div>
                </div>
            </div>

            <div className="panel" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Clearance Analytics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${healthPct}%`, background: 'var(--success)', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <p style={{ fontSize: '0.875rem' }}>Health Approvals ({healthPct}%)</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${customsPct}%`, background: 'var(--secondary)', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <p style={{ fontSize: '0.875rem' }}>Customs Clearance ({customsPct}%)</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${trafficPct}%`, background: 'var(--primary)', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <p style={{ fontSize: '0.875rem' }}>Traffic Compliance ({trafficPct}%)</p>
                    </div>
                </div>
            </div>
            
            <div className="panel">
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Recent Clearances</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Vessel</th>
                            <th style={{ padding: '0.5rem' }}>Port of Call</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {journeys.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No data available</td></tr>}
                        {journeys.map(j => (
                            <tr key={j._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{j.vessel?.name || 'Unknown'}</td>
                                <td style={{ padding: '0.5rem' }}>{j.lastPortOfCall}</td>
                                <td style={{ padding: '0.5rem', color: j.status === 'Cleared' ? 'var(--success)' : 'var(--warning)' }}>{j.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
