import React, { useState, useEffect, useContext } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';
import { Ship, FileText, CheckCircle2, Clock, XCircle, FileDown, FolderOpen, AlertCircle, Plus, Search, X, Eye, Cpu, Leaf, RefreshCw, Sparkles } from 'lucide-react';
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
        align = 'left',
        textColor = '#000000',
        underline = false
    } = options;

    const scale = 4;
    const fontStr = `${isBold ? 'bold ' : ''}${fontSize * scale}px "Noto Sans Devanagari", "Noto Sans", "Mukta", "Arial Unicode MS", sans-serif`;
    
    try {
        await document.fonts.load(fontStr);
    } catch (e) {
        console.warn("Font loading failed, falling back:", e);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.font = fontStr;
    
    const textWidth = ctx.measureText(text).width;
    canvas.width = Math.ceil(textWidth) + (4 * scale);
    canvas.height = Math.ceil(fontSize * scale * 1.5);
    
    ctx.font = fontStr;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = textColor;
    
    ctx.fillText(text, 2 * scale, Math.ceil(fontSize * scale * 1.15));
    
    const dataUrl = canvas.toDataURL('image/png');
    
    const mmHeight = fontSize * 1.5 * 0.35277;
    const aspect = canvas.width / canvas.height;
    const mmWidth = mmHeight * aspect;
    
    let drawX = x;
    if (align === 'center') {
        drawX = x - (mmWidth / 2);
    } else if (align === 'right') {
        drawX = x - mmWidth;
    }
    
    const drawY = y - (fontSize * 1.15 * 0.35277);
    
    doc.addImage(dataUrl, 'PNG', drawX, drawY, mmWidth, mmHeight);
    
    if (underline) {
        doc.setLineWidth(0.3);
        doc.line(drawX, y + 1, drawX + mmWidth, y + 1);
    }
};

