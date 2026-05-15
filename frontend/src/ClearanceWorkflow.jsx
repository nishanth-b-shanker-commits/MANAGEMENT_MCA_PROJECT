import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

export default function ClearanceWorkflow() {
    const { user } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [formData, setFormData] = useState({ vesselId: '', lastPortOfCall: '', eta: '', etd: '' });

    const fetchData = () => {
        api.get('/vessels').then(res => setVessels(res.data)).catch(console.error);
        api.get('/journeys').then(res => setJourneys(res.data)).catch(console.error);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
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
        const note = window.prompt(`Please provide a reason or note for this ${status}:`);
        if (note === null) return; // User cancelled
        try {
            await api.put(`/journeys/${journeyId}/clearance`, { status, note });
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
                    <h3 style={{ marginBottom: '1rem' }}>My Journey Status & Notes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {journeys.map(j => (
                            <div key={j._id} style={{ padding: '1rem', border: `1px solid ${j.status === 'Cleared' ? 'var(--success)' : j.status === 'Rejected' ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '8px', backgroundColor: j.status === 'Cleared' ? 'rgba(34, 197, 94, 0.05)' : j.status === 'Rejected' ? 'rgba(239, 68, 68, 0.05)' : '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{j.vessel?.name} - {j.lastPortOfCall}</h4>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        borderRadius: '4px', 
                                        backgroundColor: j.status === 'Cleared' ? 'var(--success)' : j.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)', 
                                        color: j.status === 'In Progress' ? '#000' : '#fff', 
                                        fontWeight: 'bold', 
                                        fontSize: '0.75rem' 
                                    }}>{j.status}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                        <strong>Health:</strong> <span style={{ color: j.clearances.health === 'Approved' ? 'var(--success)' : j.clearances.health === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.health}</span>
                                        {j.notes?.health && <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Note: {j.notes.health}</div>}
                                    </div>
                                    <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                        <strong>Customs:</strong> <span style={{ color: j.clearances.customs === 'Approved' ? 'var(--success)' : j.clearances.customs === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.customs}</span>
                                        {j.notes?.customs && <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Note: {j.notes.customs}</div>}
                                    </div>
                                    <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                                        <strong>Traffic:</strong> <span style={{ color: j.clearances.traffic === 'Approved' ? 'var(--success)' : j.clearances.traffic === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.traffic}</span>
                                        {j.notes?.traffic && <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Note: {j.notes.traffic}</div>}
                                    </div>
                                </div>
                                {j.status === 'Cleared' && (
                                    <button className="btn btn-primary" style={{ marginTop: '1rem', backgroundColor: 'var(--success)', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => alert('Downloading No Dues Certificate...')}>Download Final Certificate</button>
                                )}
                            </div>
                        ))}
                        {journeys.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No journey applications submitted yet.</p>}
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
                                    
                                    <div style={{ 
                                        margin: '1rem 0', 
                                        padding: '1rem', 
                                        backgroundColor: '#f8fafc', 
                                        border: '1px dashed var(--primary)', 
                                        borderRadius: '8px' 
                                    }}>
                                        <h5 style={{ fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            📁 Document Vault (Ship Agent Uploads)
                                        </h5>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            {(j.documents || ['Ship_Registry.pdf', 'Crew_List.xlsx', 'Health_Declaration.pdf']).map((doc, idx) => (
                                                <div key={idx} style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center', 
                                                    padding: '0.5rem', 
                                                    backgroundColor: '#fff', 
                                                    border: '1px solid #e2e8f0', 
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc}</span>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button 
                                                            className="btn-link" 
                                                            style={{ color: 'var(--secondary)', fontWeight: 'bold' }} 
                                                            onClick={() => window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')}
                                                        >
                                                            View
                                                        </button>
                                                        <button 
                                                            className="btn-link" 
                                                            style={{ color: 'var(--primary)', fontWeight: 'bold' }} 
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                                                                link.download = doc;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                        >
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                        <div><strong>Health:</strong> <span style={{ color: j.clearances.health === 'Approved' ? 'var(--success)' : j.clearances.health === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.health}</span> {j.notes?.health ? <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>- {j.notes.health}</span> : ''}</div>
                                        <div><strong>Customs:</strong> <span style={{ color: j.clearances.customs === 'Approved' ? 'var(--success)' : j.clearances.customs === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.customs}</span> {j.notes?.customs ? <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>- {j.notes.customs}</span> : ''}</div>
                                        <div><strong>Traffic:</strong> <span style={{ color: j.clearances.traffic === 'Approved' ? 'var(--success)' : j.clearances.traffic === 'Rejected' ? 'var(--danger)' : 'inherit' }}>{j.clearances.traffic}</span> {j.notes?.traffic ? <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>- {j.notes.traffic}</span> : ''}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                        <td style={{ padding: '1rem' }}>
                                            <div>{j.clearances.health}</div>
                                            {j.notes?.health && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '150px' }}>{j.notes.health}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{j.clearances.customs}</div>
                                            {j.notes?.customs && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '150px' }}>{j.notes.customs}</div>}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>{j.clearances.traffic}</div>
                                            {j.notes?.traffic && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', maxWidth: '150px' }}>{j.notes.traffic}</div>}
                                        </td>
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
