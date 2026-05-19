import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Ship, FileText, CheckCircle2, Clock, XCircle, FileDown, FolderOpen, AlertCircle, Plus, Search } from 'lucide-react';

export default function ClearanceWorkflow() {
    const { user } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [formData, setFormData] = useState({ vesselId: '', lastPortOfCall: '', eta: '', etd: '', documents: [] });
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchData = () => {
        api.get('/vessels').then(res => setVessels(res.data)).catch(console.error);
        api.get('/journeys').then(res => setJourneys(res.data)).catch(console.error);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await api.post('/journeys', formData);
            alert('Application submitted successfully!');
            setShowForm(false);
            setFormData({ vesselId: '', lastPortOfCall: '', eta: '', etd: '', documents: [] });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleClearance = async (journeyId, status) => {
        const note = window.prompt(`Decision note for this ${status}:`);
        if (note === null) return;
        try {
            await api.put(`/journeys/${journeyId}/clearance`, { status, note });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const getStatusColor = (status) => {
        if (status === 'Approved' || status === 'Cleared') return 'var(--success)';
        if (status === 'Rejected') return 'var(--danger)';
        return 'var(--warning)';
    };

    const ProgressStepper = ({ clearances }) => {
        const stages = [
            { id: 'health', name: 'Health', status: clearances.health },
            { id: 'customs', name: 'Customs', status: clearances.customs },
            { id: 'traffic', name: 'Traffic', status: clearances.traffic }
        ];

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '300px' }}>
                {stages.map((stage, idx) => (
                    <React.Fragment key={stage.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                            <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                background: stage.status === 'Approved' ? 'var(--success)' : stage.status === 'Rejected' ? 'var(--danger)' : 'rgba(0,0,0,0.1)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                transition: 'all 0.3s ease'
                            }}>
                                {stage.status === 'Approved' ? <CheckCircle2 size={14} /> : stage.status === 'Rejected' ? <XCircle size={14} /> : <Clock size={14} color="#666" />}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>{stage.name}</span>
                        </div>
                        {idx < stages.length - 1 && (
                            <div style={{ flex: 1, height: '2px', background: 'rgba(0,0,0,0.05)', marginBottom: '14px' }}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div style={{ animation: 'pageEnter 0.6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Clearance Hub</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Manage vessel entry and department approvals</p>
                </div>
                {user?.role === 'Ship Agent Account' && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancel Application' : <><Plus size={20} /> New Application</>}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="panel" style={{ animation: 'pageEnter 0.4s ease' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Port Entry Application</h3>
                    <form onSubmit={handleApply} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Vessel Identifier</label>
                            <select className="input-modern" value={formData.vesselId} onChange={e => setFormData({...formData, vesselId: e.target.value})} required>
                                <option value="">Select Registered Vessel</option>
                                {vessels.map(v => <option key={v._id} value={v._id}>{v.name} ({v.imoNumber})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Last Port of Origin</label>
                            <input className="input-modern" value={formData.lastPortOfCall} onChange={e => setFormData({...formData, lastPortOfCall: e.target.value})} required placeholder="e.g. Singapore" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Arrival (ETA)</label>
                            <input type="datetime-local" className="input-modern" value={formData.eta} onChange={e => setFormData({...formData, eta: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Departure (ETD)</label>
                            <input type="datetime-local" className="input-modern" value={formData.etd} onChange={e => setFormData({...formData, etd: e.target.value})} required />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Documentation (IGM, Health, Cargo)</label>
                            <div style={{ border: '2px dashed rgba(0,0,0,0.1)', padding: '2rem', borderRadius: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
                                <FolderOpen size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload necessary port clearance documents</p>
                                <input type="file" style={{ display: 'none' }} id="file-upload" multiple />
                                <button type="button" className="btn" style={{ marginTop: '1rem', background: 'white', border: '1px solid var(--border)' }} onClick={() => document.getElementById('file-upload').click()}>Choose Files</button>
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
                            <button className="btn btn-primary" style={{ minWidth: '200px' }}>Submit to Authority</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Clearance Pipeline</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14}/> Approved</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14}/> Pending</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14}/> Rejected</span>
                    </div>
                </div>

                {/* Smart Interactive Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder="Search vessel name or origin port..." 
                            className="input-modern"
                            style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.875rem' }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)' }}>
                        {['ALL', 'PENDING', 'CLEARED', 'REJECTED'].map(status => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setStatusFilter(status)}
                                style={{
                                    border: 'none',
                                    background: statusFilter === status ? 'var(--primary)' : 'none',
                                    color: statusFilter === status ? 'white' : 'var(--text-muted)',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.75rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Vessel & Route</th>
                                <th>Schedule</th>
                                <th>Departmental Progress</th>
                                <th>Overall Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journeys.filter(j => {
                                const matchesSearch = (j.vessel?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                     (j.lastPortOfCall || '').toLowerCase().includes(searchQuery.toLowerCase());
                                const matchesStatus = statusFilter === 'ALL' || 
                                                     (statusFilter === 'PENDING' ? (j.status !== 'Cleared' && j.status !== 'Rejected') : j.status.toUpperCase() === statusFilter);
                                return matchesSearch && matchesStatus;
                            }).map(j => {
                                const isDept = user?.role.includes('Department') || user?.role === 'Port Authority Node';
                                const myDept = user?.role === 'Health Department' ? 'health' : user?.role === 'Customs Department' ? 'customs' : user?.role === 'Port Authority Node' ? 'traffic' : null;
                                const alreadyProcessed = myDept && j.clearances[myDept] !== 'Pending';

                                return (
                                    <tr key={j._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', background: 'rgba(37,99,235,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <Ship size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800 }}>{j.vessel?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From: {j.lastPortOfCall}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <div style={{ fontWeight: 600 }}>ETA: {new Date(j.eta).toLocaleDateString()}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>ETD: {new Date(j.etd).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <ProgressStepper clearances={j.clearances} />
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '0.4rem 0.8rem', 
                                                borderRadius: '100px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 800,
                                                background: `${getStatusColor(j.status)}15`,
                                                color: getStatusColor(j.status),
                                                border: `1px solid ${getStatusColor(j.status)}30`
                                            }}>
                                                {j.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {myDept && !alreadyProcessed && (
                                                    <>
                                                        <button className="btn" style={{ padding: '0.5rem', color: 'var(--success)', background: 'rgba(16,185,129,0.1)' }} onClick={() => handleClearance(j._id, 'Approved')}><CheckCircle2 size={18}/></button>
                                                        <button className="btn" style={{ padding: '0.5rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }} onClick={() => handleClearance(j._id, 'Rejected')}><XCircle size={18}/></button>
                                                    </>
                                                )}
                                                {j.status === 'Cleared' && (
                                                    <button className="btn" title="Download Certificate" style={{ padding: '0.5rem', color: 'var(--primary)', background: 'rgba(37,99,235,0.1)' }} onClick={() => alert('Generating Certificate...')}>
                                                        <FileDown size={18} />
                                                    </button>
                                                )}
                                                <button className="btn" title="View Docs" style={{ padding: '0.5rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)' }} onClick={() => alert('Opening Secure Document Vault...')}>
                                                    <FileText size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {journeys.filter(j => {
                                const matchesSearch = (j.vessel?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                     (j.lastPortOfCall || '').toLowerCase().includes(searchQuery.toLowerCase());
                                const matchesStatus = statusFilter === 'ALL' || 
                                                     (statusFilter === 'PENDING' ? (j.status !== 'Cleared' && j.status !== 'Rejected') : j.status.toUpperCase() === statusFilter);
                                return matchesSearch && matchesStatus;
                            }).length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                        <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                        No matching clearance applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
