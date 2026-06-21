import React, { useContext, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Ship, FileCheck, Clock, Settings, LogOut, Bell, Menu, UserIcon, LayoutDashboard, History, Moon, Sun, Trash2, AlertTriangle, Info, Check, X, MessageSquare, Send, Bot, Sparkles } from 'lucide-react';
import { AuthProvider, AuthContext } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';
import VesselRegistry from './VesselRegistry';
import ClearanceWorkflow from './ClearanceWorkflow';
import AdminPanel from './AdminPanel';
import LogsAndAudits from './LogsAndAudits';
import VerifyCertificate from './VerifyCertificate';
import './index.css';

function PrivateRoute({ children, allowedRoles }) {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }
    return children;
}

function Layout({ children }) {
  const { 
    user, 
    logout, 
    notifications,
    unreadCount,
    toasts,
    removeToast,
    deleteNotification,
    clearAllNotifications,
    lang,
    toggleLang,
    t,
    theme,
    toggleTheme,
    fontSize,
    setFontSize
  } = useContext(AuthContext);
  
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: lang === 'en' 
        ? 'Namaste! Welcome to NMPA Digital Clearance Single Window. I am your Sagar Setu AI Assistant. How can I help you today?' 
        : 'नमस्ते! एनएमपीए डिजिटल क्लीयरेंस सिंगल विंडो में आपका स्वागत है। मैं आपका सागर सेतु सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [smsAlert, setSmsAlert] = useState(null);

  useEffect(() => {
    setChatMessages(prev => {
      if (prev.length === 1) {
        return [{
          sender: 'assistant',
          text: lang === 'en' 
            ? 'Namaste! Welcome to NMPA Digital Clearance Single Window. I am your Sagar Setu AI Assistant. How can I help you today?' 
            : 'नमस्ते! एनएमपीए डिजिटल क्लीयरेंस सिंगल विंडो में आपका स्वागत है। मैं आपका सागर सेतु सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?'
        }];
      }
      return prev;
    });
  }, [lang]);

  const handleChatOptionClick = (text, optionKey) => {
    const userMsg = { sender: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    
    setTimeout(() => {
      let reply = '';
      if (lang === 'en') {
        if (optionKey === 'vessel') {
          reply = 'To register a new vessel, navigate to the "Vessel Registry" tab on the sidebar. Click "Add New Vessel" and fill in structural details (IMO, GRT, NRT, Flag). Ensure the IMO number is a unique 7-digit value.';
        } else if (optionKey === 'workflow') {
          reply = 'The clearance pipeline is sequential: First, the Health Department (PHO) evaluates health logs. Second, the Customs Department audits cargo manifests and lighthouse (ILH) dues receipts. Third, Port Traffic Control assigns berthing. Once all three approve, the status transitions to "Cleared".';
        } else if (optionKey === '2fa') {
          reply = 'Our single window portal enforces Two-Factor Authentication (MFA). When registering, the system generates a 16-character Base32 secret key. Scan the QR code using Google Authenticator and enter the 6-digit TOTP code on login.';
        } else if (optionKey === 'certificate') {
          reply = 'Once all three departments mark a voyage entry application as "Approved", the global status becomes "Cleared". A download button will appear next to the voyage record in your Clearance Workflow list. You can download the Bilingual Health Certificate (green) and Port Clearance Certificate (blue).';
        } else if (optionKey === 'support') {
          reply = 'For technical queries, you can reach out to the Single Window Helpdesk at support-nmpa@gov.in or call Toll-Free at 1800-11-2026.';
        }
      } else {
        if (optionKey === 'vessel') {
          reply = 'नया जहाज पंजीकृत करने के लिए, साइडबार पर "पोत पंजीकरण" टैब पर जाएं। "नया पोत जोड़ें" पर क्लिक करें और संरचनात्मक विवरण (IMO, GRT, NRT, फ्लैग) भरें। सुनिश्चित करें कि IMO नंबर एक अद्वितीय 7-अंकीय मान है।';
        } else if (optionKey === 'workflow') {
          reply = 'मंजूरी पाइपलाइन अनुक्रमिक है: पहला, स्वास्थ्य विभाग (PHO) स्वास्थ्य लॉग का मूल्यांकन करता है। दूसरा, सीमा शुल्क विभाग कार्गो मैनिफेस्ट और लाइट हाउस (ILH) देय राशि की ऑडिट करता है। तीसरा, पोर्ट ट्रैफिक कंट्रोल बर्थ आवंटित करता है। तीनों विभागों द्वारा स्वीकृत होने के बाद, स्थिति "स्वीकृत (Cleared)" में बदल जाती है।';
        } else if (optionKey === '2fa') {
          reply = 'हमारा सिंगल विंडो पोर्टल टू-फैक्टर ऑथेंटिकेशन (MFA) लागू करता है। पंजीकरण के समय, सिस्टम 16-अक्षर की बेस32 गुप्त कुंजी उत्पन्न करता है। गूगल ऑथेंटिकेटर का उपयोग करके क्यूआर कोड को स्कैन करें और लॉगिन पर 6-अंकीय टीओटीपी कोड दर्ज करें।';
        } else if (optionKey === 'certificate') {
          reply = 'एक बार जब सभी तीन विभाग यात्रा प्रवेश आवेदन को "अनुमोदित" के रूप में चिह्नित करते हैं, तो समग्र स्थिति "स्वीकृत (Cleared)" हो जाती है। आपकी मंजूरी वर्कफ़्लो सूची में यात्रा रिकॉर्ड के बगल में एक डाउनलोड बटन दिखाई देगा। आप द्विभाषी स्वास्थ्य प्रमाणपत्र (हरा) और पोर्ट क्लीयरेंस प्रमाणपत्र (नीला) डाउनलोड कर सकते हैं।';
        } else if (optionKey === 'support') {
          reply = 'तकनीकी प्रश्नों के लिए, आप support-nmpa@gov.in पर सिंगल विंडो हेल्पडेस्क से संपर्क कर सकते हैं या टोल-फ्री नंबर 1800-11-2026 पर कॉल कर सकते हैं।';
        }
      }
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 600);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userText = chatInput.trim();
    const userMsg = { sender: 'user', text: userText };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    setTimeout(() => {
      let reply = '';
      const textLower = userText.toLowerCase();
      
      if (lang === 'en') {
        if (textLower.includes('vessel') || textLower.includes('register') || textLower.includes('ship')) {
          reply = 'To register a new vessel, navigate to the "Vessel Registry" tab on the sidebar. Click "Add New Vessel" and fill in structural details (IMO, GRT, NRT, Flag). Ensure the IMO number is a unique 7-digit value.';
        } else if (textLower.includes('approval') || textLower.includes('workflow') || textLower.includes('clearance') || textLower.includes('stepper') || textLower.includes('process')) {
          reply = 'The clearance pipeline is sequential: First, the Health Department (PHO) evaluates health logs. Second, the Customs Department audits cargo manifests and lighthouse (ILH) dues receipts. Third, Port Traffic Control assigns berthing. Once all three approve, the status transitions to "Cleared".';
        } else if (textLower.includes('2fa') || textLower.includes('two factor') || textLower.includes('authenticator') || textLower.includes('otp') || textLower.includes('mfa')) {
          reply = 'Our single window portal enforces Two-Factor Authentication (MFA). When registering, the system generates a 16-character Base32 secret key. Scan the QR code using Google Authenticator and enter the 6-digit TOTP code on login.';
        } else if (textLower.includes('certificate') || textLower.includes('download') || textLower.includes('pdf')) {
          reply = 'Once all three departments mark a voyage entry application as "Approved", the global status becomes "Cleared". A download button will appear next to the voyage record in your Clearance Workflow list. You can download the Bilingual Health Certificate (green) and Port Clearance Certificate (blue).';
        } else if (textLower.includes('support') || textLower.includes('contact') || textLower.includes('help') || textLower.includes('phone') || textLower.includes('email')) {
          reply = 'For technical queries, you can reach out to the Single Window Helpdesk at support-nmpa@gov.in or call Toll-Free at 1800-11-2026.';
        } else {
          reply = "I'm sorry, I didn't quite catch that. You can select one of the quick options or ask about: vessel registration, sequential clearance approvals, 2FA setup, certificate downloads, or support contacts.";
        }
      } else {
        if (textLower.includes('जहाज') || textLower.includes('पंजीकरण') || textLower.includes('पोत')) {
          reply = 'नया जहाज पंजीकृत करने के लिए, साइडबार पर "पोत पंजीकरण" टैब पर जाएं। "नया पोत जोड़ें" पर क्लिक करें और संरचनात्मक विवरण (IMO, GRT, NRT, फ्लैग) भरें। सुनिश्चित करें कि IMO नंबर एक अद्वितीय 7-अंकीय मान है।';
        } else if (textLower.includes('अनुमोदन') || textLower.includes('मंजूरी') || textLower.includes('वर्कफ़्लो') || textLower.includes('प्रक्रिया')) {
          reply = 'मंजूरी पाइपलाइन अनुक्रमिक है: पहला, स्वास्थ्य विभाग (PHO) स्वास्थ्य लॉग का मूल्यांकन करता है। दूसरा, सीमा शुल्क विभाग कार्गो मैनिफेस्ट और लाइट हाउस (ILH) देय राशि की ऑडिट करता है। तीसरा, पोर्ट ट्रैफिक कंट्रोल बर्थ आवंटित करता है। तीनों विभागों द्वारा स्वीकृत होने के बाद, स्थिति "स्वीकृत (Cleared)" में बदल जाती है।';
        } else if (textLower.includes('सुरक्षा') || textLower.includes('2fa') || textLower.includes('कुंजी') || textLower.includes('लॉगिन')) {
          reply = 'हमारा सिंगल विंडो पोर्टल टू-फैक्टर ऑथेंटिकेशन (MFA) लागू करता है। पंजीकरण के समय, सिस्टम 16-अक्षर की बेस32 गुप्त कुंजी उत्पन्न करता है। गूगल ऑथेंटिकेटर का उपयोग करके क्यूआर कोड को स्कैन करें और लॉगिन पर 6-अंकीय टीओटीपी कोड दर्ज करें।';
        } else if (textLower.includes('प्रमाणपत्र') || textLower.includes('डाउनलोड') || textLower.includes('पीडीएफ')) {
          reply = 'एक बार जब सभी तीन विभाग यात्रा प्रवेश आवेदन को "अनुमोदित" के रूप में चिह्नित करते हैं, तो समग्र स्थिति "स्वीकृत (Cleared)" हो जाती है। आपकी मंजूरी वर्कफ़्लो सूची में यात्रा रिकॉर्ड के बगल में एक डाउनलोड बटन दिखाई देगा। आप द्विभाषी स्वास्थ्य प्रमाणपत्र (हरा) और पोर्ट क्लीयरेंस प्रमाणपत्र (नीला) डाउनलोड कर सकते हैं।';
        } else if (textLower.includes('संपर्क') || textLower.includes('मदद') || textLower.includes('सहायता') || textLower.includes('ईमेल') || textLower.includes('फोन')) {
          reply = 'तकनीकी प्रश्नों के लिए, आप support-nmpa@gov.in पर सिंगल विंडो हेल्पडेस्क से संपर्क कर सकते हैं या टोल-फ्री नंबर 1800-11-2026 पर कॉल कर सकते हैं।';
        } else {
          reply = 'क्षमा करें, मुझे समझ नहीं आया। आप त्वरित विकल्पों में से किसी एक को चुन सकते हैं या जहाज पंजीकरण, अनुक्रमिक मंजूरी अनुमोदन, 2FA सेटअप, प्रमाणपत्र डाउनलोड, या सहायता संपर्कों के बारे में पूछ सकते हैं।';
        }
      }
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 600);
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsNotificationOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    let timeoutId;
    const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            alert('You have been logged out due to 160 seconds of inactivity.');
            logout();
        }, 160000);
    };

    resetTimer(); 

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
        clearTimeout(timeoutId);
        events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  useEffect(() => {
    const handleSmsEvent = (e) => {
      const { vesselName, deptName, status } = e.detail;
      const today = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`;
      
      setSmsAlert({
        phone: '+91 98*** ' + today.getFullYear(),
        message: `Voyage clearance for ${vesselName} was ${status} by the ${deptName}.`,
        time: timeStr
      });

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setSmsAlert(prev => {
          return null;
        });
      }, 8000);
    };

    window.addEventListener('clearance-status-change', handleSmsEvent);
    return () => window.removeEventListener('clearance-status-change', handleSmsEvent);
  }, []);

  if (!user) return <Login />;



  const pageTitle = {
    '/': t('sysDashboard'),
    '/registry': t('registry'),
    '/workflow': t('workflow'),
    '/admin': t('administration'),
    '/logs': t('logs')
  }[location.pathname] || 'NMPA Port';

  const formatRelativeTime = (isoString) => {
      if (!isoString) return '';
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Indian Government Header Banner */}
      <div className="gov-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', width: '8px', height: '8px', borderRadius: '50%', background: '#FF9933' }}></span>
          <span>भारत सरकार | GOVERNMENT OF INDIA</span>
          <span className="gov-separator">|</span>
          <span style={{ color: 'var(--gov-text)' }}>पत्तन, पोत परिवहन और जलमार्ग मंत्रालय | MINISTRY OF PORTS, SHIPPING AND WATERWAYS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span className="gov-badge">{t('officialPortal')}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--gov-text)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            {t('accessibility')}: 
            <button onClick={() => setFontSize('large')} className={fontSize === 'large' ? 'active' : ''}>A+</button>
            <button onClick={() => setFontSize('normal')} className={fontSize === 'normal' ? 'active' : ''}>A</button>
            <button onClick={() => setFontSize('small')} className={fontSize === 'small' ? 'active' : ''}>A-</button>
          </span>
          <span className="gov-separator">|</span>
          <span 
            onClick={toggleLang} 
            className="gov-link"
            title="Switch Language / भाषा बदलें"
          >
            🌐 {lang === 'en' ? 'हिन्दी' : 'English'}
          </span>
          <span className="gov-separator">|</span>
          <span 
            onClick={toggleTheme} 
            className="gov-link"
            title="Toggle Light/Dark Theme / लाइट/डार्क थीम बदलें"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </span>
        </div>
      </div>
      <div className="gov-tricolor-stripe"></div>

      {/* Marquee Ticker */}
      <div className="marquee-ticker-container">
          <div className="marquee-ticker-text">
              {t('supportQueries')}: <span style={{ color: '#00add7', fontWeight: 700 }}>support-nmpa@gov.in</span> | {t('tollFreeMsg')} <strong style={{ color: 'var(--text-main)' }}>1800-11-2026</strong> | {t('payLightDues')}
          </div>
      </div>

      <div className="app-container" style={{ flex: 1 }}>
        {isSidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <img
              src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
              alt="NMPA Logo"
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
            />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>NMPA PORT</h2>
              <span className="gov-title-sub">{t('subTitle')}</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '6px', borderRadius: '8px',
                transition: 'all 0.2s', flexShrink: 0
              }}
              className="sidebar-close-btn"
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav style={{ flex: 1 }}>
            <div className="nav-section-label">Main</div>
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon"><LayoutDashboard size={18} /></span>
              <span className="nav-label">{t('dashboard')}</span>
            </Link>

            {user.role === 'Ship Agent Account' && (
              <Link
                to="/registry"
                className={`nav-link ${location.pathname === '/registry' ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><FileCheck size={18} /></span>
                <span className="nav-label">{t('registry')}</span>
              </Link>
            )}

            <Link
              to="/workflow"
              className={`nav-link ${location.pathname === '/workflow' ? 'active' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <span className="nav-icon"><Ship size={18} /></span>
              <span className="nav-label">{t('workflow')}</span>
            </Link>

            <div className="nav-section-label">System</div>
            {user.role === 'System Administrator' && (
              <Link
                to="/admin"
                className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><Settings size={18} /></span>
                <span className="nav-label">{t('admin')}</span>
              </Link>
            )}
            {(user.role === 'System Administrator' || user.role === 'Port Authority Node') && (
              <Link
                to="/logs"
                className={`nav-link ${location.pathname === '/logs' ? 'active' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon"><History size={18} /></span>
                <span className="nav-label">{t('logs')}</span>
              </Link>
            )}
          </nav>

          <div className="sidebar-user-section">
            <button
              onClick={logout}
              className="nav-link"
              style={{ color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="nav-icon" style={{ color: 'var(--danger)' }}><LogOut size={18} /></span>
              <span className="nav-label" style={{ fontWeight: 700 }}>{t('signOut')}</span>
            </button>
          </div>
        </aside>
        <main className="main-content">
          <header className="topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ 
                  background: 'var(--user-profile-bg)', 
                  border: '1px solid var(--glass-border)', 
                  cursor: 'pointer', 
                  color: 'var(--primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '10px',
                  borderRadius: '12px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--user-profile-shadow)',
                  outline: 'none'
                }}
                className="hamburger-btn"
                title={isSidebarOpen ? "Close Menu" : "Open Menu"}
              >
                <Menu size={20} />
              </button>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{pageTitle}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Notification Center */}
              <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  style={{
                    background: 'var(--user-profile-bg)',
                    border: '1px solid var(--glass-border)',
                    padding: '10px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--user-profile-shadow)',
                    outline: 'none',
                    position: 'relative',
                    transition: 'all 0.2s'
                  }}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        height: '18px',
                        minWidth: '18px',
                        borderRadius: '50%',
                        padding: '0 4px',
                        boxShadow: '0 0 6px var(--danger)'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="notification-dropdown">
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => clearAllNotifications()}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={11} /> Clear all
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">
                          <Bell size={32} className="notification-empty-icon" />
                          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>No notifications</div>
                          <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>You are all caught up!</div>
                        </div>
                      ) : (
                        notifications.map(n => {
                          const IconComp = n.type === 'success' ? Check : n.type === 'danger' || n.type === 'warning' ? AlertTriangle : Info;
                          return (
                            <div
                              key={n.id}
                              onClick={() => deleteNotification(n.id)}
                              className="notification-item"
                              title="Click to dismiss"
                            >
                              <div className={`notification-item-icon ${n.type}`}>
                                <IconComp size={16} />
                              </div>
                              <div className="notification-item-content">
                                <div className="notification-item-title">{n.title}</div>
                                <div className="notification-item-desc">{n.message}</div>
                                <span className="notification-item-time">{formatRelativeTime(n.timestamp)}</span>
                              </div>
                              <div className="notification-item-actions" style={{ opacity: 1 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                  className="notification-dismiss-btn"
                                  title="Dismiss"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="user-profile">
                <div style={{ textAlign: 'right' }} className="user-profile-text">
                  <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{t('namaste')}, {user.username}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px var(--primary-glow)' }}>
                  <UserIcon size={20} />
                </div>
              </div>
            </div>
          </header>
          <div className="content-area" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <footer className="gov-footer">
              <span className="satyamev-jayate" style={{ fontSize: '0.72rem' }}>{t('satyamev')}</span>
              <span>© 2026 New Mangalore Port Authority · {t('rights')}</span>
              <span>📞 1800-11-2026 &nbsp;|&nbsp; ✉️ support-nmpa@gov.in</span>
            </footer>
          </div>
        </main>
      </div>

      {/* Floating Toasts */}
      <div className="toasts-container">
        {toasts.map(t => {
          const IconComp = t.type === 'success' ? Check : t.type === 'danger' || t.type === 'warning' ? AlertTriangle : Info;
          return (
            <div key={t.id} className="toast-item" onClick={() => removeToast(t.id)}>
              <div className={`notification-item-icon ${t.type}`} style={{ width: '28px', height: '28px' }}>
                <IconComp size={14} />
              </div>
              <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-main)' }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{t.message}</div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeToast(t.id); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Sagar Setu AI Assistant Bot Toggle */}
      <button 
        className="chatbot-toggle" 
        onClick={() => setIsChatOpen(!isChatOpen)}
        title={lang === 'en' ? 'Sagar Setu Assistant' : 'सागर सेतु सहायक'}
      >
        {isChatOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {/* Sagar Setu AI Assistant Chatbot Drawer */}
      {isChatOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-header-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={18} style={{ color: 'var(--secondary)' }} />
                <span>Sagar Setu Assistant</span>
              </div>
              <div className="chatbot-header-sub">
                {lang === 'en' ? 'National Maritime Single Window Portal Helpdesk' : 'राष्ट्रीय समुद्री एकल खिड़की पोर्टल सहायता डेस्क'}
              </div>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)} 
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="gov-tricolor-stripe" style={{ height: '3px' }}></div>
          
          <div className="chatbot-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chatbot-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>

          {/* Quick Option Buttons */}
          <div className="chatbot-options">
            {lang === 'en' ? (
              <>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('How do I register a new vessel?', 'vessel')}>
                  🚢 1. How do I register a new vessel?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('What is the sequential approval process?', 'workflow')}>
                  ⚙️ 2. What is the sequential approval process?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('How does the 2FA system work?', '2fa')}>
                  🔒 3. How does the 2FA system work?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('How to download a clearance certificate?', 'certificate')}>
                  📄 4. How to download a clearance certificate?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('Contact support details', 'support')}>
                  📞 5. Contact support details
                </button>
              </>
            ) : (
              <>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('नया जहाज कैसे पंजीकृत करें?', 'vessel')}>
                  🚢 1. नया जहाज कैसे पंजीकृत करें?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('अनुक्रमिक अनुमोदन प्रक्रिया क्या है?', 'workflow')}>
                  ⚙️ 2. अनुक्रमिक अनुमोदन प्रक्रिया क्या है?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('2FA सुरक्षा प्रणाली कैसे काम करती है?', '2fa')}>
                  🔒 3. 2FA सुरक्षा प्रणाली कैसे काम करती है?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('क्लीयरेंस प्रमाणपत्र कैसे डाउनलोड करें?', 'certificate')}>
                  📄 4. क्लीयरेंस प्रमाणपत्र कैसे डाउनलोड करें?
                </button>
                <button className="chatbot-option-btn" onClick={() => handleChatOptionClick('सहायता डेस्क संपर्क जानकारी', 'support')}>
                  📞 5. सहायता डेस्क संपर्क जानकारी
                </button>
              </>
            )}
          </div>

          {/* Typing Input */}
          <form className="chatbot-input-container" onSubmit={handleSendChat}>
            <input 
              type="text" 
              className="chatbot-input" 
              placeholder={lang === 'en' ? 'Type your query here...' : 'अपना प्रश्न यहाँ लिखें...'} 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className="chatbot-send-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {smsAlert && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '320px',
          background: 'var(--panel-bg, rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(12px)',
          border: '2px solid var(--secondary, #ff9933)',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
          padding: '1rem',
          zIndex: 99999,
          animation: 'smsSlideIn 0.3s ease-out',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            background: 'rgba(255, 153, 51, 0.1)',
            color: 'var(--secondary, #ff9933)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MessageSquare size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary, #ff9933)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Govt SMS Gateway
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {smsAlert.time}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
               TO: {smsAlert.phone}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.4, fontWeight: 700 }}>
              {smsAlert.message}
            </p>
          </div>
          <button 
            onClick={() => setSmsAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify-certificate/:journeyId" element={<VerifyCertificate />} />
            <Route path="/*" element={<Layout><Routes>
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/registry" element={<PrivateRoute allowedRoles={['Ship Agent Account']}><VesselRegistry /></PrivateRoute>} />
              <Route path="/workflow" element={<PrivateRoute><ClearanceWorkflow /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute allowedRoles={['System Administrator']}><AdminPanel /></PrivateRoute>} />
              <Route path="/logs" element={<PrivateRoute allowedRoles={['System Administrator', 'Port Authority Node']}><LogsAndAudits /></PrivateRoute>} />
            </Routes></Layout>} />
          </Routes>
        </Router>
    </AuthProvider>
  );
}

export default App;
