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
                        <div>
                            <label>Document Submission (PDF/Docs)</label>
                            <input 
                                type="file" 
                                className="input-modern" 
                                multiple 
                                onChange={e => {
                                    const files = Array.from(e.target.files).map(f => f.name);
                                    setFormData({...formData, documents: files});
                                }} 
                                title="Click to upload documents" 
                            />
                            {formData.documents && formData.documents.length > 0 && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                                    ✓ {formData.documents.length} files selected: {formData.documents.join(', ')}
                                </div>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Upload Port Clearance docs, Health Decs, and IGM files.</p>
                        </div>
                        <button className="btn btn-primary">Submit Application</button>
                    </form>
                </div>
            )}

            {user?.role === 'Ship Agent Account' && (
                <div className="panel" style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Final Port Clearances</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {journeys.filter(j => j.status === 'Cleared').map(j => (
                            <div key={j._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--success)', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                                <span>{j.vessel?.name} - Final Clearance Ready</span>
                                <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => alert('Downloading No Dues Certificate...')}>Download Certificate</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(user?.role === 'Health Department' || user?.role === 'Customs Department' || user?.role === 'Port Authority Node') && (
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem' }}>Pending Clearances for Review</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected').map(j => {
                            const isHealth = user.role === 'Health Department';
                            const isCustoms = user.role === 'Customs Department';
                            const isTraffic = user.role === 'Port Authority Node';
                            
                            const alreadyApproved = (isHealth && j.clearances.health === 'Approved') ||
                                                  (isCustoms && j.clearances.customs === 'Approved') ||
                                                  (isTraffic && j.clearances.traffic === 'Approved');

                            return (
                                <div key={j._id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', opacity: alreadyApproved ? 0.7 : 1 }}>
                                    <h4>{j.vessel?.name} - {j.lastPortOfCall}</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ETA: {new Date(j.eta).toLocaleString()} | ETD: {new Date(j.etd).toLocaleString()}</p>
                                    
                                    <div style={{ margin: '1rem 0', padding: '0.75rem', backgroundColor: 'var(--bg-sidebar)', borderRadius: '4px' }}>
                                        <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Submitted Documents</h5>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {(j.documents || []).map((doc, idx) => (
                                                <button key={idx} className="btn-link" style={{ fontSize: '0.875rem', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }} onClick={() => alert(`Downloading ${doc}...`)}>
                                                    {doc}
                                                </button>
                                            ))}
                                            {(!j.documents || j.documents.length === 0) && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No documents uploaded.</span>}
                                        </div>
                                    </div>

                                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
                                        Health: <span style={{ color: j.clearances.health === 'Approved' ? 'var(--success)' : 'inherit' }}>{j.clearances.health}</span> | 
                                        Customs: <span style={{ color: j.clearances.customs === 'Approved' ? 'var(--success)' : 'inherit' }}>{j.clearances.customs}</span> | 
                                        Traffic: <span style={{ color: j.clearances.traffic === 'Approved' ? 'var(--success)' : 'inherit' }}>{j.clearances.traffic}</span>
                                    </p>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ backgroundColor: alreadyApproved ? '#ccc' : 'var(--success)', cursor: alreadyApproved ? 'not-allowed' : 'pointer' }} 
                                            onClick={() => !alreadyApproved && handleClearance(j._id, 'Approved')}
                                            disabled={alreadyApproved}
                                        >
                                            {alreadyApproved ? 'Approved' : 'Approve'}
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ backgroundColor: alreadyApproved ? '#ccc' : 'var(--danger)', cursor: alreadyApproved ? 'not-allowed' : 'pointer' }} 
                                            onClick={() => !alreadyApproved && handleClearance(j._id, 'Rejected')}
                                            disabled={alreadyApproved}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                    {alreadyApproved && <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>✓ You have already approved this clearance.</p>}
                                </div>
                            );
                        })}
                        {journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected').length === 0 && <p>No pending journeys.</p>}
                    </div>
                </div>
            )}

            {user?.role === 'System Administrator' && (
                <div className="panel">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>System Overview: All Clearance Records</h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Read-only view of all vessel journeys across all departments.</p>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem' }}>Vessel</th>
                                    <th style={{ padding: '1rem' }}>Port of Call</th>
                                    <th style={{ padding: '1rem' }}>Health</th>
                                    <th style={{ padding: '1rem' }}>Customs</th>
                                    <th style={{ padding: '1rem' }}>Traffic</th>
                                    <th style={{ padding: '1rem' }}>Overall Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {journeys.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No journeys recorded.</td></tr>}
                                {journeys.map(j => (
                                    <tr key={j._id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{j.vessel?.name}</td>
                                        <td style={{ padding: '1rem' }}>{j.lastPortOfCall}</td>
                                        <td style={{ padding: '1rem' }}>{j.clearances.health}</td>
                                        <td style={{ padding: '1rem' }}>{j.clearances.customs}</td>
                                        <td style={{ padding: '1rem' }}>{j.clearances.traffic}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                backgroundColor: j.status === 'Cleared' ? 'rgba(34, 197, 94, 0.1)' : j.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                                color: j.status === 'Cleared' ? 'var(--success)' : j.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)',
                                                fontWeight: 'bold',
                                                fontSize: '0.875rem'
                                            }}>{j.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
