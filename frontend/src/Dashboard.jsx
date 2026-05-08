import React, { useState, useEffect } from 'react';
import api from './api';

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

    return (
        <div className="content-area">
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}>
                        <i className="fa-solid fa-ship"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Active Vessels</h3>
                        <p>{vessels.length}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                        <i className="fa-solid fa-file-signature"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Pending Clearances</h3>
                        <p>{pendingCount}</p>
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
