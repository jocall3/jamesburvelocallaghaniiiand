import React, { useEffect, useRef, useMemo } from 'react';

// -----------------------------------------------------------------------------
// Types derived from Nethereum.Contracts.IntegrationTests.EVM.ExternalTrace
// -----------------------------------------------------------------------------

export interface ExternalTrace {
  pc: number;
  op: string;
  gas: number;
  gasCost: number;
  depth: number;
  stack: string[];
  memory: string[];
}

interface TraceVisualizerProps {
  trace: ExternalTrace[];
  currentIndex: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Helper Components
// -----------------------------------------------------------------------------

const DataRow = ({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) => (
  <div className="flex justify-between items-center py-1 border-b border-white/5 last:border-0 font-mono text-xs">
    <span className="text-slate-400">{label}</span>
    <span className={`${highlight ? 'text-cyan-400 font-bold' : 'text-slate-200'} truncate ml-4`}>
      {value}
    </span>
  </div>
);

const HexValue = ({ value, isNew }: { value: string; isNew: boolean }) => (
  <div
    className={`
      font-mono text-[10px] leading-tight px-2 py-1 rounded mb-1 transition-all duration-300
      ${isNew ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' : 'bg-black/20 text-slate-400 border border-white/5'}
    `}
  >
    {value}
  </div>
);

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const TraceVisualizer: React.FC<TraceVisualizerProps> = ({
  trace,
  currentIndex,
  className = "",
}) => {
  const scrollRefStack = useRef<HTMLDivElement>(null);
  const scrollRefMemory = useRef<HTMLDivElement>(null);

  const currentStep = trace[currentIndex];
  const previousStep = currentIndex > 0 ? trace[currentIndex - 1] : null;

  // Auto-scroll logic for stack updates
  useEffect(() => {
    if (scrollRefStack.current) {
      scrollRefStack.current.scrollTop = 0; // Keep top of stack visible (EVM stack grows downwards visually here)
    }
  }, [currentStep?.stack.length]);

  if (!currentStep) {
    return (
      <div className={`flex items-center justify-center h-full text-slate-500 font-mono text-sm ${className}`}>
        WAITING FOR TRACE DATA...
      </div>
    );
  }

  // Calculate stack differences to highlight changes
  const processedStack = useMemo(() => {
    // Reverse stack for display (Top of stack at top of list)
    const reversed = [...currentStep.stack].reverse();
    const prevReversed = previousStep ? [...previousStep.stack].reverse() : [];
    
    return reversed.map((val, idx) => ({
      value: val,
      isNew: val !== prevReversed[idx]
    }));
  }, [currentStep, previousStep]);

  // Format memory into chunks of 32 bytes (64 hex chars) if needed, 
  // though ExternalTrace.Memory is typically already a list of 32-byte words.
  const processedMemory = currentStep.memory.map((val, idx) => ({
    value: val,
    isNew: previousStep ? val !== previousStep.memory[idx] : true
  }));

  const gasPercentage = currentStep.gas > 0 
    ? Math.min(100, Math.max(0, (currentStep.gasCost / currentStep.gas) * 100))
    : 0;

  return (
    <div className={`relative flex flex-col h-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl ${className}`}>
      
      {/* --- Header / Status Panel --- */}
      <div className="flex-none p-4 border-b border-white/10 bg-black/20">
        <div className="flex justify-between items-end mb-2">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Opcode
            </div>
            <div className="text-3xl font-black text-white tracking-tight font-mono">
              {currentStep.op}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Program Counter
            </div>
            <div className="font-mono text-cyan-400">
              {currentStep.pc} <span className="text-slate-600">dec</span>
            </div>
          </div>
        </div>

        {/* Gas Meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>GAS: {currentStep.gas}</span>
            <span className="text-pink-400">COST: {currentStep.gasCost}</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, (currentStep.gasCost / 30000000) * 10000)}%` }} // Visual scaling for effect
            />
          </div>
        </div>
      </div>

      {/* --- Main Data Grid --- */}
      <div className="flex-1 flex min-h-0 divide-x divide-white/10">
        
        {/* Left Col: Execution Context */}
        <div className="w-1/3 p-4 flex flex-col space-y-4 bg-white/[0.02]">
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3 border-b border-white/5 pb-1">
              Context
            </h4>
            <DataRow label="Depth" value={currentStep.depth} />
            <DataRow label="Stack Size" value={currentStep.stack.length} />
            <DataRow label="Memory Size" value={currentStep.memory.length} />
            <DataRow label="Step" value={currentIndex} highlight />
          </div>
        </div>

        {/* Middle Col: Stack (The Hot Path) */}
        <div className="w-1/3 flex flex-col bg-white/[0.01]">
          <div className="flex-none p-2 border-b border-white/5 bg-black/10">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-center">
              Stack (Top)
            </h4>
          </div>
          <div 
            ref={scrollRefStack}
            className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {processedStack.length === 0 ? (
              <div className="text-center text-xs text-slate-600 mt-10 italic">Empty Stack</div>
            ) : (
              processedStack.map((item, i) => (
                <div key={i} className="flex group">
                  <span className="w-6 flex-none text-[8px] text-slate-600 font-mono py-1 select-none">
                    {i}:
                  </span>
                  <HexValue value={item.value} isNew={item.isNew} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Memory */}
        <div className="w-1/3 flex flex-col bg-white/[0.01]">
          <div className="flex-none p-2 border-b border-white/5 bg-black/10">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-center">
              Memory
            </h4>
          </div>
          <div 
            ref={scrollRefMemory}
            className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {processedMemory.length === 0 ? (
              <div className="text-center text-xs text-slate-600 mt-10 italic">No Memory Expanded</div>
            ) : (
              processedMemory.map((item, i) => (
                <div key={i} className="mb-2">
                  <div className="text-[8px] text-slate-600 font-mono mb-0.5 select-none">
                    [{i * 32}]:
                  </div>
                  <HexValue value={item.value} isNew={item.isNew} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Decoration / Footer --- */}
      <div className="flex-none h-1 w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
    </div>
  );
};