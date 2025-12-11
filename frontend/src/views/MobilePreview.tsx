import React, { useState, useRef, useEffect } from 'react';

// Icons using inline SVG to avoid external dependencies
const IconSmartphone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);
const IconTablet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);
const IconRotate = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
);
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
);

interface DeviceConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'phone' | 'tablet';
}

// Common device presets
const DEVICES: DeviceConfig[] = [
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, type: 'phone' },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, type: 'phone' },
  { id: 'iphone-14-pro-max', name: 'iPhone 14 Pro Max', width: 430, height: 932, type: 'phone' },
  { id: 'pixel-7', name: 'Pixel 7', width: 412, height: 915, type: 'phone' },
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, type: 'tablet' },
  { id: 'ipad-air', name: 'iPad Air', width: 820, height: 1180, type: 'tablet' },
];

const MobilePreview: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(DEVICES[1].id);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale, setScale] = useState<number>(0.85);
  const [url, setUrl] = useState<string>('http://localhost:3000');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedDevice = DEVICES.find(d => d.id === selectedDeviceId) || DEVICES[1];

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      // Force reload by resetting src
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if(iframeRef.current) iframeRef.current.src = currentSrc;
      }, 50);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRefresh();
    }
  };

  useEffect(() => {
    // Inject keyframes for spinner animation
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const getDimensions = () => {
    if (orientation === 'landscape') {
      return { width: selectedDevice.height, height: selectedDevice.width };
    }
    return { width: selectedDevice.width, height: selectedDevice.height };
  };

  const { width, height } = getDimensions();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerControls}>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter URL to preview..."
            />
            <button style={styles.iconBtn} onClick={handleRefresh} title="Reload Frame">
              <IconRefresh />
            </button>
          </div>
          
          <div style={styles.divider} />

          <div style={styles.deviceSelector}>
            {DEVICES.map(device => (
              <button
                key={device.id}
                onClick={() => setSelectedDeviceId(device.id)}
                style={{
                  ...styles.deviceBtn,
                  backgroundColor: selectedDeviceId === device.id ? '#e0e7ff' : 'transparent',
                  color: selectedDeviceId === device.id ? '#4338ca' : '#6b7280',
                }}
                title={device.name}
              >
                {device.type === 'phone' ? <IconSmartphone /> : <IconTablet />}
              </button>
            ))}
          </div>

          <div style={styles.divider} />

          <button 
            style={styles.iconBtn} 
            onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
            title="Rotate Orientation"
          >
            <IconRotate />
          </button>

          <div style={styles.sliderContainer}>
            <span style={styles.sliderLabel}>Scale: {Math.round(scale * 100)}%</span>
            <input 
              type="range" 
              min="0.5" 
              max="1.5" 
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>
      </div>

      <div style={styles.previewContainer}>
        <div 
          style={{
            ...styles.deviceShell,
            width: width + 24, // 12px bezel on each side
            height: height + 24,
            transform: `scale(${scale})`,
          }}
        >
          {/* Decorative notches for phone look */}
          <div style={{...styles.notch, opacity: orientation === 'portrait' ? 1 : 0}}></div>
          
          <div style={styles.screenArea}>
             {isLoading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner} />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={url}
              style={styles.iframe}
              onLoad={() => setIsLoading(false)}
              title="Device Preview"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#f3f4f6',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 20px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '1200px',
    width: '100%',
    flexWrap: 'wrap',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: '200px',
    maxWidth: '400px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#e5e7eb',
  },
  deviceSelector: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f9fafb',
    padding: '4px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  deviceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sliderLabel: {
    fontSize: '12px',
    color: '#6b7280',
    minWidth: '70px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  slider: {
    width: '100px',
    cursor: 'pointer',
  },
  previewContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    padding: '40px',
    backgroundColor: '#f3f4f6',
    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  deviceShell: {
    position: 'relative',
    backgroundColor: '#1f2937',
    borderRadius: '36px',
    padding: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: 'width 0.3s ease, height 0.3s ease, transform 0.2s',
    border: '2px solid #374151',
    boxSizing: 'border-box',
  },
  notch: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120px',
    height: '24px',
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    zIndex: 20,
    pointerEvents: 'none',
    transition: 'opacity 0.2s',
  },
  screenArea: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: '24px',
    overflow: 'hidden',
    position: 'relative',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: 'white',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  spinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #e5e7eb',
    borderTopColor: '#4f46e5',
    animation: 'spin 1s linear infinite',
  },
};

export default MobilePreview;