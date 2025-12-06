
import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from 'recharts';

// --- Mock Data Generation ---

interface CompanyData {
  name: string;
  index: number;
  region: 'NA' | 'EU' | 'APAC' | 'LATAM';
  trend: 'up' | 'down' | 'stable';
  marketCap: number; // Used for 3D simulation representation (scatter size/position)
}

const COMPANY_NAMES = [
  'ApexFinTech', 'GlobalPay', 'SecureLedger', 'QuantumTrade', 'NexusBank',
  'VentureFlow', 'DataVault', 'SmartAssets', 'EcoCapital', 'FutureHold',
  'InnovateX', 'SynthInvest', 'CoreWallet', 'ZenithCap', 'PioneerFin',
  'AlphaOne', 'BetaCore', 'GammaLink', 'DeltaSys', 'EpsilonNet',
  'ZetaCorp', 'EtaFund', 'ThetaTrade', 'IotaBank', 'KappaSys',
  'LambdaFlow', 'MuInvest', 'NuAssets', 'XiWallet', 'OmicronCap',
  'PiTrade', 'RhoOne', 'SigmaCore', 'TauLink', 'UpsilonSys',
  'PhiFlow', 'ChiInvest', 'PsiAssets', 'OmegaWallet', 'AetherCap',
  'BlazeTrade', 'CypherOne', 'DynaCore', 'EchoLink', 'FjordSys',
  'GigaFlow', 'HaloInvest', 'InertiaAssets', 'JunoWallet', 'KiloCap',
  'LuminTrade', 'MetoOne', 'NovaCore', 'OpalLink', 'PulsarSys',
  'QuasarFlow', 'RiftInvest', 'StellarAssets', 'TerraWallet', 'UranusCap',
  'VeloTrade', 'WarpOne', 'XyloCore', 'YottaLink', 'ZephyrSys',
  'AxiomFlow', 'BrioInvest', 'CelerAssets', 'DiverWallet', 'EmberCap',
  'FluxTrade', 'GlimmerOne', 'HalyconCore', 'IgnisLink', 'JoltSys',
  'KryptonFlow', 'LassoInvest', 'MimasAssets', 'NebulaWallet', 'OrbitCap',
  'PolarTrade', 'QuillOne', 'RuneCore', 'SolaraLink', 'TorusSys',
  'UnifyFlow', 'VortexInvest', 'WispAssets', 'XenonWallet', 'YuleCap',
  'ZonalTrade', 'AuraOne', 'BoltCore', 'CrestLink', 'DuneSys',
  'EpochFlow', 'FableInvest', 'GridAssets', 'HelixWallet', 'IcarusCap',
  'JouleTrade'
];

const REGIONS: CompanyData['region'][] = ['NA', 'EU', 'APAC', 'LATAM'];

const generateInitialData = (): CompanyData[] => {
  return COMPANY_NAMES.slice(0, 100).map((name, i) => {
    const region = REGIONS[i % 4];
    const baseIndex = 1000 + Math.random() * 500;
    let trend: CompanyData['trend'] = 'stable';
    
    if (i % 5 === 0) trend = 'up';
    if (i % 7 === 0) trend = 'down';
    
    const marketCap = 100 + Math.pow(Math.random(), 3) * 5000; // Simulate market cap variance

    return {
      name,
      index: Math.round(baseIndex * (1 + (Math.random() - 0.5) * 0.05)),
      region,
      trend,
      marketCap,
    };
  });
};

// --- Component: MarketPoint3D (Simulated 3D point representation using Scatter size/position) ---

interface MarketPointProps {
  x?: number; // Y-Axis value (Index) - made optional for safety, though recharts provides it
  y?: number; // X-Axis value (Region/Arbitrary spread)
  size?: number; // Market Cap influence
  color?: string;
  payload?: CompanyData;
  cx?: number;
  cy?: number;
}

const MarketPoint3D: React.FC<MarketPointProps> = (props) => {
  const { cx, cy, size, color, payload } = props;

  // In a real 3D environment, we'd use transforms. Here, we map size to depth/z-effect and
  // use the 'y' position on the chart as the horizontal spread, and 'x' as the vertical elevation.
  // We use the custom dot renderer in Recharts to position elements.

  if (!cx || !cy || !size) return null;

  // Simulating depth based on size (market cap)
  const effectiveSize = Math.sqrt(size) * 1.5; // Scale size for better visual effect
  const depthEffect = (size / 5000) * 50; // Max depth offset of 50px

  // Calculate position based on region index (for visual separation)
  const regionMap: { [key in CompanyData['region']]: number } = {
    NA: 0.1,
    EU: 0.35,
    APAC: 0.6,
    LATAM: 0.85,
  };
  
  // Recharts layout automatically maps X and Y to the axes. 
  // We use the custom tooltip to convey the "3D" feel through text and size representation.
  
  return (
    <circle 
      cx={cx} // x-coordinate on chart
      cy={cy} // y-coordinate on chart
      r={effectiveSize / 4 + 2} // Radius scaled by market cap
      fill={color} 
      opacity={0.8}
      stroke="#fff"
      strokeWidth={1}
    />
  );
};

