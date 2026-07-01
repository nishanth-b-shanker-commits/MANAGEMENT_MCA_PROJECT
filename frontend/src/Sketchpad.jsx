import React, { useRef, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { 
  PenTool, 
  Eraser, 
  Square, 
  Circle, 
  TrendingUp, 
  Type, 
  Undo, 
  Redo, 
  Download, 
  Trash2, 
  Copy, 
  Map, 
  Grid, 
  Maximize2,
  CheckCircle,
  FileSignature
} from 'lucide-react';

export default function Sketchpad() {
  const { t, theme } = useContext(AuthContext);
  
  const containerRef = useRef(null);
  const fgCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  
  // Fixed canvas coordinate space (logical pixels)
  const logicalWidth = 1200;
  const logicalHeight = 700;

  // Drawing state
  const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'line', 'rect', 'circle', 'arrow', 'text'
  const [brushColor, setBrushColor] = useState('#1e3a8a');
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [bgType, setBgType] = useState('map'); // 'blank', 'grid', 'map'
  
  // Drawing coordinates & status
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [tempSnapshot, setTempSnapshot] = useState(null);
  
  // Undo/Redo Stacks
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Predefined Nautical/Gov Colors
  const colors = [
    { name: 'Navy Blue', value: '#1e3a8a' },
    { name: 'Saffron', value: '#ff9933' },
    { name: 'Gov Green', value: '#16a34a' },
    { name: 'Alert Red', value: '#dc2626' },
    { name: 'Marine Cyan', value: '#06b6d4' },
    { name: 'Coal Black', value: '#0f172a' },
    { name: 'Pure White', value: '#ffffff' }
  ];

  // Adjust default brush color based on theme
  useEffect(() => {
    if (theme === 'dark') {
      setBrushColor('#06b6d4'); // Light cyan defaults for dark mode
    } else {
      setBrushColor('#1e3a8a'); // Indian navy defaults for light mode
    }
  }, [theme]);

  // Initial setup of backing store sizes
  useEffect(() => {
    const fg = fgCanvasRef.current;
    const bg = bgCanvasRef.current;
    if (!fg || !bg) return;

    // Set backing store dimensions
    fg.width = logicalWidth;
    fg.height = logicalHeight;
    bg.width = logicalWidth;
    bg.height = logicalHeight;

    // Set initial background
    drawBackground();

    // Set initial history snapshot
    const fgCtx = fg.getContext('2d');
    fgCtx.lineCap = 'round';
    fgCtx.lineJoin = 'round';
    
    const initialSnapshot = fgCtx.getImageData(0, 0, logicalWidth, logicalHeight);
    setHistory([initialSnapshot]);
    setHistoryStep(0);
  }, []);

  // Redraw background whenever preset background type or theme shifts
  useEffect(() => {
    drawBackground();
  }, [bgType, theme]);

  const drawBackground = () => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    
    if (bgType === 'blank') {
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    } 
    else if (bgType === 'grid') {
      ctx.fillStyle = theme === 'dark' ? '#0f172a' : '#ffffff';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      
      // Blueprint engineering grid
      ctx.strokeStyle = theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 58, 138, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 35;
      
      for (let x = 0; x < logicalWidth; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight); ctx.stroke();
      }
      for (let y = 0; y < logicalHeight; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y); ctx.stroke();
      }
    } 
    else if (bgType === 'map') {
      // Nautical / Berth map of NMPA Mangalore
      const landColor = theme === 'dark' ? '#1e293b' : '#fafaf9';
      const waterColor = theme === 'dark' ? '#0f172c' : '#e0f2fe';
      const dockColor = theme === 'dark' ? '#334155' : '#e2e8f0';
      const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
      const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
      
      // Fill water
      ctx.fillStyle = waterColor;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      
      // Grid lines on water
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < logicalWidth; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logicalHeight); ctx.stroke();
      }
      for (let y = 0; y < logicalHeight; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logicalWidth, y); ctx.stroke();
      }
      
      // Draw Land mass on the right
      ctx.fillStyle = landColor;
      ctx.beginPath();
      ctx.moveTo(logicalWidth * 0.68, 0);
      ctx.lineTo(logicalWidth * 0.68, logicalHeight * 0.2);
      ctx.lineTo(logicalWidth * 0.63, logicalHeight * 0.28);
      ctx.lineTo(logicalWidth * 0.63, logicalHeight * 0.45);
      ctx.lineTo(logicalWidth * 0.58, logicalHeight * 0.52);
      ctx.lineTo(logicalWidth * 0.58, logicalHeight * 0.75);
      ctx.lineTo(logicalWidth * 0.78, logicalHeight * 0.88);
      ctx.lineTo(logicalWidth * 0.82, logicalHeight);
      ctx.lineTo(logicalWidth, logicalHeight);
      ctx.lineTo(logicalWidth, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = theme === 'dark' ? '#475569' : '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw concrete berths
      ctx.fillStyle = dockColor;
      
      // Berth A1 & A2 (General / Cargo)
      ctx.beginPath();
      ctx.rect(logicalWidth * 0.48, logicalHeight * 0.28, logicalWidth * 0.15, logicalHeight * 0.08);
      ctx.fill(); ctx.stroke();
      
      // Berth B1 & B2 (Container Terminal)
      ctx.beginPath();
      ctx.rect(logicalWidth * 0.43, logicalHeight * 0.48, logicalWidth * 0.15, logicalHeight * 0.09);
      ctx.fill(); ctx.stroke();
      
      // Berth C1 (Liquid Chemical Pier)
      ctx.beginPath();
      ctx.arc(logicalWidth * 0.35, logicalHeight * 0.72, 35, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      
      // Trestle pipe connector
      ctx.beginPath();
      ctx.moveTo(logicalWidth * 0.35, logicalHeight * 0.72);
      ctx.lineTo(logicalWidth * 0.58, logicalHeight * 0.75);
      ctx.strokeStyle = dockColor;
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.lineWidth = 3; // Reset
      
      // Approach channel markings
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(logicalWidth * 0.05, logicalHeight * 0.44);
      ctx.lineTo(logicalWidth * 0.48, logicalHeight * 0.44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(logicalWidth * 0.05, logicalHeight * 0.54);
      ctx.lineTo(logicalWidth * 0.43, logicalHeight * 0.54);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
      
      // Labels
      ctx.fillStyle = textColor;
      ctx.font = 'bold 12px Noto Sans Devanagari, Outfit, sans-serif';
      ctx.fillText('NMPA MAIN APPROACH CHANNEL / एनएमपीए मुख्य पहुंच चैनल', logicalWidth * 0.08, logicalHeight * 0.41);
      
      ctx.fillStyle = theme === 'dark' ? '#f1f5f9' : '#0f172a';
      ctx.fillText('BERTH A1 (GENERAL CARGO) / बर्थ ए1 (सामान्य कार्गो)', logicalWidth * 0.495, logicalHeight * 0.315);
      ctx.fillText('BERTH A2 (BULK DRY) / बर्थ ए2 (बल्क ड्राई)', logicalWidth * 0.495, logicalHeight * 0.345);
      ctx.fillText('BERTH B1 (CONTAINER DECK) / बर्थ बी1 (कंटेनर डेक)', logicalWidth * 0.445, logicalHeight * 0.52);
      ctx.fillText('BERTH B2 (GRAIN SHED) / बर्थ बी2 (अनाज शेड)', logicalWidth * 0.445, logicalHeight * 0.55);
      ctx.fillText('BERTH C1 (LIQUID/LNG) / बर्थ सी1 (तरल/एलएनजी)', logicalWidth * 0.28, logicalHeight * 0.66);
      
      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Noto Sans Devanagari, Outfit, sans-serif';
      ctx.fillText('NEW MANGALORE PORT AUTHORITY (NMPA)', logicalWidth * 0.65, logicalHeight * 0.08);
      ctx.font = '12px Noto Sans Devanagari, Outfit, sans-serif';
      ctx.fillText('MARITIME PLANNERS BOARD / समुद्री योजना बोर्ड', logicalWidth * 0.65, logicalHeight * 0.11);
      
      // Red & Green buoy symbols
      ctx.fillStyle = '#dc2626'; // Red buoy
      ctx.beginPath(); ctx.arc(logicalWidth * 0.2, logicalHeight * 0.44, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#16a34a'; // Green buoy
      ctx.beginPath(); ctx.arc(logicalWidth * 0.2, logicalHeight * 0.54, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      
      // Exclusion anchorage zone
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      ctx.arc(logicalWidth * 0.18, logicalHeight * 0.22, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText('SAFE ANCHORAGE ZONE', logicalWidth * 0.11, logicalHeight * 0.21);
      ctx.fillText('सुरक्षित लंगर क्षेत्र', logicalWidth * 0.13, logicalHeight * 0.235);
    }
  };

  // Convert screen interaction coords to canvas logical coordinates
  const getCanvasCoords = (e) => {
    const canvas = fgCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scale from screen dimensions to standard logical dimensions
    const x = (clientX - rect.left) * (logicalWidth / rect.width);
    const y = (clientY - rect.top) * (logicalHeight / rect.height);
    return { x, y };
  };

  // Save current canvas snapshot to the undo history stack
  const saveSnapshot = (ctx) => {
    const fg = fgCanvasRef.current;
    if (!fg) return;
    
    const snapshot = ctx.getImageData(0, 0, logicalWidth, logicalHeight);
    const nextStep = historyStep + 1;
    
    const newHistory = history.slice(0, nextStep);
    newHistory.push(snapshot);
    
    setHistory(newHistory);
    setHistoryStep(nextStep);
  };

  // Draw arrow utility
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLength = Math.max(12, brushSize * 3);
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = brushColor;
    ctx.fill();
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    const fg = fgCanvasRef.current;
    if (!fg) return;
    const ctx = fg.getContext('2d');
    
    const pos = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(pos);

    // Save temporary snapshot for drag previews (lines/shapes)
    const snapshot = ctx.getImageData(0, 0, logicalWidth, logicalHeight);
    setTempSnapshot(snapshot);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    // Set drawing styles
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = brushOpacity;
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = brushSize * 3; // Make eraser wider
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      if (tool === 'pen') {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleDraw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const fg = fgCanvasRef.current;
    if (!fg) return;
    const ctx = fg.getContext('2d');
    const pos = getCanvasCoords(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } 
    else if (tempSnapshot) {
      // Shape drawing with preview: restore original snapshot and draw overlay
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      ctx.putImageData(tempSnapshot, 0, 0);
      
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.globalAlpha = brushOpacity;
      ctx.globalCompositeOperation = 'source-over';

      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;

      if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } 
      else if (tool === 'rect') {
        ctx.beginPath();
        ctx.rect(startPos.x, startPos.y, dx, dy);
        ctx.stroke();
      } 
      else if (tool === 'circle') {
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } 
      else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
      }
    }
  };

  const handleStopDraw = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const fg = fgCanvasRef.current;
    if (!fg) return;
    const ctx = fg.getContext('2d');
    
    if (tool === 'text') {
      const pos = getCanvasCoords(e);
      const userText = prompt(theme === 'dark' ? 'Enter label text:' : 'लेबल का नाम दर्ज करें / Enter text:');
      if (userText && userText.trim()) {
        ctx.font = `bold ${brushSize * 3 + 14}px Outfit, Noto Sans Devanagari, sans-serif`;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = brushOpacity;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillText(userText, pos.x, pos.y);
      }
    }

    saveSnapshot(ctx);
    setTempSnapshot(null);
  };

  // Undo operation
  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const fg = fgCanvasRef.current;
      if (!fg) return;
      const ctx = fg.getContext('2d');
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      ctx.putImageData(history[prevStep], 0, 0);
      setHistoryStep(prevStep);
    }
  };

  // Redo operation
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const fg = fgCanvasRef.current;
      if (!fg) return;
      const ctx = fg.getContext('2d');
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      ctx.putImageData(history[nextStep], 0, 0);
      setHistoryStep(nextStep);
    }
  };

  // Clear Canvas (removes all drawings on overlay)
  const handleClear = () => {
    if (window.confirm(theme === 'dark' ? 'Clear all drawings?' : 'क्या आप चित्र हटाना चाहते हैं?')) {
      const fg = fgCanvasRef.current;
      if (!fg) return;
      const ctx = fg.getContext('2d');
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      saveSnapshot(ctx);
    }
  };

  // Combine background & drawing canvases and export as PNG
  const handleExport = () => {
    const bg = bgCanvasRef.current;
    const fg = fgCanvasRef.current;
    if (!bg || !fg) return;

    // Create a temporary canvas to merge layers
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = logicalWidth;
    compositeCanvas.height = logicalHeight;
    const ctx = compositeCanvas.getContext('2d');

    // Draw background then foreground
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(fg, 0, 0);

    const imageURL = compositeCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `nmpa_harbor_plan_${Date.now()}.png`;
    link.href = imageURL;
    link.click();
  };

  // Copy composite image to clipboard
  const handleCopyToClipboard = async () => {
    const bg = bgCanvasRef.current;
    const fg = fgCanvasRef.current;
    if (!bg || !fg) return;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = logicalWidth;
    compositeCanvas.height = logicalHeight;
    const ctx = compositeCanvas.getContext('2d');
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(fg, 0, 0);

    try {
      compositeCanvas.toBlob(async (blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          alert('Plan copied to clipboard as image! / योजना इमेज के रूप में क्लिपबोर्ड पर कॉपी की गई!');
        }
      }, 'image/png');
    } catch (err) {
      alert('Failed to copy to clipboard: ' + err.message);
    }
  };

  // Mock integration: Attach sketch to active voyage
  const handleAttachVoyage = () => {
    alert('Sketch successfully attached to active voyage clearance sheet! / स्केच सक्रिय यात्रा निकासी पत्र के साथ संलग्न किया गया!');
  };

  return (
    <div className="content-area" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 0.5rem 1.5rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSignature size={24} style={{ color: 'var(--secondary)' }} />
            {t('sketchpad') || 'Marine Sketchpad / समुद्री स्केचपैड'}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {t('sketchpadSub') || 'Interactive chart annotator, docking planner, and digital signature board'}
          </p>
        </div>
        
        {/* Undo/Redo & Utility floating tools */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '6px', borderRadius: '12px', boxShadow: 'var(--glass-shadow)' }}>
          <button 
            className="action-btn" 
            onClick={handleUndo} 
            disabled={historyStep <= 0}
            title="Undo"
            style={{ opacity: historyStep <= 0 ? 0.4 : 1 }}
          >
            <Undo size={16} />
          </button>
          <button 
            className="action-btn" 
            onClick={handleRedo} 
            disabled={historyStep >= history.length - 1}
            title="Redo"
            style={{ opacity: historyStep >= history.length - 1 ? 0.4 : 1 }}
          >
            <Redo size={16} />
          </button>
          <span style={{ borderRight: '1px solid var(--border)', margin: '0 4px' }} />
          <button 
            className="action-btn text-danger" 
            onClick={handleClear} 
            title="Clear all drawings"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', alignItems: 'start' }} className="sketch-grid-wrapper">
        
        {/* Control Toolbar (Left Side) */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem', position: 'sticky', top: '10px', background: 'var(--glass)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
          
          {/* Background Presets */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary)' }}>
              <Map size={14} />
              {t('canvasBackground') || 'Canvas Background'}
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={() => setBgType('map')} 
                className={`btn btn-sm ${bgType === 'map' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', display: 'flex', gap: '8px', width: '100%' }}
              >
                <Map size={14} /> {t('portMap') || 'NMPA Berth Map'}
              </button>
              <button 
                onClick={() => setBgType('grid')} 
                className={`btn btn-sm ${bgType === 'grid' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', display: 'flex', gap: '8px', width: '100%' }}
              >
                <Grid size={14} /> {t('blueprintGrid') || 'Blueprint Grid'}
              </button>
              <button 
                onClick={() => setBgType('blank')} 
                className={`btn btn-sm ${bgType === 'blank' ? 'btn-primary' : 'btn-outline'}`}
                style={{ justifyContent: 'flex-start', display: 'flex', gap: '8px', width: '100%' }}
              >
                <Maximize2 size={14} /> {t('blankCanvas') || 'Blank Canvas'}
              </button>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

          {/* Draw Tools */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary)' }}>
              <PenTool size={14} />
              {t('drawTool') || 'Drawing Tool'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button 
                onClick={() => setTool('pen')} 
                className={`btn btn-sm ${tool === 'pen' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolPen') || 'Freehand Pen'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <PenTool size={14} style={{ marginRight: '4px' }} /> Pen
              </button>
              <button 
                onClick={() => setTool('eraser')} 
                className={`btn btn-sm ${tool === 'eraser' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolEraser') || 'Eraser'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <Eraser size={14} style={{ marginRight: '4px' }} /> Eraser
              </button>
              <button 
                onClick={() => setTool('line')} 
                className={`btn btn-sm ${tool === 'line' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolLine') || 'Straight Line'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <TrendingUp size={14} style={{ marginRight: '4px', transform: 'rotate(45deg)' }} /> Line
              </button>
              <button 
                onClick={() => setTool('arrow')} 
                className={`btn btn-sm ${tool === 'arrow' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolArrow') || 'Arrow'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <TrendingUp size={14} style={{ marginRight: '4px' }} /> Arrow
              </button>
              <button 
                onClick={() => setTool('rect')} 
                className={`btn btn-sm ${tool === 'rect' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolRect') || 'Rectangle'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <Square size={14} style={{ marginRight: '4px' }} /> Box
              </button>
              <button 
                onClick={() => setTool('circle')} 
                className={`btn btn-sm ${tool === 'circle' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolCircle') || 'Circle'}
                style={{ padding: '6px', fontSize: '0.75rem' }}
              >
                <Circle size={14} style={{ marginRight: '4px' }} /> Circle
              </button>
              <button 
                onClick={() => setTool('text')} 
                className={`btn btn-sm ${tool === 'text' ? 'btn-primary' : 'btn-outline'}`}
                title={t('toolText') || 'Text Label'}
                style={{ padding: '6px', gridColumn: 'span 2', fontSize: '0.75rem' }}
              >
                <Type size={14} style={{ marginRight: '4px' }} /> Text Label
              </button>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

          {/* Color Palettes */}
          {tool !== 'eraser' && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '8px', color: 'var(--primary)' }}>
                {t('drawColor') || 'Brush Color'}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {colors.map((c) => (
                  <button 
                    key={c.value}
                    onClick={() => setBrushColor(c.value)}
                    title={c.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: c.value,
                      border: brushColor === c.value ? '2px solid var(--secondary)' : '1.5px solid rgba(0,0,0,0.15)',
                      boxShadow: brushColor === c.value ? '0 0 6px rgba(0,0,0,0.2)' : 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                    className="color-dot"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size & Opacity sliders */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>{t('brushSize') || 'Brush Size'}</span>
              <span>{brushSize}px</span>
            </div>
            <input 
              type="range" 
              min={1} 
              max={30} 
              value={brushSize} 
              onChange={(e) => setBrushSize(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>{t('brushOpacity') || 'Opacity'}</span>
              <span>{Math.round(brushOpacity * 100)}%</span>
            </div>
            <input 
              type="range" 
              min={0.1} 
              max={1} 
              step={0.05} 
              value={brushOpacity} 
              onChange={(e) => setBrushOpacity(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleExport} style={{ gap: '8px', fontSize: '0.8rem' }}>
              <Download size={14} /> {t('downloadSketch') || 'Export PNG'}
            </button>
            <button className="btn btn-outline" onClick={handleCopyToClipboard} style={{ gap: '8px', fontSize: '0.8rem' }}>
              <Copy size={14} /> {t('copySketch') || 'Copy to Clipboard'}
            </button>
            <button className="btn btn-outline" onClick={handleAttachVoyage} style={{ gap: '8px', borderStyle: 'dashed', borderColor: 'var(--secondary)', color: 'var(--primary)', fontSize: '0.8rem' }}>
              <CheckCircle size={14} style={{ color: 'var(--secondary)' }} /> {t('attachToVoyage') || 'Attach Voyage Plan'}
            </button>
          </div>
        </div>

        {/* Canvas Display View (Right Side) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Canvas Wrapper */}
          <div 
            className="sketch-canvas-container" 
            style={{ 
              position: 'relative', 
              width: '100%', 
              aspectRatio: '1200 / 700',
              borderRadius: '20px', 
              overflow: 'hidden', 
              boxShadow: 'var(--glass-shadow)', 
              border: '2px solid var(--glass-border)',
              background: theme === 'dark' ? '#090d16' : '#f8fafc',
              touchAction: 'none'
            }}
          >
            {/* Background Canvas Layer */}
            <canvas 
              ref={bgCanvasRef}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 1
              }}
            />

            {/* Foreground User Drawing Canvas Layer */}
            <canvas 
              ref={fgCanvasRef}
              onMouseDown={handleStartDraw}
              onMouseMove={handleDraw}
              onMouseUp={handleStopDraw}
              onMouseLeave={handleStopDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleDraw}
              onTouchEnd={handleStopDraw}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 2,
                cursor: tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : 'crosshair'
              }}
            />
          </div>
          
          {/* Helper notes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            <span>💡 Draw with mouse or touch. Switch layers using the backgrounds panel.</span>
            <span>Dimensions: {logicalWidth} x {logicalHeight} px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
