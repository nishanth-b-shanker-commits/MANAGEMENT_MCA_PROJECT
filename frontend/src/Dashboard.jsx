import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { Ship, FileCheck, Activity, TrendingUp, Anchor, Sun, Wind, Compass, Info, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AuthContext } from './AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { t, lang } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [selectedBerth, setSelectedBerth] = useState(null);

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

    // Map active/cleared journeys to occupy berths dynamically
    const activeJourneys = journeys.filter(j => j.status !== 'Cleared' && j.status !== 'Rejected');
    const clearedJourneys = journeys.filter(j => j.status === 'Cleared');
    
    const initialBerths = [
        { id: 1, name: lang === 'en' ? "Berth 1 (General Cargo)" : "बर्थ 1 (सामान्य माल)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 2, name: lang === 'en' ? "Berth 2 (Container Quay)" : "बर्थ 2 (कंटेनर घाट)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 3, name: lang === 'en' ? "Berth 3 (Liquid Terminal)" : "बर्थ 3 (तरल टर्मिनल)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 4, name: lang === 'en' ? "Berth 4 (LPG/LNG Berth)" : "बर्थ 4 (एलपीजी/एलएनजी बर्थ)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 5, name: lang === 'en' ? "Berth 5 (Coal Berth)" : "बर्थ 5 (कोयला बर्थ)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 6, name: lang === 'en' ? "Berth 6 (Bulk Fertilizer)" : "बर्थ 6 (थोक उर्वरक)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 7, name: lang === 'en' ? "Berth 7 (Oil Jetty)" : "बर्थ 7 (तेल जेटी)", occupied: false, vessel: "", flag: "", grt: 0 },
        { id: 8, name: lang === 'en' ? "Berth 8 (Cruise Terminal)" : "बर्थ 8 (क्रूज टर्मिनल)", occupied: false, vessel: "", flag: "", grt: 0 }
    ];

    const populatedBerths = initialBerths.map((berth, index) => {
        if (activeJourneys[index]) {
            const j = activeJourneys[index];
            return {
                ...berth,
                occupied: true,
                vessel: j.vessel?.name || "Active Vessel",
                flag: j.vessel?.flagState || "IN",
                grt: j.vessel?.grt || 18500,
                status: lang === 'en' ? "Clearing - In Progress" : "मंजूरी प्रक्रिया में"
            };
        }
        const clearedOffset = index - activeJourneys.length;
        if (clearedJourneys[clearedOffset]) {
            const j = clearedJourneys[clearedOffset];
            return {
                ...berth,
                occupied: true,
                vessel: j.vessel?.name || "Cleared Vessel",
                flag: j.vessel?.flagState || "IN",
                grt: j.vessel?.grt || 24000,
                status: lang === 'en' ? "Cleared - Docked" : "स्वीकृत - डॉक पर"
            };
        }
        // Defaults to show active state if database is fresh
        if (index === 0) {
            return { ...berth, occupied: true, vessel: "MV Indian Ocean", flag: "IN", grt: 12500, status: lang === 'en' ? "Cleared - Docked" : "स्वीकृत - डॉक पर" };
        }
        if (index === 3) {
            return { ...berth, occupied: true, vessel: "MT Ganga", flag: "IN", grt: 28400, status: lang === 'en' ? "Cleared - Docked" : "स्वीकृत - डॉक पर" };
        }
        return berth;
    });

    const weatherTitle = lang === 'en' ? 'Weather & Tide Advisory' : 'मौसम और ज्वार सलाह';
    const tideLabel = lang === 'en' ? 'Tide Forecast' : 'ज्वार का पूर्वानुमान';
    const advisoryLabel = lang === 'en' ? 'Safety Advisory' : 'सुरक्षा सलाह';
    const statusText = lang === 'en' ? '🟢 SAFE - Normal Berthing Active' : '🟢 सुरक्षित - सामान्य बर्थिंग सक्रिय';
    const berthMapTitle = lang === 'en' ? 'NMPA Interactive Live Berthing Grid' : 'एनएमपीए इंटरएक्टिव लाइव बर्थिंग ग्रिड';
    const clickBerthMsg = lang === 'en' ? 'Click a berth to inspect vessel boarding clearances' : 'पोत बोर्डिंग निकासी का निरीक्षण करने के लिए बर्थ पर क्लिक करें';

    return (
        <div style={{ animation: 'pageEnter 0.6s ease-out' }}>
            {/* Indian Port Single Window Welcome Header Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9) 0%, rgba(249, 115, 22, 0.15) 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                borderRadius: '1.5rem',
                border: '1px solid var(--glass-border)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 8px 32px rgba(30, 58, 138, 0.08)'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {lang === 'en' ? 'NMPA Port Digital Clearance Single Window' : 'एनएमपीए पोर्ट डिजिटल क्लीयरेंस सिंगल विंडो'}
                    </h1>
                    <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.85rem', fontWeight: 600 }}>
                        {lang === 'en' 
                          ? 'New Mangalore Port Authority · National Maritime Single Window (NMSW) Portal, Government of India' 
                          : 'न्यू मंगलौर पोर्ट अथॉरिटी · राष्ट्रीय समुद्री एकल खिड़की (NMSW) पोर्टल, भारत सरकार'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="gov-badge" style={{ background: '#fff7ed', border: '1px solid #ffedd5', color: '#ea580c' }}>
                        {lang === 'en' ? 'Sagar Setu Enabled' : 'सागर सेतु सक्षम'}
                    </span>
                    <span className="gov-badge" style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a' }}>
                        {lang === 'en' ? 'Secure 2FA Active' : 'सुरक्षित 2FA सक्रिय'}
                    </span>
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(30, 58, 138, 0.1)', color: 'var(--primary)' }}>
                        <Ship size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('registeredVessels')}</h3>
                        <p>{vessels.length}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', color: 'var(--success)' }}><TrendingUp size={20} /></div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent)' }}>
                        <Activity size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('activeJourneys')}</h3>
                        <p>{pendingCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--success)' }}>
                        <Anchor size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>{t('totalClearances')}</h3>
                        <p>{clearedCount}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Clearance Progress */}
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

                    {/* Interactive Berthing Grid Map */}
                    <div className="panel">
                        <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Anchor size={20} style={{ color: 'var(--primary)' }} />
                                <span>{berthMapTitle}</span>
                            </h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 600 }}>
                                {clickBerthMsg}
                            </p>
                        </div>
                        <div className="berth-grid">
                            {populatedBerths.map(berth => (
                                <div 
                                    key={berth.id} 
                                    className={`berth-card ${berth.occupied ? 'occupied' : 'available'}`}
                                    onClick={() => setSelectedBerth(berth)}
                                >
                                    <span className="berth-num">{berth.name.split(' ')[0]} {berth.id}</span>
                                    <div className="berth-status" style={{ color: berth.occupied ? 'var(--primary)' : 'var(--success)' }}>
                                        {berth.occupied ? (lang === 'en' ? 'Occupied' : 'occupied') : (lang === 'en' ? 'Available' : 'available')}
                                    </div>
                                    <div className="berth-vessel" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                        {berth.occupied ? berth.vessel : '---'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Live Weather & Tide Advisory Panel */}
                    <div className="panel">
                        <h3 style={{ marginBottom: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sun size={20} style={{ color: 'var(--secondary)' }} />
                            <span>{weatherTitle}</span>
                        </h3>
                        <div className="weather-widget">
                            <div className="weather-header">
                                <div className="weather-main">
                                    <Sun size={38} style={{ color: 'var(--secondary)', filter: 'drop-shadow(0 0 6px rgba(255,153,51,0.3))' }} />
                                    <span className="weather-temp">31°C</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Compass size={14} /> NMPA Area
                                </div>
                            </div>
                            
                            <div className="weather-details">
                                <div className="weather-item">
                                    <div className="weather-item-title">{lang === 'en' ? 'Wind Speed' : 'पवन गति'}</div>
                                    <div className="weather-item-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Wind size={12} /> 12 Knots
                                    </div>
                                </div>
                                <div className="weather-item">
                                    <div className="weather-item-title">{lang === 'en' ? 'Visibility' : 'दृश्यता'}</div>
                                    <div className="weather-item-value">8 NM (Good)</div>
                                </div>
                            </div>

                            <div style={{ padding: '0.75rem', background: 'rgba(30, 58, 138, 0.03)', border: '1px solid var(--glass-border)', borderRadius: '0.75rem', fontSize: '0.75rem' }}>
                                <div style={{ fontWeight: 800, marginBottom: '2px', color: 'var(--primary)' }}>{tideLabel}</div>
                                <div style={{ fontWeight: 600 }}>High Tide: 3.2m at 14:15</div>
                                <div style={{ fontWeight: 600 }}>Low Tide: 0.9m at 20:45</div>
                            </div>

                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{advisoryLabel}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--success)', marginTop: '2px' }}>
                                    {statusText}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Summary */}
                    <div className="panel">
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: 800, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                            {t('systemSummary')}
                        </h3>
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

            {/* Port Analytics and Performance Charts */}
            <div className="panel" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
                    <span>{lang === 'en' ? 'Port Analytics & Volume Performance' : 'पोर्ट विश्लेषण और मात्रा प्रदर्शन'}</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'en' ? 'Cargo Volume Distribution' : 'कार्गो मात्रा वितरण'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <svg width="180" height="180" viewBox="0 0 220 220">
                                <circle cx="110" cy="110" r="70" stroke="var(--primary)" strokeWidth="20" strokeDasharray="198 440" strokeDashoffset="0" fill="transparent" />
                                <circle cx="110" cy="110" r="70" stroke="var(--secondary)" strokeWidth="20" strokeDasharray="132 440" strokeDashoffset="-198" fill="transparent" />
                                <circle cx="110" cy="110" r="70" stroke="var(--success)" strokeWidth="20" strokeDasharray="110 440" strokeDashoffset="-330" fill="transparent" />
                                <circle cx="110" cy="110" r="55" fill="var(--user-profile-bg)" />
                                <text x="110" y="105" textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--text-main)', fontSize: '0.72rem', fontWeight: 800 }}>
                                    {lang === 'en' ? 'TOTAL CARGO' : 'कुल कार्गो'}
                                </text>
                                <text x="110" y="125" textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                                    45.2M T
                                </text>
                            </svg>
                            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '130px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)', display: 'inline-block' }}></span>
                                    <span>Liquid Cargo (45%)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--secondary)', display: 'inline-block' }}></span>
                                    <span>Containers (30%)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)', display: 'inline-block' }}></span>
                                    <span>Bulk Cargo (25%)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {lang === 'en' ? 'Average Departmental Clearance Duration' : 'औसत विभागीय निकासी अवधि'}
                        </h4>
                        <svg width="100%" height="180" viewBox="0 0 300 220" style={{ maxWidth: '320px', margin: '0 auto' }}>
                            <line x1="40" y1="40" x2="280" y2="40" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                            <line x1="40" y1="90" x2="280" y2="90" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                            <line x1="40" y1="140" x2="280" y2="140" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
                            <line x1="40" y1="190" x2="280" y2="190" stroke="var(--text-muted)" strokeWidth="1" />

                            <text x="30" y="40" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>3.0h</text>
                            <text x="30" y="90" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>1.5h</text>
                            <text x="30" y="140" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>0.5h</text>
                            <text x="30" y="190" textAnchor="end" dominantBaseline="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>0.0h</text>

                            <rect x="65" y="130" width="30" height="60" rx="4" fill="var(--primary)" style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
                            <text x="80" y="120" textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: '0.65rem', fontWeight: 800 }}>1.2h</text>
                            <text x="80" y="205" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>PHO</text>

                            <rect x="135" y="85" width="30" height="105" rx="4" fill="var(--secondary)" style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
                            <text x="150" y="75" textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: '0.65rem', fontWeight: 800 }}>2.1h</text>
                            <text x="150" y="205" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>{lang === 'en' ? 'Customs' : 'सीमा शुल्क'}</text>

                            <rect x="205" y="145" width="30" height="45" rx="4" fill="var(--success)" style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} />
                            <text x="220" y="135" textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: '0.65rem', fontWeight: 800 }}>0.9h</text>
                            <text x="220" y="205" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>{lang === 'en' ? 'Traffic' : 'यातायात'}</text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Berth Inspection Modal Overlay */}
            {selectedBerth && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(9, 13, 22, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    animation: 'fadeIn 0.25s ease-out'
                }} onClick={() => setSelectedBerth(null)}>
                    <div style={{
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: 'var(--glass-shadow)',
                        borderRadius: '1.5rem',
                        width: '450px',
                        padding: '2rem',
                        animation: 'chatbotEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                                <Compass size={22} />
                                <span>{lang === 'en' ? 'Berth Inspection' : 'बर्थ निरीक्षण'}</span>
                            </h3>
                            <button 
                                onClick={() => setSelectedBerth(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                            <div>
                                <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{lang === 'en' ? 'Berth Identity: ' : 'बर्थ पहचान: '}</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{selectedBerth.name}</span>
                            </div>
                            
                            {selectedBerth.occupied ? (
                                <>
                                    <div style={{ padding: '0.875rem', background: 'rgba(30, 58, 138, 0.04)', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <Ship size={16} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontWeight: 800 }}>{selectedBerth.vessel}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                            Flag State: {selectedBerth.flag} &nbsp;·&nbsp; Tonnage: {selectedBerth.grt} GRT
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>{lang === 'en' ? 'Voyage Status: ' : 'यात्रा स्थिति: '}</span>
                                        <span className="badge" style={{
                                            background: selectedBerth.status.includes('Cleared') ? 'rgba(22, 163, 74, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                            color: selectedBerth.status.includes('Cleared') ? 'var(--success)' : 'var(--accent)',
                                            marginLeft: '6px'
                                        }}>
                                            {selectedBerth.status}
                                        </span>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <Link 
                                            to="/workflow" 
                                            className="btn btn-primary" 
                                            style={{ textDecoration: 'none', width: '100%', fontSize: '0.85rem', padding: '0.75rem 1rem' }}
                                            onClick={() => setSelectedBerth(null)}
                                        >
                                            {lang === 'en' ? 'View Clearance Workflow' : 'निकासी वर्कफ़्लो देखें'}
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ padding: '1.25rem', background: 'rgba(22, 163, 74, 0.04)', border: '1px dashed var(--success)', borderRadius: '1rem', textAlign: 'center', color: 'var(--success)' }}>
                                        <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
                                        <div style={{ fontWeight: 800 }}>{lang === 'en' ? 'Berth is Available' : 'बर्थ उपलब्ध है'}</div>
                                        <div style={{ fontSize: '0.75rem', marginTop: '2px', opacity: 0.8 }}>{lang === 'en' ? 'Ready to accept incoming vessel traffic' : 'आने वाले पोत यातायात को स्वीकार करने के लिए तैयार'}</div>
                                    </div>
                                    <div style={{ marginTop: '1rem' }}>
                                        <Link 
                                            to="/workflow" 
                                            className="btn btn-primary" 
                                            style={{ textDecoration: 'none', width: '100%', fontSize: '0.85rem', padding: '0.75rem 1rem', background: 'linear-gradient(135deg, var(--success) 0%, #10b981 100%)', boxShadow: 'none' }}
                                            onClick={() => setSelectedBerth(null)}
                                        >
                                            {lang === 'en' ? 'File Voyage Entry for Berth' : 'बर्थ के लिए यात्रा प्रवेश दर्ज करें'}
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
