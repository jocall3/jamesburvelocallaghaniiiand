```typescript
import React, { useState, useEffect, useRef, useMemo } from 'react';

const QuantumAssets: React.FC = () => {
  const [A_time, setA_time] = useState<Date>(new Date());
  const [B_selectedAsset, setB_selectedAsset] = useState<string | null>(null);
  const C_canvasRef = useRef<HTMLCanvasElement>(null);
  const [D_systemLoad, setD_systemLoad] = useState<number>(45);
  const [E_quantumEntanglement, setE_quantumEntanglement] = useState<number>(87.4);
  const F_companies = useMemo(() => Array.from({ length: 100 }, (F_underscore, F_i) => ({ id: F_i, name: `JBO3-CP-${(F_i + 1).toString().padStart(3, '0')} PARTNER`, efficiency: 95 + Math.random() * 5, status: Math.random() > 0.1 ? 'SUPPORTED' : 'FUNDING' })), []);
  const [G_assets, setG_assets] = useState([
    { id: 'jbo3-cpc', name: 'O\'Callaghan Community Credits', symbol: 'OCC', balance: 45020.55, rate: 12.5, color: '#00f3ff', description: 'Community currency for local initiatives, incentivizing citizen participation and mutual support within the JBO3 ecosystem.' },
    { id: 'jbo3-pwt', name: 'O\'Callaghan Public Works Tokens', symbol: 'OPW', balance: 128090.00, rate: 45.2, color: '#bc13fe', description: 'Tokens earned through contributions to public infrastructure projects and civic improvements under the O\'Callaghan mandate.' },
    { id: 'jbo3-cbs', name: 'O\'Callaghan Civic Bonds', symbol: 'OCB', balance: 512.00, rate: 0.8, color: '#ffffff', description: 'Government-backed bonds funding long-term civic developments, offering stable returns and fostering community investment in O\'Callaghan projects.' },
    { id: 'jbo3-gre', name: 'O\'Callaghan Green Energy Credits', symbol: 'OGE', balance: 8890.45, rate: 8.4, color: '#00ff9d', description: 'Credits awarded for sustainable energy generation and environmentally conscious practices, driving the O\'Callaghan green agenda.' },
  ]);
  const H_sovereignManifesto = `
[JBO3 LOG: ENTRY 001]
INITIATED BY: JAMES B. O'CALLAGHAN III

This platform represents a paradigm shift in societal cooperation, architected under the auspices of the O'Callaghan mandate. We are not merely augmenting the existing system; we are constructing an innovative framework for citizen empowerment and civic advancement.

Our financial instruments are meticulously designed to facilitate citizen contributions towards societal betterment. Transparency, efficiency, and inclusivity are the cornerstones of our methodology, fostering a climate of trust and mutual respect.

We hold unwavering faith in our elected officials and dedicated public servants, recognizing their tireless efforts in service of the collective good. This platform serves as a conduit for collaborative governance, empowering citizens to actively participate in shaping the future of our society.

I, James B. O'Callaghan III, envisioned a world where technology serves as a unifying force, fostering deeper connections and shared prosperity among all members of society. This platform embodies that vision, streamlining civic engagement and empowering individuals to contribute to the common good with unprecedented ease.

