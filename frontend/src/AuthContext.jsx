import React, { createContext, useState, useEffect, useRef } from 'react';
import api from './api';

export const AuthContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
    {
        id: 'default-1',
        title: 'Welcome to NMPA Portal',
        message: 'You are now securely logged in to the National Maritime Single Window Portal.',
        type: 'info',
        timestamp: new Date().toISOString(),
    },
];

const TRANSLATIONS = {
  en: {
    // Nav & Common
    dashboard: 'Dashboard',
    registry: 'Vessel Registry',
    workflow: 'Journey Workflow',
    admin: 'Admin Panel',
    logs: 'Logs & Audits',
    signOut: 'Sign Out',
    namaste: 'Namaste',
    officialPortal: 'Official Portal',
    accessibility: 'Accessibility',
    title: 'National Maritime Single Window Portal',
    enterprise: 'New Mangalore Port Authority (NMPA) — Govt. of India Enterprise',
    helpline: 'Toll-Free Helpline',
    supportDesk: '24x7 support desk',
    email: 'Helpdesk Email',
    rights: 'All Rights Reserved.',
    satyamev: 'सत्यमेव जयते',
    sysDashboard: 'System Dashboard',
    administration: 'Administration',
    subTitle: 'Govt of India Enterprise',

    // Dashboard
    registeredVessels: 'Registered Vessels',
    activeJourneys: 'Active Journeys',
    totalClearances: 'Total Clearances',
    clearanceProgress: 'Clearance Progress',
    realTimeData: 'Real-time Data',
    healthDept: 'Health Department',
    customsDept: 'Customs Department',
    portTrafficControl: 'Port Traffic Control',
    systemSummary: 'System Summary',
    peakActivity: 'Peak Activity',
    avgClearanceTime: 'Avg Clearance Time',
    complianceRate: 'Compliance Rate',
    hours: 'Hours',

    // Vessel Registry
    registerNewVessel: 'Register New Vessel',
    vesselName: 'Vessel Name',
    imoNumber: 'IMO Number',
    flagState: 'Flag State',
    vesselType: 'Vessel Type',
    registerBtn: 'Register Vessel',

    // Clearance Workflow
    clearanceHub: 'Clearance Hub',
    clearanceHubSub: 'Manage vessel entry and department approvals',
    cancelApp: 'Cancel Application',
    newApp: 'New Application',
    portEntryApp: 'Port Entry Application',
    vesselIdentifier: 'Vessel Identifier',
    selectRegisteredVessel: 'Select Registered Vessel',
    lastPortOfOrigin: 'Last Port of Origin',
    eta: 'Arrival (ETA)',
    etd: 'Departure (ETD)',
    documentationLabel: 'Documentation (IGM, Health, Cargo)',
    uploadDocsDesc: 'Click to upload necessary port clearance documents',
    chooseFiles: 'Choose Files',
    submitToAuthority: 'Submit to Authority',
    clearancePipeline: 'Clearance Pipeline',
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    searchPlaceholder: 'Search vessel name or origin port...',
    vesselRoute: 'Vessel & Route',
    schedule: 'Schedule',
    deptProgress: 'Departmental Progress',
    overallStatus: 'Overall Status',
    actions: 'Actions',
    downloadCert: 'Download Certificate',
    viewDocs: 'View Docs',
    noMatchingClearance: 'No matching clearance applications found.',

    // Admin Panel
    createNewUser: 'Create New User',
    role: 'Role',
    emailAddress: 'Email Address',
    username: 'Username',
    password: 'Password',
    createUser: 'Create User',
    userRoster: 'User Roster',
    configureMy2fa: 'Configure My 2FA',
    searchUsersPlaceholder: 'Search users by name or role...',
    status: 'Status',
    noMatchingUsers: 'No matching users found.',
    twoFaConfig: '2FA Configuration',
    scanQrCode: 'Scan this QR code with the Google Authenticator app for user',
    manualKey: 'Manual Key',
    close: 'Close',

    // Logs & Audits
    logsAuditsConsole: 'Logs & Audits Console',
    logsAuditsDesc: 'Consolidated, searchable view of port operations and security audits',
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    vesselJourneys: 'Vessel Journeys',
    portCompliance: 'Port Compliance',
    securityEvents: 'Security Events',
    tracked: 'Tracked',
    cleared: 'Cleared',
    audited: 'Audited',
    recentOpsLogs: 'Recent Operational Logs',
    realTimeClearanceProgress: 'Real-time clearance progress of active vessel journeys',
    searchLogsPlaceholder: 'Search by vessel or origin...',
    allStatuses: 'All Statuses',
    export: 'Export',
    systemAuditLogs: 'System Audit Logs',
    chronologicalHistory: 'Chronological history of security and configuration changes',
    searchAuditsPlaceholder: 'Search by action or username...',
    time: 'Time',
    userLabel: 'User',
    actionLabel: 'Action',
    noMatchingOpsLogs: 'No matching operational logs found.',
    noMatchingAudits: 'No matching system audit trails available.',
  },
  hi: {
    // Nav & Common
    dashboard: 'डैशबोर्ड',
    registry: 'पोत पंजीकरण',
    workflow: 'यात्रा कार्यप्रवाह',
    admin: 'प्रशासन पैनल',
    logs: 'लॉग और ऑडिट',
    signOut: 'बाहर निकलें',
    namaste: 'नमस्ते',
    officialPortal: 'आधिकारिक पोर्टल',
    accessibility: 'सुगम्यता',
    title: 'राष्ट्रीय समुद्री एकल खिड़की पोर्टल',
    enterprise: 'नया मंगलौर पोर्ट अथॉरिटी (NMPA) — भारत सरकार का उद्यम',
    helpline: 'टोल-फ्री हेल्पलाइन',
    supportDesk: '24x7 सहायता डेस्क',
    email: 'हेल्पडेस्क ईमेल',
    rights: 'सर्वाधिकार सुरक्षित।',
    satyamev: 'सत्यमेव जयते',
    sysDashboard: 'प्रणाली डैशबोर्ड',
    administration: 'प्रशासन',
    subTitle: 'भारत सरकार का उद्यम',

    // Dashboard
    registeredVessels: 'पंजीकृत पोत',
    activeJourneys: 'सक्रिय यात्राएं',
    totalClearances: 'कुल स्वीकृतियां',
    clearanceProgress: 'स्वीकृति प्रगति',
    realTimeData: 'वास्तविक समय डेटा',
    healthDept: 'स्वास्थ्य विभाग',
    customsDept: 'सीमा शुल्क विभाग',
    portTrafficControl: 'पत्तन यातायात नियंत्रण',
    systemSummary: 'प्रणाली सारांश',
    peakActivity: 'चरम गतिविधि',
    avgClearanceTime: 'औसत स्वीकृति समय',
    complianceRate: 'अनुपालन दर',
    hours: 'घंटे',

    // Vessel Registry
    registerNewVessel: 'नया पोत पंजीकृत करें',
    vesselName: 'पोत का नाम',
    imoNumber: 'आईएमओ नंबर',
    flagState: 'ध्वज राज्य',
    vesselType: 'पोत का प्रकार',
    registerBtn: 'पोत पंजीकृत करें',

    // Clearance Workflow
    clearanceHub: 'स्वीकृति केंद्र',
    clearanceHubSub: 'पोत प्रवेश और विभागीय मंजूरी का प्रबंधन करें',
    cancelApp: 'आवेदन रद्द करें',
    newApp: 'नया आवेदन',
    portEntryApp: 'पोर्ट प्रवेश आवेदन',
    vesselIdentifier: 'पोत पहचानकर्ता',
    selectRegisteredVessel: 'पंजीकृत पोत का चयन करें',
    lastPortOfOrigin: 'मूल अंतिम बंदरगाह',
    eta: 'आगमन (ETA)',
    etd: 'प्रस्थान (ETD)',
    documentationLabel: 'दस्तावेज़ीकरण (IGM, स्वास्थ्य, कार्गो)',
    uploadDocsDesc: 'आवश्यक बंदरगाह मंजूरी दस्तावेज अपलोड करने के लिए क्लिक करें',
    chooseFiles: 'फ़ाइलें चुनें',
    submitToAuthority: 'प्राधिकरण को सौंपें',
    clearancePipeline: 'स्वीकृति पाइपलाइन',
    approved: 'स्वीकृत',
    pending: 'लंबित',
    rejected: 'अस्वीकृत',
    searchPlaceholder: 'पोत का नाम या मूल बंदरगाह खोजें...',
    vesselRoute: 'पोत और मार्ग',
    schedule: 'अनुसूची',
    deptProgress: 'विभागीय प्रगति',
    overallStatus: 'समग्र स्थिति',
    actions: 'कार्रवाई',
    downloadCert: 'प्रमाणपत्र डाउनलोड करें',
    viewDocs: 'दस्तावेज़ देखें',
    noMatchingClearance: 'कोई मिलान मंजूरी आवेदन नहीं मिला।',

    // Admin Panel
    createNewUser: 'नया उपयोगकर्ता बनाएं',
    role: 'भूमिका',
    emailAddress: 'ईमेल पता',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    createUser: 'उपयोगकर्ता बनाएं',
    userRoster: 'उपयोगकर्ता सूची',
    configureMy2fa: 'मेरा 2FA कॉन्फ़िगर करें',
    searchUsersPlaceholder: 'नाम या भूमिका से उपयोगकर्ता खोजें...',
    status: 'स्थिति',
    noMatchingUsers: 'कोई मिलान उपयोगकर्ता नहीं मिला।',
    twoFaConfig: '2FA कॉन्फ़िगरेशन',
    scanQrCode: 'उपयोगकर्ता के लिए Google Authenticator ऐप के साथ इस QR कोड को स्कैन करें',
    manualKey: 'मैनुअल की (Key)',
    close: 'बंद करें',

    // Logs & Audits
    logsAuditsConsole: 'लॉग और ऑडिट कंसोल',
    logsAuditsDesc: 'पोर्ट संचालन और सुरक्षा ऑडिट का एकीकृत, खोजने योग्य दृश्य',
    refresh: 'रीफ्रेश करें',
    refreshing: 'रीफ्रेश हो रहा है...',
    vesselJourneys: 'पोत यात्राएं',
    portCompliance: 'पोर्ट अनुपालन',
    securityEvents: 'सुरक्षा घटनाएँ',
    tracked: 'ट्रैक किया गया',
    cleared: 'स्वीकृत',
    audited: 'ऑडिट किया गया',
    recentOpsLogs: 'हाल के परिचालन लॉग',
    realTimeClearanceProgress: 'सक्रिय पोत यात्राओं की वास्तविक समय स्वीकृति प्रगति',
    searchLogsPlaceholder: 'पोत या मूल बंदरगाह द्वारा खोजें...',
    allStatuses: 'सभी स्थितियाँ',
    export: 'निर्यात करें',
    systemAuditLogs: 'सिस्टम ऑडिट लॉग',
    chronologicalHistory: 'सुरक्षा और कॉन्फ़िगरेशन परिवर्तनों का कालानुक्रमिक इतिहास',
    searchAuditsPlaceholder: 'कार्रवाई या उपयोगकर्ता नाम द्वारा खोजें...',
    time: 'समय',
    userLabel: 'उपयोगकर्ता',
    actionLabel: 'कार्रवाई',
    noMatchingOpsLogs: 'कोई मिलान परिचालन लॉग नहीं मिला।',
    noMatchingAudits: 'कोई मिलान सिस्टम ऑडिट उपलब्ध नहीं है।',
  }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');
    // Notifications are session-scoped — reset to defaults on every login
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);

    const toggleLang = () => {
        setLang(prev => {
            const next = prev === 'en' ? 'hi' : 'en';
            localStorage.setItem('appLang', next);
            return next;
        });
    };

    const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;

    const prevJourneys = useRef([]);
    const prevVessels = useRef([]);
    const hasLoadedBaseline = useRef(false);

    const login = (userData, token) => {
        window.__TEMP_TOKEN__ = token;
        setUser(userData);
        setNotifications(DEFAULT_NOTIFICATIONS); // fresh notifications each session
        hasLoadedBaseline.current = false;
    };

    const logout = () => {
        window.__TEMP_TOKEN__ = null;
        setUser(null);
        hasLoadedBaseline.current = false;
    };

    const addToast = (title, message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addNotification = (title, message, type = 'info') => {
        const newNotif = {
            id: Math.random().toString(36).substring(2, 9),
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
        };
        setNotifications(prev => [newNotif, ...prev]);
        addToast(title, message, type);
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Smart background detector for changes
    useEffect(() => {
        if (!user) return;

        const pollData = async () => {
            try {
                const [vRes, jRes] = await Promise.all([
                    api.get('/vessels'),
                    api.get('/journeys')
                ]);

                const currentVessels = vRes.data;
                const currentJourneys = jRes.data;

                if (!hasLoadedBaseline.current) {
                    prevVessels.current = currentVessels;
                    prevJourneys.current = currentJourneys;
                    hasLoadedBaseline.current = true;
                    return;
                }

                // Check for new vessels
                currentVessels.forEach(v => {
                    const exists = prevVessels.current.some(pv => pv._id === v._id);
                    if (!exists) {
                        addNotification(
                            'New Vessel Registered',
                            `Vessel '${v.name}' (${v.vesselType}) has been registered by ship agent.`,
                            'info'
                        );
                    }
                });

                // Check for journey updates
                currentJourneys.forEach(j => {
                    const prevJ = prevJourneys.current.find(pj => pj._id === j._id);
                    if (!prevJ) {
                        // New journey submitted
                        addNotification(
                            'New Entry Application',
                            `New port entry application submitted for Vessel '${j.vessel?.name || 'Unknown'}'.`,
                            'info'
                        );
                    } else {
                        // Check clearances health
                        if (j.clearances.health !== prevJ.clearances.health && j.clearances.health !== 'Pending') {
                            addNotification(
                                'Health Clearance Update',
                                `Vessel '${j.vessel?.name}' health clearance has been ${j.clearances.health.toLowerCase()} by Health Department.`,
                                j.clearances.health === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check clearances customs
                        if (j.clearances.customs !== prevJ.clearances.customs && j.clearances.customs !== 'Pending') {
                            addNotification(
                                'Customs Clearance Update',
                                `Vessel '${j.vessel?.name}' customs clearance has been ${j.clearances.customs.toLowerCase()} by Customs Department.`,
                                j.clearances.customs === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check clearances traffic
                        if (j.clearances.traffic !== prevJ.clearances.traffic && j.clearances.traffic !== 'Pending') {
                            addNotification(
                                'Traffic Clearance Update',
                                `Vessel '${j.vessel?.name}' traffic clearance has been ${j.clearances.traffic.toLowerCase()} by Port Authority Node.`,
                                j.clearances.traffic === 'Approved' ? 'success' : 'danger'
                            );
                        }
                        // Check overall status
                        if (j.status !== prevJ.status) {
                            if (j.status === 'Cleared') {
                                addNotification(
                                    'Vessel Fully Cleared',
                                    `Vessel '${j.vessel?.name}' has been fully cleared for port entry! Certificate is ready.`,
                                    'success'
                                );
                            } else if (j.status === 'Rejected') {
                                addNotification(
                                    'Vessel Entry Rejected',
                                    `Vessel '${j.vessel?.name}' port entry has been rejected. Check clearance notes.`,
                                    'danger'
                                );
                            }
                        }
                    }
                });

                prevVessels.current = currentVessels;
                prevJourneys.current = currentJourneys;

            } catch (err) {
                console.error("Background notification checker error:", err);
            }
        };

        pollData(); // Run initially
        const interval = setInterval(pollData, 6000); // Poll every 6s

        return () => clearInterval(interval);
    }, [user]);

    const unreadCount = notifications.length;

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            notifications,
            unreadCount,
            toasts,
            removeToast,
            addNotification,
            deleteNotification,
            clearAllNotifications,
            lang,
            toggleLang,
            t
        }}>
            {children}
        </AuthContext.Provider>
    );
};
