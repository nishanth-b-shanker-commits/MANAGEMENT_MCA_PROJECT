import React, { useState, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

export default function VesselRegistry() {
    const { t } = useContext(AuthContext);
    const [formData, setFormData] = useState({ name: '', imoNumber: '', flagState: 'Panama', vesselType: 'Container Ship', ownerDetails: '', grt: '', nrt: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convert to numbers before sending
            const payload = {
                ...formData,
                grt: formData.grt ? Number(formData.grt) : undefined,
                nrt: formData.nrt ? Number(formData.nrt) : undefined
            };
            await api.post('/vessels', payload);
            alert('Vessel registered successfully!');
            setFormData({ name: '', imoNumber: '', flagState: 'Panama', vesselType: 'Container Ship', ownerDetails: '', grt: '', nrt: '' });
        } catch (err) {
            alert('Failed to register vessel: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="content-area">
            <div className="panel">
                <h3 style={{ marginBottom: '1rem' }}>{t('registerNewVessel')}</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                    <div><label>{t('vesselName')}</label><input className="input-modern" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                    <div><label>{t('imoNumber')}</label><input className="input-modern" value={formData.imoNumber} onChange={e => setFormData({...formData, imoNumber: e.target.value})} required /></div>
                    <div>
                        <label>{t('flagState')}</label>
                        <select className="input-modern" value={formData.flagState} onChange={e => setFormData({...formData, flagState: e.target.value})}>
                            <option>Panama</option><option>Liberia</option><option>Singapore</option><option>Oman</option><option>India</option>
                        </select>
                    </div>
                    <div>
                        <label>{t('vesselType')}</label>
                        <select className="input-modern" value={formData.vesselType} onChange={e => setFormData({...formData, vesselType: e.target.value})}>
                            <option>Container Ship</option><option>Bulk Carrier</option><option>Oil Tanker</option><option>LNG Carrier</option><option>LPG Carrier</option><option>MT (Motor Tanker)</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div><label>Gross Registered Tonnage (GRT - MT)</label><input type="number" className="input-modern" value={formData.grt} onChange={e => setFormData({...formData, grt: e.target.value})} required placeholder="e.g. 62433" /></div>
                        <div><label>Net Registered Tonnage (NRT - MT)</label><input type="number" className="input-modern" value={formData.nrt} onChange={e => setFormData({...formData, nrt: e.target.value})} required placeholder="e.g. 33595" /></div>
                    </div>
                    <div><label>Owner / Agent Details</label><input className="input-modern" value={formData.ownerDetails} onChange={e => setFormData({...formData, ownerDetails: e.target.value})} required placeholder="e.g. Shipping Corp" /></div>
                    <button className="btn btn-primary">{t('registerBtn')}</button>
                </form>
            </div>
        </div>
    );
}