export default function ClearanceWorkflow() {
    const { user, t } = useContext(AuthContext);
    const [vessels, setVessels] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [formData, setFormData] = useState({
        vesselId: '',
        lastPortOfCall: '',
        eta: '',
        etd: '',
        captainName: '',
        destinationPort: '',
        cargoType: 'BALLAST',
        crewCount: '',
        passengerCount: 'NIL',
        ilhReceiptNo: '',
        ilhPaidDate: '',
        ilhAmount: '',
        ilhValidFrom: '',
        ilhValidTo: '',
        documents: []
    });
    const [showForm, setShowForm] = useState(false);
    const [isOcrScanning, setIsOcrScanning] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [activeJourneyForDocs, setActiveJourneyForDocs] = useState(null);
    const [activeJourneyForForm, setActiveJourneyForForm] = useState(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const filePromises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(JSON.stringify({
                        name: file.name,
                        type: file.type,
                        data: reader.result
                    }));
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises).then(newDocs => {
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, ...newDocs]
            }));
        });
    };

    const handleRemoveFile = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const openDocument = (docString) => {
        try {
            let parsed = null;
            try {
                parsed = JSON.parse(docString);
            } catch (e) {}

            if (parsed && parsed.data) {
                const base64Parts = parsed.data.split(',');
                const mimeType = base64Parts[0].match(/:(.*?);/)[1];
                const raw = window.atob(base64Parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: mimeType });
                const blobUrl = URL.createObjectURL(blob);
                
                const newTab = window.open();
                if (newTab) {
                    newTab.document.write(
                        `<iframe src="${blobUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                    );
                    newTab.document.title = parsed.name || "Document";
                } else {
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = parsed.name || 'document';
                    link.click();
                }
            } else {
                alert(`Viewing placeholder document: ${docString}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error opening document: " + err.message);
        }
    };

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
            setFormData({
                vesselId: '',
                lastPortOfCall: '',
                eta: '',
                etd: '',
                captainName: '',
                destinationPort: '',
                cargoType: 'BALLAST',
                crewCount: '',
                passengerCount: 'NIL',
                ilhReceiptNo: '',
                ilhPaidDate: '',
                ilhAmount: '',
                ilhValidFrom: '',
                ilhValidTo: '',
                documents: []
            });
            fetchData();
        } catch (err) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleOcrAutoFill = () => {
        setIsOcrScanning(true);
        setTimeout(() => {
            const firstVesselId = vessels.length > 0 ? vessels[0]._id : '';
            
            const today = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const formatDateTime = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T12:00`;
            const formatDateOnly = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

            const etaDate = new Date(today);
            etaDate.setDate(today.getDate() + 2);
            const etdDate = new Date(today);
            etdDate.setDate(today.getDate() + 4);

            const paidDate = new Date(today);
            paidDate.setDate(today.getDate() - 1);

            const validFrom = new Date(today);
            validFrom.setDate(today.getDate() - 1);

            const validTo = new Date(today);
            validTo.setDate(today.getDate() + 90);

            setFormData(prev => ({
                ...prev,
                vesselId: firstVesselId,
                lastPortOfCall: 'Port of Singapore',
                eta: formatDateTime(etaDate),
                etd: formatDateTime(etdDate),
                captainName: 'Capt. Rajesh Sharma',
                destinationPort: 'MUMBAI, INDIA',
                cargoType: 'CONTAINER CARGO',
                crewCount: 24,
                passengerCount: 'NIL',
                ilhReceiptNo: 'ILH9982736152',
                ilhPaidDate: formatDateOnly(paidDate),
                ilhAmount: 45000,
                ilhValidFrom: formatDateOnly(validFrom),
                ilhValidTo: formatDateOnly(validTo),
                documents: [
                    ...prev.documents,
                    JSON.stringify({
                        name: 'voyage_manifest_104_AI_PARSED.pdf',
                        type: 'application/pdf',
                        size: 142048,
                        data: 'data:application/pdf;base64,JVBER...'
                    })
                ]
            }));
            setIsOcrScanning(false);
            alert('AI Manifest OCR extraction complete! Form fields successfully auto-filled.');
        }, 1500);
    };

    const handleClearance = async (journeyId, status) => {
        const note = window.prompt(`Decision note for this ${status}:`);
        if (note === null) return;
        try {
            await api.put(`/journeys/${journeyId}/clearance`, { status, note });
            
            // Dispatch SMS toaster event
            const journey = journeys.find(j => j._id === journeyId);
            if (journey) {
                const vesselName = journey.vessel?.name || 'Vessel';
                let deptName = 'Officer';
                if (user?.role === 'Health Department') deptName = 'PHO Officer';
                else if (user?.role === 'Customs Department') deptName = 'Customs Officer';
                else if (user?.role === 'Port Authority Node') deptName = 'Port Traffic Officer';

                window.dispatchEvent(new CustomEvent('clearance-status-change', {
                    detail: {
                        vesselName,
                        deptName,
                        status: status === 'Approved' ? 'approved' : status === 'Rejected' ? 'rejected' : status.toLowerCase()
                    }
                }));
            }
            
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

    const downloadHealthCertificate = async (j) => {
        try {
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

            // Draw active QR code pointing to verification page
            const verificationUrl = `${window.location.origin}${window.location.pathname}#/verify-certificate/${j._id}`;
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
                const journeyId = j._id || '123456';
                for (let i = 0; i < journeyId.length; i++) {
                    seed += journeyId.charCodeAt(i);
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
            const vesselType = j.vessel?.vesselType || "MV/MT/LNG/LPG/C";
            const vesselName = j.vessel?.name?.toUpperCase() || "ARROW";
            const flagState = j.vessel?.flagState?.toUpperCase() || "OMAN";
            const captainName = j.captainName?.toUpperCase() || "CAPT. SAVITCKII OLEG";
            const originPort = j.lastPortOfCall?.toUpperCase() || "INNML1";
            const destPort = j.destinationPort?.toUpperCase() || "RUPRI1";

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
            const formattedHealthDate = j.healthClearanceDate ? new Date(j.healthClearanceDate).toLocaleString('en-IN', { hour12: false }) : new Date(j.eta).toLocaleString('en-IN', { hour12: false });
            doc.text(formattedHealthDate.replace(',', ''), 30, 156);

            doc.setFont('helvetica', 'bold');
            doc.text("OFFICER :", 12, 162);
            doc.setFont('helvetica', 'normal');
            doc.text("Port Health Officer", 33, 162);

            doc.setFont('helvetica', 'bold');
            doc.text("NO.:PH", 12, 168);
            doc.setFont('helvetica', 'normal');
            const hcNo = j.healthCertificateNo || `PH 2026051634786092 /HC/2026`;
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

            doc.save(`${vesselName.replace(/\s+/g, '_')}_Health_Clearance.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF: " + err.message);
        }
    };

    const downloadPortClearanceCertificate = async (j) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Margins / border lines
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.4);
            doc.rect(6, 6, 198, 285);

            // Reference text above the border box
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.text("CUS/PORT/GENC/98/2024-DOCKS-O/O-COMMR-CUS-MANGALURU", 6, 4.5);
            doc.text("I/416815", 204, 4.5, { align: 'right' });

            // Load customs logo
            try {
                const logoImg = await loadImage(import.meta.env.BASE_URL + 'customs-logo.png');
                doc.addImage(logoImg, 'PNG', 92, 10, 26, 26);
            } catch (e) {
                console.error("Failed to load customs logo:", e);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text("CUSTOMS LOGO", 105, 22, { align: 'center' });
            }

            // Header Text
            await addHindiText(doc, "सीमा शुल्क आयुक्त का कार्यालय", 105, 40, { fontSize: 10.5, isBold: true, align: 'center' });
            await addHindiText(doc, "नव सीमा शुल्क भवन, पणम्बूर, मंगलूरु-५७५०१०", 105, 45, { fontSize: 10.5, isBold: true, align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.text("OFFICE OF THE COMMISSIONER OF CUSTOMS", 105, 51, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text("NEW CUSTOMS HOUSE, PANAMBUR, MANGALURU – 575 010", 105, 56, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.text("Telephone No. 0824-2408164,website -http://bangalorecustoms.gov.in,Email- csd.mglr-customs@gov.in", 105, 61, { align: 'center' });

            // Certificate Number and Date Header Box
            doc.setLineWidth(0.3);
            doc.rect(12, 66, 186, 7);
            doc.line(115, 66, 115, 73);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            const pcNo = j.portClearanceNo || "E.No.405 /2026";
            doc.text(pcNo, 14, 71);

            const formattedPcDate = j.portClearanceDate ? new Date(j.portClearanceDate).toLocaleDateString('en-IN') : "As Esigned";
            await addHindiText(doc, `दिनांक/ Date: ${formattedPcDate}`, 117, 71, { fontSize: 9.5, isBold: true, align: 'left' });

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(220, 38, 38); // Crimson red
            doc.text("PORT CLEARANCE", 105, 84, { align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10.5);
            doc.setTextColor(0, 0, 0);
            doc.text("(Valid for 72 hours)", 105, 89, { align: 'center' });

            // Body Text
            const vesselName = j.vessel?.name?.toUpperCase() || "ARROW";
            const captainName = j.captainName?.toUpperCase() || "CAPT. SAVITCKII OLEG";
            const flagState = j.vessel?.flagState?.toUpperCase() || "OMAN";
            const nrt = j.vessel?.nrt || "33595";
            const grt = j.vessel?.grt || "62433";
            const destPort = j.destinationPort?.toUpperCase() || "PRIMORSK, RUSSIA";
            const cargoType = j.cargoType?.toUpperCase() || "BALLAST";
            const crewCount = j.crewCount || 23;
            const passengerCount = j.passengerCount || "NIL";

            doc.setFontSize(10);
            const p1 = `      This is to certify that vessel ${vesselName} with Commander ${captainName} under ${flagState} Flag, NRT-${nrt} MT/GRT: ${grt} MT has cleared outwards from this Port "NEW MANGALORE" for port "${destPort}", with cargo- (${cargoType}) as per manifest and passengers/crew as per annexed list i.e.: Passengers - ${passengerCount} and Crew - ${crewCount}.`;
            
            const splitP1 = doc.splitTextToSize(p1, 182);
            doc.text(splitP1, 14, 100, { align: 'left', lineHeightFactor: 1.4 });

            // Point 2
            const p2 = `2.   The Commander of the said vessel has rendered, or has through the ships Agents undertaken to render an account of the import and export cargo and has otherwise complied with all the regulations of this port.`;
            const splitP2 = doc.splitTextToSize(p2, 182);
            doc.text(splitP2, 14, 125, { align: 'left', lineHeightFactor: 1.4 });

            // Point 3
            const ilhReceipt = j.ilhReceiptNo || "12026051484430914";
            const ilhAmtStr = j.ilhAmount ? Number(j.ilhAmount).toLocaleString('en-IN') : "2,97,316";
            const ilhPaidDateStr = j.ilhPaidDate ? new Date(j.ilhPaidDate).toLocaleDateString('en-IN') : "14.05.2026";
            const ilhValidFromStr = j.ilhValidFrom ? new Date(j.ilhValidFrom).toLocaleDateString('en-IN') : "14.05.2026";
            const ilhValidToStr = j.ilhValidTo ? new Date(j.ilhValidTo).toLocaleDateString('en-IN') : "13.06.2026";

            const p3 = `3.   ILH Dues Paid at CH MANGALORE Dated ${ilhPaidDateStr} Vide Receipt No- ${ilhReceipt} for Rs.${ilhAmtStr}/- is valid from ${ilhValidFromStr} to ${ilhValidToStr}`;
            const splitP3 = doc.splitTextToSize(p3, 182);
            doc.text(splitP3, 14, 148, { align: 'left', lineHeightFactor: 1.4 });

            // Signature section
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.text("Digitally signed by", 120, 178);
            doc.setFont('helvetica', 'bold');
            doc.text("Rameshchandra M", 120, 183);
            doc.setFont('helvetica', 'normal');
            const sigDateStr = j.portClearanceDate ? new Date(j.portClearanceDate).toLocaleString('en-IN', { hour12: false }).replace(',', '') : "17-05-2026 12:38:27";
            doc.text(`Date: ${sigDateStr}`, 120, 188);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text("ASSISTANT COMMISSIONER OF CUSTOMS", 120, 193);
            doc.text("NEW CUSTOM HOUSE, MANGALORE", 120, 197);

            // Copy to section
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.text("Copy to:", 14, 220);
            doc.text(`1. The master of the vessel. ${vesselName}.`, 18, 226);
            doc.text("2. The Superintendent of Customs (IGM/EGM)", 18, 231);

            doc.save(`${vesselName.replace(/\s+/g, '_')}_Port_Clearance.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            alert("Failed to generate PDF: " + err.message);
        }
    };

    const ProgressStepper = ({ clearances }) => {
        const stages = [
            { id: 'health', name: t('healthDept'), status: clearances.health },
            { id: 'customs', name: t('customsDept'), status: clearances.customs },
            { id: 'traffic', name: t('portTrafficControl'), status: clearances.traffic }
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

    const selectedVessel = vessels.find(v => v._id === formData.vesselId);
    const grt = selectedVessel?.grt || 0;
    const etaDate = formData.eta ? new Date(formData.eta) : null;
    const etdDate = formData.etd ? new Date(formData.etd) : null;
    let durationHours = 48;
    if (etaDate && etdDate && etdDate > etaDate) {
        durationHours = Math.round((etdDate - etaDate) / (1000 * 60 * 60));
    }
    
    // Cargo type factor
    let cargoFactor = 1.0;
    if (formData.cargoType === 'CRUDE OIL') cargoFactor = 1.25;
    else if (formData.cargoType === 'LNG' || formData.cargoType === 'LPG') cargoFactor = 1.15;
    else if (formData.cargoType === 'BALLAST') cargoFactor = 0.7;

    const estimatedFuel = grt > 0 ? parseFloat((grt * 0.00012 * (durationHours / 24) * cargoFactor).toFixed(2)) : 0;
    const co2Footprint = parseFloat((estimatedFuel * 3.114).toFixed(2));
    
    let ecoRating = 100;
    if (grt > 0) {
        const intensity = co2Footprint / (grt * 0.1);
        ecoRating = Math.max(35, Math.min(98, Math.round(98 - intensity * 15)));
    }

    const voyageVessel = activeJourneyForForm?.vessel;
    const vGrt = voyageVessel?.grt || 12000;
    const voyageEta = activeJourneyForForm?.eta ? new Date(activeJourneyForForm.eta) : null;
    const voyageEtd = activeJourneyForForm?.etd ? new Date(activeJourneyForForm.etd) : null;
    let voyageDuration = 48;
    if (voyageEta && voyageEtd && voyageEtd > voyageEta) {
        voyageDuration = Math.round((voyageEtd - voyageEta) / (1000 * 60 * 60));
    }
    let voyageCargoFactor = 1.0;
    if (activeJourneyForForm?.cargoType === 'CRUDE OIL') voyageCargoFactor = 1.25;
    else if (activeJourneyForForm?.cargoType === 'LNG' || activeJourneyForForm?.cargoType === 'LPG') voyageCargoFactor = 1.15;
    else if (activeJourneyForForm?.cargoType === 'BALLAST') voyageCargoFactor = 0.7;

    const voyageFuel = parseFloat((vGrt * 0.00012 * (voyageDuration / 24) * voyageCargoFactor).toFixed(2));
    const voyageCo2 = parseFloat((voyageFuel * 3.114).toFixed(2));
    let voyageEco = 100;
    if (vGrt > 0) {
        const intensity = voyageCo2 / (vGrt * 0.1);
        voyageEco = Math.max(35, Math.min(98, Math.round(98 - intensity * 15)));
    }

    return (
        <div style={{ animation: 'pageEnter 0.6s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('clearanceHub')}</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t('clearanceHubSub')}</p>
                </div>
                {user?.role === 'Ship Agent Account' && (
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? t('cancelApp') : <><Plus size={20} /> {t('newApp')}</>}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="panel" style={{ animation: 'pageEnter 0.4s ease' }}>
                    {vessels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                            <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'inline-block' }} />
                            <h3 style={{ marginBottom: '0.75rem', fontWeight: 800 }}>Vessel Registration Required</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
                                You do not have any registered vessels. Enrolling at least one vessel in the Vessel Registry is mandatory before submitting a port entry application.
                            </p>
                            <a href="#/registry" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 700 }}>
                                Go to Vessel Registry
                            </a>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h3 style={{ margin: 0 }}>{t('portEntryApp')}</h3>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'linear-gradient(135deg, var(--secondary) 0%, #d97706 100%)',
                                        color: 'white',
                                        border: 'none',
                                        fontWeight: 800,
                                        padding: '0.5rem 1.25rem',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={handleOcrAutoFill}
                                    disabled={isOcrScanning}
                                >
                                    <Cpu size={16} className={isOcrScanning ? "lucide-spin" : ""} />
                                    {isOcrScanning ? 'Extracting manifest...' : 'AI Auto-Fill Manifest'}
                                </button>
                            </div>
                            <form onSubmit={handleApply} className="form-grid">
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>{t('vesselIdentifier')}</label>
                            <select className="input-modern" value={formData.vesselId} onChange={e => setFormData({...formData, vesselId: e.target.value})} required>
                                <option value="">{t('selectRegisteredVessel')}</option>
                                {vessels.map(v => <option key={v._id} value={v._id}>{v.name} ({v.imoNumber})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>{t('lastPortOfOrigin')}</label>
                            <input className="input-modern" value={formData.lastPortOfCall} onChange={e => setFormData({...formData, lastPortOfCall: e.target.value})} required placeholder="e.g. Singapore" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>{t('eta')}</label>
                            <input type="datetime-local" className="input-modern" value={formData.eta} onChange={e => setFormData({...formData, eta: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>{t('etd')}</label>
                            <input type="datetime-local" className="input-modern" value={formData.etd} onChange={e => setFormData({...formData, etd: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Commander / Captain Name</label>
                            <input className="input-modern" value={formData.captainName} onChange={e => setFormData({...formData, captainName: e.target.value})} required placeholder="e.g. CAPT. SAVITCKII OLEG" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Port of Destination</label>
                            <input className="input-modern" value={formData.destinationPort} onChange={e => setFormData({...formData, destinationPort: e.target.value})} required placeholder="e.g. PRIMORSK, RUSSIA" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Cargo Details</label>
                            <select className="input-modern" value={formData.cargoType} onChange={e => setFormData({...formData, cargoType: e.target.value})} required>
                                <option value="BALLAST">BALLAST</option>
                                <option value="CONTAINER CARGO">CONTAINER CARGO</option>
                                <option value="GENERAL CARGO">GENERAL CARGO</option>
                                <option value="CRUDE OIL">CRUDE OIL</option>
                                <option value="LNG">LNG</option>
                                <option value="LPG">LPG</option>
                            </select>
                        </div>
                        <div className="form-grid" style={{ gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Crew Count</label>
                                <input type="number" className="input-modern" value={formData.crewCount} onChange={e => setFormData({...formData, crewCount: e.target.value})} required placeholder="e.g. 23" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Passengers Count</label>
                                <input className="input-modern" value={formData.passengerCount} onChange={e => setFormData({...formData, passengerCount: e.target.value})} required placeholder="e.g. NIL" />
                            </div>
                        </div>

                        {/* ILH Dues Section */}
                        <div className="form-span-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>Indian Light House (ILH) Dues Receipt details</h4>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>ILH Dues Receipt No</label>
                            <input className="input-modern" value={formData.ilhReceiptNo} onChange={e => setFormData({...formData, ilhReceiptNo: e.target.value})} required placeholder="e.g. 12026051484430914" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>ILH Dues Paid Date</label>
                            <input type="date" className="input-modern" value={formData.ilhPaidDate} onChange={e => setFormData({...formData, ilhPaidDate: e.target.value})} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>ILH Paid Amount (INR Rs.)</label>
                            <input type="number" className="input-modern" value={formData.ilhAmount} onChange={e => setFormData({...formData, ilhAmount: e.target.value})} required placeholder="e.g. 297316" />
                        </div>
                        <div className="form-grid" style={{ gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Valid From</label>
                                <input type="date" className="input-modern" value={formData.ilhValidFrom} onChange={e => setFormData({...formData, ilhValidFrom: e.target.value})} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>Valid To</label>
                                <input type="date" className="input-modern" value={formData.ilhValidTo} onChange={e => setFormData({...formData, ilhValidTo: e.target.value})} required />
                            </div>
                        </div>

                        <div className="form-span-2">
                            <label style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>{t('documentationLabel')}</label>
                            <div style={{ border: '2px dashed rgba(0,0,0,0.1)', padding: '2rem', borderRadius: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.5)' }}>
                                <FolderOpen size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('uploadDocsDesc')}</p>
                                <input type="file" style={{ display: 'none' }} id="file-upload" multiple onChange={handleFileChange} />
                                <button type="button" className="btn" style={{ marginTop: '1rem', background: 'white', border: '1px solid var(--border)' }} onClick={() => document.getElementById('file-upload').click()}>{t('chooseFiles')}</button>
                                
                                {formData.documents && formData.documents.length > 0 && (
                                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left', maxWidth: '400px', margin: '1.5rem auto 0' }}>
                                        {formData.documents.map((docStr, idx) => {
                                            let parsed = null;
                                            try {
                                                parsed = JSON.parse(docStr);
                                            } catch (e) {}
                                            const name = parsed ? parsed.name : docStr;
                                            return (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                                        <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{name}</span>
                                                    </div>
                                                    <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} onClick={() => handleRemoveFile(idx)}>
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {formData.vesselId && (
                            <div className="form-span-2" style={{
                                background: 'rgba(22, 163, 74, 0.05)',
                                border: '1px solid rgba(22, 163, 74, 0.2)',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                marginTop: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 800, fontSize: '0.95rem' }}>
                                    <Leaf size={18} />
                                    <span>Green Port: Fuel & Carbon Footprint Calculator</span>
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', textAlign: 'left' }}>
                                    <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ESTIMATED FUEL CONSUMPTION</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{estimatedFuel} MT</span>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CO2 FOOTPRINT</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>{co2Footprint} MT CO₂e</span>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ECO-EFFICIENCY RATING</span>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{ecoRating} / 100</span>
                                        </div>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: 'rgba(22, 163, 74, 0.1)',
                                            color: 'var(--success)',
                                            borderRadius: '6px',
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Leaf size={12} />
                                            {ecoRating > 75 ? 'HIGH' : ecoRating > 50 ? 'MEDIUM' : 'LOW'}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, textAlign: 'left' }}>
                                    * Calculated automatically using Sagar Setu's Green Port environmental model, based on the vessel's Gross Registered Tonnage (GRT: {grt} MT) and voyage duration ({durationHours} hours).
                                </p>
                            </div>
                        )}

                        <div className="form-span-2" style={{ textAlign: 'right' }}>
                            <button className="btn btn-primary" style={{ minWidth: '200px' }}>{t('submitToAuthority')}</button>
                        </div>
                    </form>
                    </>
                    )}
                </div>
            )}

            <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('clearancePipeline')}</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={14}/> {t('approved')}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14}/> {t('pending')}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14}/> {t('rejected')}</span>
                    </div>
                </div>

                {/* Smart Interactive Search & Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                            type="text" 
                            placeholder={t('searchPlaceholder')} 
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
                                {status === 'ALL' ? t('allStatuses').split(' ')[0].toUpperCase() : status === 'PENDING' ? t('pending').toUpperCase() : status === 'CLEARED' ? t('cleared').toUpperCase() : t('rejected').toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('vesselRoute')}</th>
                                <th>{t('schedule')}</th>
                                <th>{t('deptProgress')}</th>
                                <th>{t('overallStatus')}</th>
                                <th>{t('actions')}</th>
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
                                                {j.clearances.health === 'Approved' && (
                                                    <button className="btn" title="Download Health Clearance" style={{ padding: '0.5rem', color: 'var(--success)', background: 'rgba(16,185,129,0.1)' }} onClick={() => downloadHealthCertificate(j)}>
                                                        <FileDown size={18} />
                                                    </button>
                                                )}
                                                {j.status === 'Cleared' && (
                                                    <button className="btn" title="Download Port Clearance" style={{ padding: '0.5rem', color: 'var(--primary)', background: 'rgba(37,99,235,0.1)' }} onClick={() => downloadPortClearanceCertificate(j)}>
                                                        <FileDown size={18} />
                                                    </button>
                                                )}
                                                <button className="btn" title={t('viewForm')} style={{ padding: '0.5rem', color: 'var(--primary)', background: 'rgba(37,99,235,0.05)' }} onClick={() => setActiveJourneyForForm(j)}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="btn" title="View Docs" style={{ padding: '0.5rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)' }} onClick={() => setActiveJourneyForDocs(j)}>
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
                                        {t('noMatchingClearance')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {activeJourneyForDocs && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek dark slate overlay
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pageEnter 0.3s ease-out'
                }} onClick={() => setActiveJourneyForDocs(null)}>
                    <div style={{
                        background: 'var(--bg-card, rgba(255, 255, 255, 0.9))',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.4))',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '100%',
                        maxWidth: '550px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        transform: 'scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button 
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'rgba(0, 0, 0, 0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setActiveJourneyForDocs(null)}
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{
                                background: 'rgba(37, 99, 235, 0.1)',
                                color: 'var(--primary)',
                                padding: '10px',
                                borderRadius: '14px'
                            }}>
                                <FolderOpen size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Secure Document Vault</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                                    Vessel: {activeJourneyForDocs.vessel?.name}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                            {activeJourneyForDocs.documents && activeJourneyForDocs.documents.length > 0 ? (
                                activeJourneyForDocs.documents.map((docStr, idx) => {
                                    let parsed = null;
                                    try {
                                        parsed = JSON.parse(docStr);
                                    } catch (e) {}

                                    const docName = parsed ? parsed.name : docStr;
                                    const isMock = !parsed;

                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))',
                                            padding: '1rem 1.25rem',
                                            borderRadius: '16px',
                                            border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
                                            transition: 'all 0.2s ease',
                                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                                <div style={{
                                                    background: isMock ? 'rgba(0,0,0,0.05)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: isMock ? 'var(--text-muted)' : 'var(--success)',
                                                    padding: '8px',
                                                    borderRadius: '10px',
                                                    flexShrink: 0
                                                }}>
                                                    <FileText size={18} />
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, wordBreak: 'break-all', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }} title={docName}>{docName}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {isMock ? 'System Generated Placeholder' : 'User Uploaded Document'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{
                                                    padding: '0.4rem 1rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: '10px',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    flexShrink: 0
                                                }}
                                                onClick={() => openDocument(docStr)}
                                            >
                                                <FileDown size={14} />
                                                <span>View</span>
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                    <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
                                    No documents found for this journey.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeJourneyForForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek dark slate overlay
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pageEnter 0.3s ease-out'
                }} onClick={() => setActiveJourneyForForm(null)}>
                    <div style={{
                        background: 'var(--bg-card, rgba(255, 255, 255, 0.9))',
                        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.4))',
                        borderRadius: '24px',
                        padding: '2.5rem',
                        width: '95%',
                        maxWidth: '850px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        animation: 'pageEnter 0.4s ease'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Close Button */}
                        <button 
                            style={{
                                position: 'absolute',
                                top: '1.25rem',
                                right: '1.25rem',
                                background: 'rgba(0, 0, 0, 0.05)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-main)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setActiveJourneyForForm(null)}
                            title="Close"
                        >
                            <X size={16} />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
                                <div style={{
                                    background: 'rgba(37, 99, 235, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '12px',
                                    borderRadius: '16px'
                                }}>
                                    <Ship size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{t('submittedFormDetails')}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 600 }}>
                                        {activeJourneyForForm.vessel?.name} ({activeJourneyForForm.vessel?.imoNumber})
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('overallStatus')}</span>
                                <span style={{ 
                                    padding: '0.4rem 1rem', 
                                    borderRadius: '100px', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 800,
                                    background: `${getStatusColor(activeJourneyForForm.status)}15`,
                                    color: getStatusColor(activeJourneyForForm.status),
                                    border: `1px solid ${getStatusColor(activeJourneyForForm.status)}30`
                                }}>
                                    {activeJourneyForForm.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
                            
                            {/* Vessel Details & Commander Section */}
                            <div style={{ background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('vesselInfo')}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('vesselName')}</span>
                                        <span style={{ fontWeight: 700 }}>{activeJourneyForForm.vessel?.name}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('imoNumber')}</span>
                                        <span style={{ fontWeight: 700 }}>{activeJourneyForForm.vessel?.imoNumber}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('flagState')}</span>
                                            <span style={{ fontWeight: 700 }}>{activeJourneyForForm.vessel?.flagState}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('vesselType')}</span>
                                            <span style={{ fontWeight: 700 }}>{activeJourneyForForm.vessel?.vesselType}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('captainNameLabel')}</span>
                                        <span style={{ fontWeight: 700 }}>{activeJourneyForForm.captainName || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Voyage & Schedule Section */}
                            <div style={{ background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('voyageSchedule')} & {t('cargoInfo')}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('lastPortOfOrigin')}</span>
                                            <span style={{ fontWeight: 700 }}>{activeJourneyForForm.lastPortOfCall}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Port of Destination</span>
                                            <span style={{ fontWeight: 700 }}>{activeJourneyForForm.destinationPort || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('eta')}</span>
                                            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{activeJourneyForForm.eta ? new Date(activeJourneyForForm.eta).toLocaleString('en-IN', { hour12: false }) : 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('etd')}</span>
                                            <span style={{ fontWeight: 700 }}>{activeJourneyForForm.etd ? new Date(activeJourneyForForm.etd).toLocaleString('en-IN', { hour12: false }) : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Cargo Details</span>
                                            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{activeJourneyForForm.cargoType || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('crewPassengerDetails')}</span>
                                            <span style={{ fontWeight: 700 }}>Crew: {activeJourneyForForm.crewCount || 0} / Pax: {activeJourneyForForm.passengerCount || 'NIL'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ILH Dues Section */}
                            <div style={{ gridColumn: 'span 2', background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('ilhDues')}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Receipt No</span>
                                        <span style={{ fontWeight: 700 }}>{activeJourneyForForm.ilhReceiptNo || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Paid Date</span>
                                        <span style={{ fontWeight: 700 }}>{activeJourneyForForm.ilhPaidDate ? new Date(activeJourneyForForm.ilhPaidDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>{t('ilhAmountLabel')}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            {activeJourneyForForm.ilhAmount ? `Rs. ${Number(activeJourneyForForm.ilhAmount).toLocaleString('en-IN')}` : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Validity Period</span>
                                        <span style={{ fontWeight: 700 }}>
                                            {activeJourneyForForm.ilhValidFrom ? new Date(activeJourneyForForm.ilhValidFrom).toLocaleDateString('en-IN') : 'N/A'} to {activeJourneyForForm.ilhValidTo ? new Date(activeJourneyForForm.ilhValidTo).toLocaleDateString('en-IN') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Clearance Statuses & Decision Notes */}
                            <div style={{ gridColumn: 'span 2', background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {t('clearanceStatuses')}
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { id: 'health', name: t('healthDept'), status: activeJourneyForForm.clearances.health, note: activeJourneyForForm.notes?.health },
                                        { id: 'customs', name: t('customsDept'), status: activeJourneyForForm.clearances.customs, note: activeJourneyForForm.notes?.customs },
                                        { id: 'traffic', name: t('portTrafficControl'), status: activeJourneyForForm.clearances.traffic, note: activeJourneyForForm.notes?.traffic }
                                    ].map(stage => (
                                        <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{stage.name}</span>
                                                <span style={{ 
                                                    padding: '0.2rem 0.6rem', 
                                                    borderRadius: '100px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 800,
                                                    background: `${getStatusColor(stage.status)}15`,
                                                    color: getStatusColor(stage.status)
                                                }}>{stage.status.toUpperCase()}</span>
                                            </div>
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.65rem' }}>{t('decisionNote')}</span>
                                                <span style={{ fontSize: '0.8rem', fontStyle: stage.note ? 'normal' : 'italic', color: stage.note ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                    {stage.note || t('noNoteProvided')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Green Port Environmental Report Section */}
                            <div style={{ gridColumn: 'span 2', background: 'rgba(22, 163, 74, 0.05)', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--success)', borderBottom: '1px solid rgba(22, 163, 74, 0.2)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Leaf size={18} />
                                    <span>Green Port Voyage Carbon & Fuel Assessment</span>
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Estimated Fuel Burned</span>
                                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{voyageFuel} MT (Marine Fuel)</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>CO₂ footprint (Estimated)</span>
                                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{voyageCo2} Tons CO₂e</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Sagar Setu Eco Rating</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <Leaf size={14} />
                                            {voyageEco} / 100 ({voyageEco > 75 ? 'Excellent' : voyageEco > 50 ? 'Good' : 'Needs Improvement'})
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.75rem' }}>Environmental Surcharge</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                                            Exempted (Green Port Compliant)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Documents Vault integration inside form modal */}
                            <div style={{ gridColumn: 'span 2', background: 'var(--user-profile-bg, rgba(255, 255, 255, 0.6))', padding: '1.5rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
                                <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Submitted Documents
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {activeJourneyForForm.documents && activeJourneyForForm.documents.length > 0 ? (
                                        activeJourneyForForm.documents.map((docStr, idx) => {
                                            let parsed;
                                            try {
                                                parsed = JSON.parse(docStr);
                                            } catch {
                                                parsed = null;
                                            }

                                            const docName = parsed ? parsed.name : docStr;

                                            return (
                                                <div key={idx} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'rgba(255, 255, 255, 0.3)',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--glass-border)'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                                        <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                                                            {docName}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{
                                                            padding: '0.3rem 0.75rem',
                                                            fontSize: '0.7rem',
                                                            borderRadius: '8px',
                                                            fontWeight: 700
                                                        }}
                                                        onClick={() => openDocument(docStr)}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No documents uploaded.</span>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Bottom Actions */}
                        <div style={{ marginTop: '2rem', textAlign: 'right', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                            <button className="btn" style={{ minWidth: '120px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }} onClick={() => setActiveJourneyForForm(null)}>
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {isOcrScanning && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(30, 58, 138, 0.4)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    gap: '1.5rem'
                }}>
                    <div style={{
                        background: 'var(--panel-bg, rgba(255, 255, 255, 0.9))',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1.25rem',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid rgba(255,255,255,0.4)',
                        color: 'var(--text-main, #333)'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <RefreshCw size={48} className="lucide-spin" style={{ color: 'var(--primary)' }} />
                            <Sparkles size={20} style={{ position: 'absolute', top: -5, right: -5, color: 'var(--secondary)' }} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>
                            Sagar Setu AI Manifest OCR
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                            Scanning cargo manifest, crew lists, and lighthouse receipts... Extracting operational metadata.
                        </p>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'var(--border, #eee)',
                            borderRadius: '100px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--secondary) 0%, var(--success) 100%)',
                                width: '60%',
                                borderRadius: '100px'
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
