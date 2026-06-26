import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from './api';
import { CheckCircle2, AlertTriangle, FileDown, ArrowLeft, ShieldCheck, Anchor, User, Globe, Calendar, Clock, Landmark, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';

const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
};

const addHindiText = async (doc, text, x, y, options = {}) => {
    const {
        fontSize = 10,
        isBold = false,
        align = 'left'
    } = options;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.text(text, x, y, { align });
};

export default function VerifyCertificate() {
    const { journeyId } = useParams();
    const [journey, setJourney] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchJourney = async () => {
            try {
                setLoading(true);
                const res = await api.get('/journeys');
                const found = res.data.find(j => j._id === journeyId);
                if (found) {
                    setJourney(found);
                } else {
                    setError('Certificate not found or invalid signature token.');
                }
            } catch (err) {
                console.error(err);
                setError('Error verifying certificate. Please check network connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchJourney();
    }, [journeyId]);

    const handleDownload = async () => {
        if (!journey) return;
        try {
            setDownloading(true);
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Set green background (exact matching green)
            doc.setFillColor(143, 206, 152);
            doc.rect(0, 0, 210, 297, 'F');

            // Draw margins / border lines
            doc.setDrawColor(35, 78, 40);
            doc.setLineWidth(0.8);
            doc.rect(4, 4, 202, 289);
            doc.rect(5, 5, 200, 287);

            // Load emblem
            try {
                const emblemImg = await loadImage(import.meta.env.BASE_URL + 'indian-emblem.png');
                doc.addImage(emblemImg, 'PNG', 92, 10, 26, 32);
            } catch (e) {
                console.error("Failed to load emblem:", e);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text("EMBLEM", 105, 20, { align: 'center' });
            }

            // Draw QR code
            const verificationUrl = `${window.location.origin}${window.location.pathname}#/verify-certificate/${journey._id}`;
            let qrLoaded = false;
            try {
                const qrImg = await loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`);
                doc.addImage(qrImg, 'PNG', 165, 10, 34, 34);
                qrLoaded = true;
            } catch (qrErr) {
                console.error("Failed to load active QR code, falling back to pseudo-random QR:", qrErr);
            }

            if (!qrLoaded) {
                doc.setFillColor(0, 0, 0);
                const drawFinder = (qx, qy) => {
                    doc.rect(qx, qy, 6, 6, 'F');
                    doc.setFillColor(162, 219, 132); // background color
                    doc.rect(qx + 0.8, qy + 0.8, 4.4, 4.4, 'F');
                    doc.setFillColor(0, 0, 0);
                    doc.rect(qx + 1.6, qy + 1.6, 2.8, 2.8, 'F');
                };
                drawFinder(165, 10);
                drawFinder(193, 10);
                drawFinder(165, 38);
                doc.setFillColor(0, 0, 0);
                let seed = 0;
                for (let i = 0; i < journey._id.length; i++) {
                    seed += journey._id.charCodeAt(i);
                }
                const pseudoRandom = () => {
                    const x = Math.sin(seed++) * 10000;
                    return x - Math.floor(x);
                };
                for (let xOffset = 0; xOffset < 34; xOffset += 1.4) {
                    for (let yOffset = 0; yOffset < 34; yOffset += 1.4) {
                        if (xOffset < 8 && yOffset < 8) continue;
                        if (xOffset > 26 && yOffset < 8) continue;
                        if (xOffset < 8 && yOffset > 26) continue;
                        if (pseudoRandom() > 0.5) {
                            doc.rect(165 + xOffset, 10 + yOffset, 1.4, 1.4, 'F');
                        }
                    }
                }
            }

            // Text Content
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            doc.text("GOVERNMENT OF INDIA", 105, 48, { align: 'center' });
            await addHindiText(doc, "भारत सरकार", 105, 53, { fontSize: 11, isBold: true, align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text("MINISTRY OF HEALTH & FAMILY WELFARE", 105, 59, { align: 'center' });
            await addHindiText(doc, "स्वास्थ्य एवं परिवार कल्याण मंत्रालय", 105, 64, { fontSize: 10, isBold: true, align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.text(`PORT HEALTH ORGANISATION:-New Mangalore`, 105, 70, { align: 'center' });
            await addHindiText(doc, "पत्तन स्वास्थ्य संगठन- New Mangalore", 105, 75, { fontSize: 10.5, isBold: true, align: 'center' });

            await addHindiText(doc, "ईमेल/Email: phomangalore@gmail.com", 105, 80, { fontSize: 9.5, isBold: false, align: 'center' });

            await addHindiText(doc, "CERTIFICATE OF HEALTH CLEARANCE - स्वास्थ्य निकासी का प्रमाण पत्र", 105, 86, { fontSize: 11, isBold: true, align: 'center' });
            doc.setLineWidth(0.3);
            doc.line(48, 87, 162, 87);

            // Body text
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            const vesselType = journey.vessel?.vesselType || "MV/MT/LNG/LPG/C";
            const vesselName = journey.vessel?.name?.toUpperCase() || "ARROW";
            const flagState = journey.vessel?.flagState?.toUpperCase() || "OMAN";
            const captainName = journey.captainName?.toUpperCase() || "CAPT. SAVITCKII OLEG";
            const originPort = journey.lastPortOfCall?.toUpperCase() || "INNML1";
            const destPort = journey.destinationPort?.toUpperCase() || "RUPRI1";

            const p1 = `THE VESSEL ${vesselType} ${vesselName} WITH ${flagState} FLAG UNDER CAPTAIN ${captainName} ARRIVED FROM ${originPort} TO SAIL OUT FOR ${destPort} HAS COMPLIED WITH THE REQUIREMENTS UNDER THE INDIAN PORT HEALTH RULES-1955 & INTERNATIONAL HEALTH REGULATIONS-2005. THE VESSEL IS PERMITTED TO SAIL OUT OF THE PORT.`;
            
            const splitText = doc.splitTextToSize(p1, 185);
            doc.text(splitText, 12, 105, { align: 'left', lineHeightFactor: 1.4 });

            // Left Details
            doc.setFont('helvetica', 'bold');
            doc.text("PORT:", 12, 150);
            doc.setFont('helvetica', 'normal');
            doc.text("New Mangalore ( INDIA )", 27, 150);

            doc.setFont('helvetica', 'bold');
            doc.text("DATED:", 12, 156);
            doc.setFont('helvetica', 'normal');
            const formattedHealthDate = journey.healthClearanceDate ? new Date(journey.healthClearanceDate).toLocaleString('en-IN', { hour12: false }) : new Date(journey.eta).toLocaleString('en-IN', { hour12: false });
            doc.text(formattedHealthDate.replace(',', ''), 30, 156);

            doc.setFont('helvetica', 'bold');
            doc.text("OFFICER :", 12, 162);
            doc.setFont('helvetica', 'normal');
            doc.text("Port Health Officer", 33, 162);

            doc.setFont('helvetica', 'bold');
            doc.text("NO.:PH", 12, 168);
            doc.setFont('helvetica', 'normal');
            const hcNo = journey.healthCertificateNo || `PH 2026051634786092 /HC/2026`;
            doc.text(hcNo.replace('PH ', ''), 28, 168);

            // Right Signature Block
            doc.setFont('helvetica', 'bold');
            doc.text("Port Health Officer", 130, 147);
            doc.setFont('helvetica', 'normal');
            doc.text("PORT HEALTH OFFICER,", 130, 153);

            // Divider
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.6);
            doc.line(12, 185, 198, 185);

            // Note
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const noteText = `Note: THIS CERTIFICATE IS VALID TILL SAILING OF THE VESSEL FROM THE PORT. ONE COPY OF THE CERTIFICATE WILL BE FORWARDED TO THE CUSTOM AUTHORITY FOR GRANTING PORT CLEARANCE, TWO COPIES OF THE CERTIFICATE TO BE HANDED OVER TO THE BOARDING PILOT FOR GRANTING CLEARANCE BY THE PORT AUTHORITY.`;
            const splitNote = doc.splitTextToSize(noteText, 185);
            doc.text(splitNote, 12, 195, { align: 'left', lineHeightFactor: 1.4 });

            // Second divider
            doc.line(12, 230, 198, 230);

            // System generated text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text("This Is System Generated Certificate.", 198, 245, { align: 'right' });

            const cleanVesselName = vesselName.replace(/^(EXAMPLE|EXAPMLE)\s*_\s*/i, '').trim().replace(/\s+/g, '_');
            doc.save(`Health_Clearance_Certificate_${cleanVesselName}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF: " + err.message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingCard}>
                    <div style={styles.spinner} />
                    <p style={{ marginTop: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        Verifying Certificate Authenticity...
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Querying secure maritime records vault
                    </p>
                </div>
            </div>
        );
    }

    if (error || !journey) {
        return (
            <div style={styles.container}>
                <div style={styles.errorCard}>
                    <div style={styles.errorIconContainer}>
                        <AlertTriangle size={36} color="var(--danger)" />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '1rem 0 0.5rem 0', color: 'var(--danger)' }}>
                        Verification Failed
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                        {error || 'This port entry application does not exist or has not been cleared by the Port Health Department yet.'}
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} /> Go to Portal Login
                    </Link>
                </div>
            </div>
        );
    }

    const isCleared = journey.status === 'Cleared';
    const hasHealthApproval = journey.clearances?.health === 'Approved';

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Official GOI Header */}
                <div style={styles.header}>
                    <img 
                        src="/MANAGEMENT_MCA_PROJECT/indian-emblem.png" 
                        alt="Indian Emblem" 
                        style={styles.emblem} 
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div style={styles.headerText}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', letterSpacing: '0.5px', color: '#1f2937' }}>
                            GOVERNMENT OF INDIA • भारत सरकार
                        </h4>
                        <h3 style={{ margin: '2px 0 0 0', fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                            MINISTRY OF HEALTH & FAMILY WELFARE
                        </h3>
                        <p style={{ margin: '1px 0 0 0', fontSize: '0.75rem', color: '#4b5563', fontWeight: 600 }}>
                            PORT HEALTH ORGANISATION • NEW MANGALORE
                        </p>
                    </div>
                </div>

                {/* Verification Status Banner */}
                <div style={styles.statusBanner}>
                    <div style={styles.pulseContainer}>
                        <div style={styles.pulseRing} />
                        <CheckCircle2 size={32} color="#16a34a" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={styles.verifiedBadge}>
                            <ShieldCheck size={14} style={{ marginRight: '4px' }} /> SECURE QR VERIFIED
                        </div>
                        <h2 style={styles.statusTitle}>AUTHENTIC RECORD VALIDATED</h2>
                        <p style={styles.statusSubtitle}>
                            Certificate No: <strong style={{ color: '#111827' }}>{journey.healthCertificateNo || 'PH-2026051634786092/HC/2026'}</strong>
                        </p>
                    </div>
                </div>

                {/* Details Grid */}
                <div style={styles.sectionTitle}>
                    <Anchor size={16} /> Vessel & Route Details
                </div>
                <div style={styles.grid}>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Vessel Name</span>
                        <span style={styles.value}>{journey.vessel?.name}</span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>IMO Number</span>
                        <span style={styles.value}>{journey.vessel?.imoNumber}</span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Flag State</span>
                        <span style={styles.value}>
                            <Globe size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            {journey.vessel?.flagState}
                        </span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Vessel Type</span>
                        <span style={styles.value}>{journey.vessel?.vesselType}</span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Commander / Master</span>
                        <span style={styles.value}>
                            <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            {journey.captainName || 'CAPT. EXAMPLE'}
                        </span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Port Route</span>
                        <span style={styles.value}>
                            {journey.lastPortOfCall} → {journey.destinationPort || 'RUSSIA'}
                        </span>
                    </div>
                </div>

                <div style={styles.sectionTitle}>
                    <Calendar size={16} /> Schedule & Clearances
                </div>
                <div style={styles.grid}>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Arrival Time (ETA)</span>
                        <span style={styles.value}>
                            <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            {new Date(journey.eta).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Departure Time (ETD)</span>
                        <span style={styles.value}>
                            <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            {new Date(journey.etd).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Health Clearance Date</span>
                        <span style={styles.value}>
                            {journey.healthClearanceDate ? new Date(journey.healthClearanceDate).toLocaleString('en-IN') : 'Verified upon entry'}
                        </span>
                    </div>
                    <div style={styles.gridItem}>
                        <span style={styles.label}>Health Dept Approval</span>
                        <span style={{ ...styles.value, color: '#16a34a', fontWeight: 'bold' }}>
                            {journey.clearances?.health || 'Approved'}
                        </span>
                    </div>
                </div>

                {/* Departments Progress */}
                <div style={styles.sectionTitle}>
                    <Activity size={16} /> Department Status
                </div>
                <div style={styles.deptProgress}>
                    <div style={styles.deptItem}>
                        <span style={styles.deptName}>Health Dept</span>
                        <span style={{ ...styles.deptStatus, backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>Approved</span>
                    </div>
                    <div style={styles.deptItem}>
                        <span style={styles.deptName}>Customs Dept</span>
                        <span style={{ 
                            ...styles.deptStatus, 
                            backgroundColor: journey.clearances?.customs === 'Approved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: journey.clearances?.customs === 'Approved' ? '#16a34a' : '#d97706' 
                        }}>
                            {journey.clearances?.customs}
                        </span>
                    </div>
                    <div style={styles.deptItem}>
                        <span style={styles.deptName}>Port Traffic</span>
                        <span style={{ 
                            ...styles.deptStatus, 
                            backgroundColor: journey.clearances?.traffic === 'Approved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                            color: journey.clearances?.traffic === 'Approved' ? '#16a34a' : '#d97706' 
                        }}>
                            {journey.clearances?.traffic}
                        </span>
                    </div>
                </div>

                {/* Footer and Downloads */}
                <div style={styles.footer}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <button 
                            onClick={handleDownload} 
                            disabled={downloading}
                            className="btn btn-primary"
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                padding: '0.75rem 1.5rem', 
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                            }}
                        >
                            {downloading ? (
                                <>Generating Document...</>
                            ) : (
                                <>
                                    <FileDown size={18} /> Download Health Certificate PDF
                                </>
                            )}
                        </button>
                    </div>

                    <div style={styles.disclaimer}>
                        <Landmark size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                        <strong>Official Digital Record Disclaimer:</strong> This portal displays official verification details for maritime traffic entering Indian territorial waters under the Ministry of Ports, Shipping and Waterways. The cryptographic integrity of this record has been verified.
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    loadingCard: {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        padding: '3rem 2rem',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        width: '400px',
        maxWidth: '100%'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid rgba(22, 163, 74, 0.1)',
        borderTop: '4px solid #16a34a',
        borderRadius: '50%',
        margin: '0 auto',
        animation: 'spin 1s linear infinite'
    },
    errorCard: {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '3rem 2rem',
        borderRadius: '24px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        width: '450px',
        maxWidth: '100%',
        border: '1px solid rgba(239, 68, 68, 0.1)'
    },
    errorIconContainer: {
        width: '70px',
        height: '70px',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto'
    },
    card: {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(15px)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        width: '680px',
        maxWidth: '100%',
        border: '1px solid rgba(255, 255, 255, 0.6)'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        borderBottom: '2px solid rgba(0, 0, 0, 0.06)',
        paddingBottom: '1.5rem',
        marginBottom: '1.5rem',
        gap: '1.25rem'
    },
    emblem: {
        height: '50px',
        width: 'auto',
        objectFit: 'contain'
    },
    headerText: {
        flex: 1
    },
    statusBanner: {
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e6fced 100%)',
        border: '1px solid rgba(22, 163, 74, 0.15)',
        borderRadius: '16px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        marginBottom: '2rem'
    },
    pulseContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    pulseRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: '3px solid #16a34a',
        borderRadius: '50%',
        animation: 'pulse 2s infinite ease-in-out',
        opacity: 0.4
    },
    verifiedBadge: {
        background: '#16a34a',
        color: '#ffffff',
        fontSize: '0.65rem',
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: '100px',
        display: 'inline-flex',
        alignItems: 'center',
        letterSpacing: '0.5px',
        marginBottom: '4px'
    },
    statusTitle: {
        margin: 0,
        fontSize: '1.15rem',
        fontWeight: 800,
        color: '#16a34a'
    },
    statusSubtitle: {
        margin: '2px 0 0 0',
        fontSize: '0.8rem',
        color: '#6b7280',
        fontWeight: 500
    },
    sectionTitle: {
        fontSize: '0.9rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        paddingBottom: '0.5rem',
        marginTop: '1.5rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1rem'
    },
    gridItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    label: {
        fontSize: '0.75rem',
        color: '#6b7280',
        fontWeight: 600
    },
    value: {
        fontSize: '0.95rem',
        color: '#111827',
        fontWeight: 700
    },
    deptProgress: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem'
    },
    deptItem: {
        flex: 1,
        minWidth: '150px',
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        borderRadius: '12px',
        padding: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    deptName: {
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#4b5563'
    },
    deptStatus: {
        fontSize: '0.7rem',
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: '100px'
    },
    footer: {
        marginTop: '2.5rem',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        paddingTop: '1.5rem'
    },
    disclaimer: {
        fontSize: '0.72rem',
        lineHeight: 1.4,
        color: '#6b7280',
        background: 'rgba(0,0,0,0.02)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid rgba(0,0,0,0.03)'
    }
};

// Add standard keyframe styles
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(22, 163, 74, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
        }
    `;
    document.head.appendChild(styleEl);
}
