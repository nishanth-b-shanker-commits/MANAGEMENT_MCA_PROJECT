import React, { useState, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

export default function VesselRegistry() {
    const { t } = useContext(AuthContext);
    const [formData, setFormData] = useState({ name: '', imoNumber: '', flagState: 'Panama', vesselType: 'Container Ship', ownerDetails: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/vessels', formData);
            alert('Vessel registered successfully!');
            setFormData({ name: '', imoNumber: '', flagState: 'Panama', vesselType: 'Container Ship', ownerDetails: '' });
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
                            <option>Panama</option><option>Liberia</option><option>Singapore</option>
                        </select>
                    </div>
                    <div>
                        <label>{t('vesselType')}</label>
                        <select className="input-modern" value={formData.vesselType} onChange={e => setFormData({...formData, vesselType: e.target.value})}>
                            <option>Container Ship</option><option>Bulk Carrier</option><option>Oil Tanker</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">{t('registerBtn')}</button>
                </form>
            </div>
        </div>
    );
}
