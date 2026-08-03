import React, { useEffect, useState } from 'react';

const LOADING_STEPS = [
  { progress: 0, text: 'Initializing NMPA digital environment...', textHi: 'एनएमपीए डिजिटल वातावरण प्रारंभ किया जा रहा है...' },
  { progress: 20, text: 'Loading vessel registry databases...', textHi: 'पोत पंजीकरण डेटाबेस लोड किया जा रहा है...' },
  { progress: 45, text: 'Checking secure credentials & 2FA keys...', textHi: 'सुरक्षित क्रेडेंशियल और 2FA कुंजियों की जांच की जा रही है...' },
  { progress: 70, text: 'Configuring sequential clearance stepper...', textHi: 'अनुक्रमिक निकासी स्टेपर को कॉन्फ़िगर किया जा रहा है...' },
  { progress: 90, text: 'Establishing secure session connection...', textHi: 'सुरक्षित सत्र कनेक्शन स्थापित किया जा रहा है...' }
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(LOADING_STEPS[0]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');

  useEffect(() => {
    // Sync language from localStorage
    const handleStorageChange = () => {
      setLang(localStorage.getItem('appLang') || 'en');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Slow interval for realistic loading simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              onComplete();
            }, 600); // match CSS fade-out animation length
          }, 300);
          return 100;
        }
        
        // Random incremental steps
        const increment = Math.floor(Math.random() * 8) + 6;
        const nextProgress = Math.min(prev + increment, 100);
        
        // Find current step text based on progress
        const matchedStep = [...LOADING_STEPS]
          .reverse()
          .find((step) => nextProgress >= step.progress);
        if (matchedStep) {
          setCurrentStep(matchedStep);
        }
        
        return nextProgress;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`nmpa-loader-overlay ${isFadingOut ? 'fade-out' : ''}`}>
      {/* Self-contained CSS styles for rich, premium loading aesthetics */}
      <style>{`
        .nmpa-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center, #0B1E36 0%, #030812 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #ffffff;
          opacity: 1;
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s;
        }

        .nmpa-loader-overlay.fade-out {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        /* Decorative Background Waves */
        .loader-background-glows {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }

        .loader-glow-1 {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(255, 153, 51, 0.08) 0%, transparent 70%);
          filter: blur(80px);
          animation: floatGlow 12s ease-in-out infinite alternate;
        }

        .loader-glow-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(19, 136, 8, 0.08) 0%, transparent 70%);
          filter: blur(80px);
          animation: floatGlow 12s ease-in-out infinite alternate-reverse;
        }

        @keyframes floatGlow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 30px) scale(1.1); }
        }

        .loader-card {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 500px;
          padding: 2rem;
        }

        /* Spinning Outer Rings & Pulsing Logo Container */
        .logo-outer-ring {
          position: relative;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .logo-ring-spinning {
          position: absolute;
          inset: -10px;
          border: 3px solid transparent;
          border-top-color: #FF9933; /* Saffron */
          border-bottom-color: #138808; /* Green */
          border-radius: 50%;
          animation: spinRing 2.5s cubic-bezier(0.53, 0.21, 0.29, 0.67) infinite;
        }

        .logo-ring-pulse {
          position: absolute;
          inset: -2px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: pulseBorder 2s ease-in-out infinite;
        }

        .logo-avatar-wrapper {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.1);
          animation: logoBreath 3s ease-in-out infinite;
        }

        .logo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseBorder {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.08); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0.3; }
        }

        @keyframes logoBreath {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }

        /* Branding Text Styling */
        .portal-brand-title {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 0.25rem;
          background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .portal-brand-subtitle {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1.5rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .portal-authority-badge {
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 6px 14px;
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 2.5rem;
          letter-spacing: 0.8px;
        }

        /* Progress Bar & Status Text */
        .progress-indicator-container {
          width: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .progress-bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.02);
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF9933, #138808);
          border-radius: 10px;
          transition: width 0.15s ease-out;
          box-shadow: 0 0 12px rgba(19, 136, 8, 0.6);
        }

        .progress-percentage {
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 0.5rem;
        }

        .loader-status-text {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          height: 20px;
          transition: all 0.3s;
          letter-spacing: 0.4px;
        }
      `}</style>

      {/* Background visual elements */}
      <div className="loader-background-glows">
        <div className="loader-glow-1"></div>
        <div className="loader-glow-2"></div>
      </div>

      <div className="loader-card">
        {/* Glowing concentric rings with logo in center */}
        <div className="logo-outer-ring">
          <div className="logo-ring-spinning"></div>
          <div className="logo-ring-pulse"></div>
          <div className="logo-avatar-wrapper">
            <img
              src="nmpa-logo.png"
              alt="NMPA Logo"
              className="logo-image"
              onError={(e) => {
                e.target.src = 'favicon.svg';
              }}
            />
          </div>
        </div>

        {/* Branding header info */}
        <h1 className="portal-brand-title">PORT DIGITAL CLEARANCE SYSTEM</h1>
        <h3 className="portal-brand-subtitle">
          {lang === 'en' ? 'National Maritime Single Window Portal' : 'राष्ट्रीय समुद्री एकल खिड़की पोर्टल'}
        </h3>
        <div className="portal-authority-badge">
          NEW MANGALORE PORT AUTHORITY (NMPA)
        </div>

        {/* Progress monitoring components */}
        <div className="progress-indicator-container">
          <span className="progress-percentage">{progress}%</span>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="loader-status-text">
            {lang === 'en' ? currentStep.text : currentStep.textHi}
          </div>
        </div>
      </div>
    </div>
  );
}
