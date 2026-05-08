import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

export default function ClearanceWorkflow() {
    const { user } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [formData, setFormData] = useState({ vesselId: '', lastPortOfCall: '', eta: '', etd: '' });

    useEffect(() => {
        api.get('/vessels').then(res => setVessels(res.data)).catch(console.error);
        api.get('/journeys').then(res => setJourneys(res.data)).catch(console.error);
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post('/journeys', formData);
            alert('Journey submitted for clearance!');
            // Refresh
            api.get('/journeys').then(res => setJourneys(res.data));
        } catch (err) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleClearance = async (journeyId, status) => {
        try {
            await api.put(`/journeys/${journeyId}/clearance`, { status });
            alert('Status updated!');
            api.get('/journeys').then(res => setJourneys(res.data));
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="content-area">
            {user?.role === 'Ship Agent Account' && (
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem' }}>Apply for Port Clearance</h3>
                    <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                        <div>
                            <label>Select Vessel</label>
                            <select className="input-modern" value={formData.vesselId} onChange={e => setFormData({...formData, vesselId: e.target.value})} required>
                                <option value="">Select...</option>
                                {vessels.map(v => <option key={v._id} value={v._id}>{v.name} ({v.imoNumber})</option>)}
                            </select>
                        </div>
                        <div><label>Last Port of Call</label><input className="input-modern" value={formData.lastPortOfCall} onChange={e => setFormData({...formData, lastPortOfCall: e.target.value})} required /></div>
                        <div><label>ETA</label><input type="datetime-local" className="input-modern" value={formData.eta} onChange={e => setFormData({...formData, eta: e.target.value})} required /></div>
                        <div><label>ETD</label><input type="datetime-local" className="input-modern" value={formData.etd} onChange={e => setFormData({...formData, etd: e.target.value})} required /></div>
                        <button className="btn btn-primary">Submit Application</button>
                    </form>
                </div>
            )}

            {(user?.role === 'Health Department' || user?.role === 'Customs Department' || user?.role === 'Port Authority Node') && (
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem' }}>Pending Clearances for Review</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected').map(j => (
                            <div key={j._id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px' }}>
                                <h4>{j.vessel?.name} - {j.lastPortOfCall}</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ETA: {new Date(j.eta).toLocaleString()} | ETD: {new Date(j.etd).toLocaleString()}</p>
                                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                                    Health: {j.clearances.health} | Customs: {j.clearances.customs} | Traffic: {j.clearances.traffic}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={() => handleClearance(j._id, 'Approved')}>Approve</button>
                                    <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={() => handleClearance(j._id, 'Rejected')}>Reject</button>
                                </div>
                            </div>
                        ))}
                        {journeys.length === 0 && <p>No pending journeys.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