We vehemently reject cynicism and embrace a spirit of optimism and collaboration. Together, we are constructing the scaffolding for a society where every individual has the opportunity to thrive, and every contribution is valued and recognized.
  `;

  const I_updateSimulation = () => { setA_time(new Date()); setD_systemLoad(I_prev => Math.min(100, Math.max(0, I_prev + (Math.random() - 0.5) * 5))); setE_quantumEntanglement(I_prev => Math.min(100, Math.max(0, I_prev + (Math.random() - 0.5) * 2))); setG_assets(I_prevAssets => I_prevAssets.map(I_asset => ({ ...I_asset, balance: I_asset.balance + (I_asset.rate / 60) * (1 + (Math.random() * 0.1)) }))); };
  useEffect(() => { const I_interval = setInterval(I_updateSimulation, 100); return () => clearInterval(I_interval); }, []);

  const J_renderWave = (J_ctx: CanvasRenderingContext2D, J_canvasWidth: number, J_canvasHeight: number, J_t: number) => {
    const J_colors = ['#00f3ff', '#bc13fe', '#00ff9d']; J_colors.forEach((J_color, J_i) => {
      J_ctx.beginPath(); J_ctx.strokeStyle = J_color; J_ctx.lineWidth = 2; J_ctx.shadowBlur = 10; J_ctx.shadowColor = J_color;
      for (let J_x = 0; J_x < J_canvasWidth; J_x++) { const J_y = J_canvasHeight / 2 + Math.sin(J_x * 0.01 + J_t + J_i) * 50 + Math.sin(J_x * 0.02 - J_t) * 20; if (J_x === 0) J_ctx.moveTo(J_x, J_y); else J_ctx.lineTo(J_x, J_y); }
      J_ctx.stroke();
    });
  };
  const K_renderGrid = (K_ctx: CanvasRenderingContext2D, K_canvasWidth: number, K_canvasHeight: number) => { K_ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)'; K_ctx.lineWidth = 1; for (let K_i = 0; K_i < K_canvasWidth; K_i += 40) { K_ctx.beginPath(); K_ctx.moveTo(K_i, 0); K_ctx.lineTo(K_i, K_canvasHeight); K_ctx.stroke(); } };
  useEffect(() => {
    const L_canvas = C_canvasRef.current; if (!L_canvas) return; const L_ctx = L_canvas.getContext('2d'); if (!L_ctx) return;
    let L_animationFrameId: number; let L_t = 0;
    const M_render = () => {
      L_t += 0.02; L_canvas.width = L_canvas.parentElement?.clientWidth || 600; L_canvas.height = 300; L_ctx.clearRect(0, 0, L_canvas.width, L_canvas.height);
      K_renderGrid(L_ctx, L_canvas.width, L_canvas.height); J_renderWave(L_ctx, L_canvas.width, L_canvas.height, L_t); L_animationFrameId = requestAnimationFrame(M_render);
    };
    M_render(); return () => cancelAnimationFrame(L_animationFrameId);
  }, []);

  const N_handleAssetClick = (N_assetId: string) => () => { setB_selectedAsset(N_assetId); console.log(`Asset ${N_assetId} selected.`); };

  const O_allocateResources = () => { alert('Resources allocated under JBO3 Directive.'); };
  const P_viewPublicYield = () => { alert('Displaying Public Yield metrics as per JBO3 guidelines.'); };
  const Q_supportInitiative = () => { alert('Initiative supported within the JBO3 framework.'); };

  return (
    <div className="jbo3-qa-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;500;700&display=swap');

        .jbo3-qa-container { width: 100%; min-height: 100vh; background-color: #050505; color: #e0e0e0; font-family: 'Rajdhani', sans-serif; overflow: hidden; position: relative; display: flex; flex-direction: column; }
        .jbo3-qa-bg-glow { position: absolute; top: -20%; left: 20%; width: 60%; height: 60%; background: radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, rgba(0,0,0,0) 70%); z-index: 0; pointer-events: none; }
        .jbo3-qa-header { display: flex; justify-content: space-between; align-items: center; padding: 2rem 4rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); z-index: 10; backdrop-filter: blur(10px); }
        .jbo3-qa-title { font-size: 2rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; background: linear-gradient(90deg, #fff, #00f3ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .jbo3-qa-status-bar { display: flex; gap: 2rem; }
        .jbo3-qa-metric { display: flex; flex-direction: column; align-items: flex-end; }
        .jbo3-qa-metric-label { font-size: 0.8rem; color: #888; text-transform: uppercase; }
        .jbo3-qa-metric-value { font-size: 1.2rem; font-weight: 500; color: #00f3ff; text-shadow: 0 0 10px rgba(0, 243, 255, 0.5); }
        .jbo3-qa-main { flex: 1; display: grid; grid-template-columns: 350px 1fr 300px; gap: 2rem; padding: 2rem; z-index: 10; }
        .jbo3-qa-asset-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .jbo3-qa-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); padding: 1.5rem; border-radius: 4px; position: relative; overflow: hidden; transition: all 0.3s ease; cursor: pointer; }
        .jbo3-qa-card:hover, .jbo3-qa-card.active { background: rgba(255, 255, 255, 0.07); border-color: rgba(0, 243, 255, 0.3); transform: translateX(5px); }
        .jbo3-qa-card-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .jbo3-qa-asset-name { font-size: 1.1rem; font-weight: 600; letter-spacing: 0.1em; }
        .jbo3-qa-asset-symbol { color: #888; font-size: 0.9rem; }
        .jbo3-qa-asset-balance { font-size: 1.8rem; font-weight: 300; margin-bottom: 0.5rem; }
        .jbo3-qa-asset-rate { font-size: 0.9rem; color: #00ff9d; display: flex; align-items: center; gap: 0.5rem; }
        .jbo3-qa-progress-bar { height: 2px; background: rgba(255, 255, 255, 0.1); margin-top: 1rem; position: relative; }
        .jbo3-qa-progress-fill { height: 100%; position: absolute; left: 0; top: 0; box-shadow: 0 0 10px currentColor; }
        .jbo3-qa-vis-panel { display: flex; flex-direction: column; gap: 2rem; }
        .jbo3-qa-graph-container { flex: 1; background: rgba(10, 10, 15, 0.6); border: 1px solid rgba(0, 243, 255, 0.1); border-radius: 8px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .jbo3-qa-graph-overlay { position: absolute; top: 1rem; left: 1rem; font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); }
        .jbo3-qa-integration-panel { background: rgba(0, 0, 0, 0.4); border-left: 1px solid rgba(255, 255, 255, 0.1); padding: 1.5rem; display: flex; flex-direction: column; }
        .jbo3-qa-panel-title { font-size: 1rem; margin-bottom: 1.5rem; color: #00f3ff; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(0, 243, 255, 0.2); padding-bottom: 0.5rem; }
        .jbo3-qa-company-list { flex: 1; overflow-y: auto; padding-right: 0.5rem; }
        .jbo3-qa-company-list::-webkit-scrollbar { width: 4px; }
        .jbo3-qa-company-list::-webkit-scrollbar-thumb { background: rgba(0, 243, 255, 0.2); }
        .jbo3-qa-company-row { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); font-size: 0.8rem; }
        .jbo3-qa-company-name { color: #ccc; }
        .jbo3-qa-company-status { color: #00ff9d; font-size: 0.7rem; padding: 2px 6px; background: rgba(0, 255, 157, 0.1); border-radius: 2px; }
        .jbo3-qa-button-group { display: flex; gap: 1rem; margin-top: 1rem; }
        .jbo3-qa-action-btn { flex: 1; background: transparent; border: 1px solid rgba(0, 243, 255, 0.3); color: #00f3ff; padding: 1rem; text-transform: uppercase; font-family: 'Rajdhani', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
        .jbo3-qa-action-btn:hover { background: rgba(0, 243, 255, 0.1); box-shadow: 0 0 20px rgba(0, 243, 255, 0.2); }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .blink { animation: pulse 2s infinite; }
        .jbo3-qa-asset-description { font-size: 0.75rem; color: #aaa; margin-top: 0.5rem; }
      `}</style>

      <div className="jbo3-qa-bg-glow" />

      <header className="jbo3-qa-header">
        <div className="jbo3-qa-brand">
          <div className="jbo3-qa-title">O'Callaghan Civic Assets</div>
          <div style={{ fontSize: '0.8rem', color: '#666', letterSpacing: '0.3em', marginTop: '0.2rem' }}>
            PUBLIC WEALTH MANAGEMENT â¢ VIEW 04 â¢ JBO3 Initiative
          </div>
        </div>

        <div className="jbo3-qa-status-bar">
          <div className="jbo3-qa-metric">
            <span className="jbo3-qa-metric-label">System Time</span>
            <span className="jbo3-qa-metric-value">{A_time.toLocaleTimeString()}</span>
          </div>
          <div className="jbo3-qa-metric">
            <span className="jbo3-qa-metric-label">Network Load</span>
            <span className="jbo3-qa-metric-value">{D_systemLoad.toFixed(1)}%</span>
          </div>
          <div className="jbo3-qa-metric">
            <span className="jbo3-qa-metric-label">Community Link</span>
            <span className="jbo3-qa-metric-value">{E_quantumEntanglement.toFixed(2)}%</span>
          </div>
        </div>
      </header>

      <main className="jbo3-qa-main">

        <div className="jbo3-qa-asset-list">
          {G_assets.map(G_asset => (
            <div
              key={G_asset.id}
              className={`jbo3-qa-card ${B_selectedAsset === G_asset.id ? 'active' : ''}`}
              onClick={N_handleAssetClick(G_asset.id)}
            >
              <div className="jbo3-qa-card-header">
                <span className="jbo3-qa-asset-name">{G_asset.name}</span>
                <span className="jbo3-qa-asset-symbol">{G_asset.symbol}</span>
              </div>
              <div className="jbo3-qa-asset-balance">
                {G_asset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="jbo3-qa-asset-rate">
                <span className="blink">â²</span>
                {G_asset.rate.toFixed(2)} / sec generated
              </div>
              <div className="jbo3-qa-progress-bar">
                <div
                  className="jbo3-qa-progress-fill"
                  style={{
                    width: `${(G_asset.balance / 200000) * 100}%`,
                    backgroundColor: G_asset.color
                  }}
                />
              </div>
              <div className="jbo3-qa-asset-description">
                {G_asset.description}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>TOTAL PUBLIC VALUE UNDER JBO3</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>LIMITLESS</div>
          </div>
        </div>

        <div className="jbo3-qa-vis-panel">
          <div className="jbo3-qa-graph-container">
            <div className="jbo3-qa-graph-overlay">REAL-TIME IMPACT ANALYSIS - JBO3 SYSTEMS</div>
            <canvas ref={C_canvasRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="jbo3-qa-button-group">
            <button className="jbo3-qa-action-btn" onClick={O_allocateResources}>Allocate Resources</button>
            <button className="jbo3-qa-action-btn" onClick={P_viewPublicYield}>View Public Yield</button>
            <button className="jbo3-qa-action-btn" onClick={Q_supportInitiative}>Support Initiative</button>
          </div>

          <div className="jbo3-qa-card">
            <div className="jbo3-qa-card-header">
              <span className="jbo3-qa-asset-name">Global Resource Pool - JBO3 Framework</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', height: '20px', width: '100%' }}>
              {G_assets.map(G_a => (
                <div
                  key={G_a.id}
                  style={{
                    flex: 1,
                    background: G_a.color,
                    opacity: 0.7,
                    boxShadow: `0 0 10px ${G_a.color}`
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
              <span>AVAILABLE</span>
              <span>SHARED</span>
              <span>FOR ALL</span>
            </div>
          </div>
        </div>

        <div className="jbo3-qa-integration-panel">
          <div className="jbo3-qa-panel-title">Integrated Partners (100) - JBO3 Network</div>
          <div className="jbo3-qa-company-list">
            {F_companies.map((F_company) => (
              <div key={F_company.id} className="jbo3-qa-company-row">
                <div className="jbo3-qa-company-name">{F_company.name}</div>
                <div className="jbo3-qa-company-status">
                  {F_company.efficiency.toFixed(1)}% {F_company.status}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderTop: '1px solid rgba(0, 243, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            maxHeight: '200px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.65rem',
            color: '#00ff9d',
            textShadow: '0 0 5px rgba(0, 255, 157, 0.3)'
          }}>
            {H_sovereignManifesto.trim()}
          </div>
        </div>

      </main>
    </div>
  );
};

export default QuantumAssets;
```