// --- Component: CustomTooltip for 3D effect ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as CompanyData;
    
    // Calculate visual depth/perspective based on market cap
    const sizeRatio = dataPoint.marketCap / 5000;
    const depth = Math.round(sizeRatio * 100); // 0 to 100 scale depth
    const indexValue = payload[0].value;

    return (
      <div className="p-3 bg-gray-900 bg-opacity-90 border border-yellow-500 text-white rounded shadow-lg text-xs font-mono">
        <p className="font-bold text-yellow-400 mb-1">{dataPoint.name}</p>
        <p>Region: <span className="font-semibold">{dataPoint.region}</span></p>
        <p>Index Value: <span className={`font-bold ${dataPoint.trend === 'up' ? 'text-green-400' : dataPoint.trend === 'down' ? 'text-red-400' : 'text-white'}`}>{indexValue.toFixed(2)}</span></p>
        <p>Market Cap (Relative): {dataPoint.marketCap.toFixed(0)}B</p>
        <p className="mt-1 border-t border-gray-700 pt-1">
          Simulated Depth (Z-Axis): <span className="text-blue-300">{depth}%</span> (Larger Cap = Closer/Higher)
        </p>
      </div>
    );
  }
  return null;
};

// --- Main Component: GlobalMarketMap ---

const GlobalMarketMap: React.FC = () => {
  const [marketData, setMarketData] = useState<CompanyData[]>([]);
  const [time, setTime] = useState(0);

  // Initialize and Update Data (Simulating market fluctuations)
  useEffect(() => {
    setMarketData(generateInitialData());

    const interval = setInterval(() => {
      setTime(t => t + 1);
      setMarketData(prevData => {
        return prevData.map(company => {
          const volatility = (Math.random() - 0.5) * 0.01; // +/- 1% max swing per tick
          let newIndex = company.index * (1 + volatility);

          // Keep index somewhat realistic (1000 +/- 10%)
          if (newIndex < 900) newIndex = 900 + Math.random() * 50;
          if (newIndex > 1200) newIndex = 1200 - Math.random() * 50;
          
          // Simple trend persistence simulation
          if (company.trend === 'up' && Math.random() > 0.95) company.trend = 'stable';
          if (company.trend === 'down' && Math.random() > 0.95) company.trend = 'stable';
          
          return {
            ...company,
            index: newIndex,
          };
        });
      });
    }, 1500); // Update every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  // Process data for charting: We use the structure required by Recharts.
  // To simulate a "map," we use the Region as the X-Axis categories (or we can use numerical mapping for Scatter plots).
  
  // For this 3D simulation using 2D charts, we map regions to specific numerical slots on the X-axis
  // and use the index value as the Y-axis. We rely on the Scatter component and custom dots.

  const chartData = marketData.map(d => ({
    name: d.region, // Used for grouping if needed, but Scatter is better here
    index: d.index,
    region: d.region,
    marketCap: d.marketCap,
    companyName: d.name,
    trend: d.trend,
  }));

  const regionOrder: CompanyData['region'][] = ['NA', 'EU', 'APAC', 'LATAM'];

  // Map Company data to Scatter points, leveraging the structure for rendering
  const scatterPoints = marketData.map((d, i) => {
    // Map Region to a numerical X position for separation on the chart floor
    const regionXPosition = regionOrder.indexOf(d.region); 
    
    // Use the index for the Y position (Elevation)
    // Use regionXPosition for the X position (Horizontal spread across the "map")
    
    let color = '#ccc';
    if (d.trend === 'up') color = '#10B981'; // Emerald Green
    if (d.trend === 'down') color = '#EF4444'; // Red
    if (d.region === 'NA') color = '#3B82F6'; // Blue
    if (d.region === 'EU') color = '#6366F1'; // Indigo
    if (d.region === 'APAC') color = '#F59E0B'; // Amber
    if (d.region === 'LATAM') color = '#EC4899'; // Pink
    
    return {
      x: regionXPosition, // X-coordinate on chart (Region separation)
      y: d.index,        // Y-coordinate on chart (Index Value/Elevation)
      size: d.marketCap, // Used in custom dot renderer for depth simulation
      color: color,
      payload: d,
    };
  });


  return (
    <div className="w-full h-[500px] bg-gray-950 p-4 rounded-lg shadow-2xl border border-yellow-600">
      <h2 className="text-xl font-bold text-yellow-400 mb-2">
        The Balcony of Prosperity: Global Market Index Simulation ({time})
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        100 Simulated Million Dollar View Companies visualized in 3D perspective using Scatter plot depth (Market Cap).
      </p>
      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart
          data={[{ x: 0, y: 0 }]} // Dummy data for structure, Scatter handles the points
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          
          {/* X-Axis represents the four major regions */}
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={[-0.5, regionOrder.length - 0.5]}
            ticks={regionOrder.map((_, i) => i)}
            tickFormatter={(tick) => regionOrder[tick]}
            stroke="#9CA3AF"
            label={{ value: 'Geographic Region', position: 'bottom', fill: '#D1D5DB' }}
          />
          
          {/* Y-Axis represents the Index Value (The "Height" or Prosperity Level) */}
          <YAxis 
            domain={[950, 1250]}
            stroke="#9CA3AF"
            label={{ value: 'Index Level (Value)', angle: -90, position: 'left', fill: '#D1D5DB' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="top" align="right" wrapperStyle={{ color: 'white' }} />

          {/* Scatter component to render the individual company points */}
          <Scatter 
            data={scatterPoints} 
            shape={<MarketPoint3D />} 
            isAnimationActive={false} // Turn off animation for stable visualization
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GlobalMarketMap;
