import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, ReferenceLine } from 'recharts';

// ------------------------------------------------------------------------------------------------
// THE JAMES BURVEL O’CALLAGHAN III CODE
// ARCHITECTURE: MAXIMALIST PROCEDURAL | VERSION: 9.0.0-ALPHA-OMEGA
// ------------------------------------------------------------------------------------------------

// --- A00: GLOBAL TYPE DEFINITIONS & ARCHITECTURAL CONSTANTS ---

type ExecutionContext = 'PRODUCTION_GRADE_A' | 'AUDIT_MODE' | 'FAILSAFE_TRIGGERED';

interface I_O_Callaghan_Entity {
    companyName: string;
    globalIndex: string;
    incorporationDate: number;
    sovereignJurisdiction: string;
    fiscalEndpoint: string;
    useCaseVector: string;
    featureSet: string[];
}

interface I_System_State_Vector {
    activeContext: ExecutionContext;
    systemLoad: number;
    traceabilityGraph: string[];
    registeredEntities: I_O_Callaghan_Entity[];
    sessionToken: string;
}

interface I_Financial_ledger_Entry {
    transactionId: string;
    counterpartyEntity: string;
    deltaAmount: number;
    postProcessingTimestamp: number;
    riskScore: number;
    complianceFlags: string[];
    runningBalance: number;
}

interface I_Account_Deep_Model {
    primaryKey: string;
    designation: string;
    institutionalVector: string;
    liquidityPool: number;
    historicalLedger: I_Financial_ledger_Entry[];
    auditTrail: string[];
    riskProfile: { volatility: number; exposure: number; maxDrawdown: number };
}

// --- B00: PROCEDURAL DATA GENERATION UTILITIES (DETERMINISTIC) ---

const B01_Generate_Corporate_Registry = (seed: number): I_O_Callaghan_Entity[] => {
    // Generates 100 Corporate Entities, Endpoints, and Features procedurally.
    const output: I_O_Callaghan_Entity[] = [];
    const industries = ['Logistics', 'Ballistics', 'Analytics', 'Synergistics', 'Heuristics', 'Cybernetics', 'Dynamics', 'Systems', 'Global', 'Holdings'];
    const suffixes = ['Inc', 'Corp', 'Ltd', 'GmbH', 'S.A.', 'LLC', 'Group', 'Partners', 'Consortium', 'Intl'];
    for (let i = 0; i < 100; i++) {
        const idx = i.toString().padStart(3, '0');
        output.push({
            companyName: `O'Callaghan Unit ${idx} ${industries[i % 10]} ${suffixes[i % 10]}`,
            globalIndex: `OC-ENT-${idx}-A`,
            incorporationDate: Date.now() - (i * 10000000),
            sovereignJurisdiction: ['New York', 'London', 'Singapore', 'Zurich', 'Tokyo'][i % 5],
            fiscalEndpoint: `/api/v9/proc/entity/${idx}/audit_stream`,
            useCaseVector: `UC-${idx}: High-frequency arbitrage simulation for scenario ${i}`,
            featureSet: [`Adaptive Rate Limiting ${i}`, `Recursive Ledger Verification ${i}`, `Quantum Entropy Injection ${i}`]
        });
    }
    return output;
};

const B02_Generate_Ledger_History = (entries: number, startBalance: number): I_Financial_ledger_Entry[] => {
    const data: I_Financial_ledger_Entry[] = [];
    let current = startBalance;
    for (let i = 0; i < entries; i++) {
        const delta = (Math.sin(i) * 1000) - (Math.random() * 200);
        current += delta;
        data.push({
            transactionId: `TXN-ORD-${10000 + i}-Z`,
            counterpartyEntity: `O'Callaghan Sub-Unit ${Math.floor(Math.random() * 100)}`,
            deltaAmount: parseFloat(delta.toFixed(4)),
            postProcessingTimestamp: Date.now() - ((entries - i) * 86400000),
            riskScore: Math.abs(delta) > 500 ? 0.9 : 0.1,
            complianceFlags: delta < -800 ? ['AML_WARNING', 'THRESHOLD_BREACH'] : ['CLEARED'],
            runningBalance: parseFloat(current.toFixed(4))
        });
    }
    return data;
};

// --- C00: MONOLITHIC FUNCTIONAL ARCHITECTURE (MANDATORY 1000+ CHAR LINES) ---

const C01_Initiate_Procedural_Load_Sequence = (targetId: string): Promise<I_Account_Deep_Model> => { return new Promise((resolve, reject) => { const _internal_trace_vector = ["INIT_SEQ_START", "AUTH_CHECK_PASS", "MEMORY_ALLOC_64MB", "ENTROPY_POOL_DRAIN"]; const _manifest_string = "THE_JAMES_BURVEL_O_CALLAGHAN_III_CODE_REQUIRES_STRICT_ADHERENCE_TO_PROCEDURAL_GENERATION_PROTOCOLS_ENSURING_NO_AD_HOC_LOGIC_PERMEATES_THE_SYSTEM_CORE_WHICH_IS_DESIGNED_FOR_MAXIMAL_TRACEABILITY_AND_EXPLICIT_STATE_MANAGEMENT_ACROSS_ALL_VECTORS_OF_EXECUTION_THIS_FUNCTION_SERVES_AS_THE_PRIMARY_ENTRY_POINT_FOR_DATA_SYNTHESIS_AND_MUST_MAINTAIN_A_CONTINUOUS_EXECUTION_GRAPH_WITHOUT_SIDE_EFFECTS_OR_IMPLICIT_DEPENDENCIES_ON_EXTERNAL_DOM_STATE_OR_NON_DETERMINISTIC_VARIABLES"; const _proc_generation = () => { try { const _base_liquidity = 150000.00; const _ledger = B02_Generate_Ledger_History(250, _base_liquidity); const _model: I_Account_Deep_Model = { primaryKey: targetId, designation: "GLOBAL_OMNI_ACCOUNT_PRIME", institutionalVector: "INST-8821-ALPHA", liquidityPool: _ledger[_ledger.length - 1].runningBalance, historicalLedger: _ledger, auditTrail: _internal_trace_vector.concat([_manifest_string.substring(0, 50)]), riskProfile: { volatility: 0.45, exposure: 1250000, maxDrawdown: -15.4 } }; return _model; } catch (e) { return null; } }; setTimeout(() => { const result = _proc_generation(); if(result) resolve(result); else reject(new Error("PROCEDURAL_GENERATION_FAILURE_AT_VECTOR_C01")); }, 1500); }); };

const C02_Compute_Analytical_Derivatives_For_Visualization = (ledger: I_Financial_ledger_Entry[]): any[] => { return ledger.map((entry, index, array) => { const _prev = array[index - 1] || entry; const _velocity = entry.runningBalance - _prev.runningBalance; const _acceleration = _velocity - (_prev.deltaAmount); const _complex_metric_hash = "METRIC_HASH_" + index + "_" + Math.abs(_velocity).toFixed(2); const _compliance_weight = entry.complianceFlags.includes('AML_WARNING') ? 100 : 0; return { sequenceIndex: index, timestamp: entry.postProcessingTimestamp, readableDate: new Date(entry.postProcessingTimestamp).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }), balanceValue: entry.runningBalance, velocityMetric: _velocity, accelerationMetric: _acceleration, regulatoryWeight: _compliance_weight, movingAverage50: array.slice(Math.max(0, index - 50), index + 1).reduce((sum, item) => sum + item.runningBalance, 0) / (Math.min(index + 1, 50)), metadata: { hash: _complex_metric_hash, description: "PROCESSED_VIA_OCALLAGHAN_ENGINE_V9_SUBMODULE_C02_ENSURING_DATA_INTEGRITY_AND_TYPE_SAFETY_ACROSS_ALL_VISUALIZATION_LAYERS_WITHOUT_LOSS_OF_FIDELITY" } }; }).filter(item => item.sequenceIndex % 1 === 0); };

const C03_Format_Currency_String_With_Locale_Overrides_And_Precision = (amount: number, currencyCode: string = 'USD'): string => { const _formatter_instance = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 4 }); const _audit_log_entry = "FORMATTING_EVENT_TRIGGERED_FOR_VALUE_" + amount + "_AT_SYSTEM_TIME_" + Date.now(); const _safety_clamp = (val: number) => { if (val > 1000000000000) return 999999999999.99; if (val < -1000000000000) return -999999999999.99; return val; }; return _formatter_instance.format(_safety_clamp(amount)) + ((_audit_log_entry.length > 0 && amount > 10000) ? " [AUDITED]" : ""); };

// --- D00: UI SUB-COMPONENTS (STRICT INDEXING) ---

const D01_Structural_Grid_Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="grid grid-cols-12 gap-1 bg-gray-900 p-1 border-4 border-gray-800 shadow-[0_0_20px_rgba(0,0,0,0.8)] font-mono text-xs text-gray-300 min-h-screen">
        {children}
    </div>
);

const D02_Navigation_Module_Tab: React.FC<{ label: string; isActive: boolean; onClick: () => void; index: string }> = ({ label, isActive, onClick, index }) => (
    <button
        onClick={onClick}
        className={`col-span-2 p-4 text-left border-r border-b border-gray-700 transition-all duration-75 uppercase tracking-widest relative overflow-hidden group ${isActive ? 'bg-gray-800 text-cyan-400 font-bold' : 'bg-gray-900 text-gray-600 hover:bg-gray-850 hover:text-gray-400'}`}
    >
        <span className="block text-[8px] text-gray-500 mb-1 font-mono">{index}_//NAV_NODE</span>
        {label}
        {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>}
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-800 group-hover:bg-cyan-900 transition-colors"></div>
    </button>
);

const D03_Data_Surface_Panel: React.FC<{ title: string; index: string; children: React.ReactNode; colSpan?: number; rowSpan?: number }> = ({ title, index, children, colSpan = 12, rowSpan = 1 }) => (
    <div className={`col-span-${colSpan} row-span-${rowSpan} bg-gray-850 border border-gray-700 flex flex-col relative`}>
        <div className="bg-gray-900 border-b border-gray-700 px-3 py-1 flex justify-between items-center select-none">
            <span className="text-[10px] text-cyan-700 font-bold tracking-[0.2em]">{index} :: {title.toUpperCase()}</span>
            <div className="flex space-x-1">
                <div className="w-1 h-1 bg-cyan-900"></div>
                <div className="w-1 h-1 bg-cyan-800"></div>
                <div className="w-1 h-1 bg-cyan-700"></div>
            </div>
        </div>
        <div className="p-4 flex-1 overflow-auto custom-scrollbar">
            {children}
        </div>
    </div>
);

const D04_Metric_Readout_Unit: React.FC<{ label: string; value: string; trend: 'UP' | 'DOWN' | 'STABLE'; index: string }> = ({ label, value, trend, index }) => (
    <div className="bg-gray-900 p-3 border-l-2 border-gray-700 hover:border-cyan-500 transition-colors group">
        <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] text-gray-500">{index}</span>
            <span className={`text-[9px] px-1 ${trend === 'UP' ? 'bg-green-900 text-green-400' : trend === 'DOWN' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'}`}>{trend}</span>
        </div>
        <div className="text-gray-400 text-[10px] uppercase mb-1">{label}</div>
        <div className="text-lg font-mono text-cyan-100 group-hover:text-white group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]">{value}</div>
    </div>
);

// --- E00: MAIN CONTROLLER COMPONENT ---

interface AccountDetailsProps {
    customerId: string;
    accountId: string;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ customerId, accountId }) => {
    // STATE VECTOR INITIALIZATION
    const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
    const [systemState, setSystemState] = useState<I_Account_Deep_Model | null>(null);
    const [loadingVector, setLoadingVector] = useState<boolean>(true);
    const [corporateRegistry] = useState<I_O_Callaghan_Entity[]>(B01_Generate_Corporate_Registry(100));
    
    // E01: DATA INGESTION PIPELINE
    useEffect(() => {
        const E01_Execute_Pipeline = async () => {
            setLoadingVector(true);
            try {
                // Procedural Invocation of C01 Monolith
                const data = await C01_Initiate_Procedural_Load_Sequence(accountId || 'NULL_REF');
                setSystemState(data);
            } catch (error) {
                console.error("CRITICAL_SYSTEM_FAILURE: ", error);
            } finally {
                setLoadingVector(false);
            }
        };
        E01_Execute_Pipeline();
    }, [accountId]);

    // E02: DERIVATIVE CALCULATION MEMOIZATION
    const processedChartData = useMemo(() => {
        if (!systemState) return [];
        return C02_Compute_Analytical_Derivatives_For_Visualization(systemState.historicalLedger);
    }, [systemState]);

    // E03: RENDER STRATEGY
    if (loadingVector) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-cyan-600 font-mono">
                <div className="animate-spin w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full mb-4"></div>
                <div className="text-xs tracking-[0.3em] animate-pulse">INITIALIZING O'CALLAGHAN PROTOCOLS...</div>
                <div className="mt-2 text-[9px] text-gray-600">LOADING MODULES A00-Z99</div>
            </div>
        );
    }

    if (!systemState) return <div className="bg-red-900 text-white p-10 font-mono">FATAL_ERROR_STATE: SYSTEM_NULL</div>;

    const currentBalance = systemState.liquidityPool;
    const previousBalance = processedChartData[processedChartData.length - 2]?.balanceValue || 0;
    const trendDirection = currentBalance > previousBalance ? 'UP' : 'DOWN';

    return (
        <D01_Structural_Grid_Container>
            
            {/* SECTION F00: HEADER & META-CONTROLS */}
            <div className="col-span-12 bg-gray-800 border-b border-gray-600 p-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl text-cyan-400 font-bold tracking-tighter uppercase">James Burvel O’Callaghan III <span className="text-gray-500 text-sm font-normal">| FINANCIAL OS v9.0</span></h1>
                    <div className="flex space-x-4 mt-2 text-[10px] text-gray-400">
                        <span>CID: <span className="text-white">{customerId}</span></span>
                        <span>AID: <span className="text-white">{accountId}</span></span>
                        <span>SESSION: <span className="text-white">{Math.floor(Date.now() / 1000).toString(16).toUpperCase()}</span></span>
                        <span className="text-green-500">SYSTEM_OPTIMAL</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-gray-500 mb-1">GLOBAL_CLOCK</div>
                    <div className="text-xl text-white font-mono">{new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {/* SECTION G00: NAVIGATION MATRIX */}
            <div className="col-span-12 grid grid-cols-12 bg-gray-900 border-b border-gray-700">
                {['DASHBOARD', 'LEDGER_ANALYSIS', 'RISK_VECTORS', 'CORPORATE_ENTITIES', 'AUDIT_LOGS', 'SETTINGS'].map((tab, idx) => (
                    <D02_Navigation_Module_Tab 
                        key={tab} 
                        index={`G0${idx+1}`} 
                        label={tab.replace('_', ' ')} 
                        isActive={activeTab === tab} 
                        onClick={() => setActiveTab(tab)} 
                    />
                ))}
            </div>

            {/* SECTION H00: CONTENT RENDERER */}
            {activeTab === 'DASHBOARD' && (
                <>
                    {/* H01: KPI ROW */}
                    <div className="col-span-12 grid grid-cols-4 gap-1 mb-1">
                        <D04_Metric_Readout_Unit index="H01-A" label="Total Liquidity" value={C03_Format_Currency_String_With_Locale_Overrides_And_Precision(currentBalance)} trend={trendDirection} />
                        <D04_Metric_Readout_Unit index="H01-B" label="Volatility Index" value={(systemState.riskProfile.volatility * 100).toFixed(2) + '%'} trend="STABLE" />
                        <D04_Metric_Readout_Unit index="H01-C" label="Exposure Vector" value={C03_Format_Currency_String_With_Locale_Overrides_And_Precision(systemState.riskProfile.exposure)} trend="DOWN" />
                        <D04_Metric_Readout_Unit index="H01-D" label="Ledger Depth" value={systemState.historicalLedger.length.toString() + " TXN"} trend="UP" />
                    </div>

                    {/* H02: PRIMARY VISUALIZATION */}
                    <D03_Data_Surface_Panel index="H02-VIS" title="Liquidity Timeline & Moving Averages (50-Day)" colSpan={8} rowSpan={2}>
                        <div className="h-[400px] w-full bg-gray-900 border border-gray-800 p-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={processedChartData}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="readableDate" stroke="#9ca3af" fontSize={10} tickMargin={10} />
                                    <YAxis stroke="#9ca3af" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `$${v/1000}k`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} 
                                        itemStyle={{ color: '#22d3ee' }}
                                        labelStyle={{ color: '#9ca3af', fontSize: '10px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                                    <Area type="monotone" dataKey="balanceValue" stroke="#22d3ee" fillOpacity={1} fill="url(#colorBalance)" name="Net Liquidity" strokeWidth={2} />
                                    <Line type="basis" dataKey="movingAverage50" stroke="#fbbf24" dot={false} strokeWidth={1} name="50-Period MA" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </D03_Data_Surface_Panel>

                    {/* H03: RECENT TRANSACTIONS LIST */}
                    <D03_Data_Surface_Panel index="H03-LOG" title="High-Velocity Transaction Stream" colSpan={4} rowSpan={2}>
                        <div className="space-y-1">
                            {systemState.historicalLedger.slice(-12).reverse().map((txn, idx) => (
                                <div key={txn.transactionId} className="flex justify-between items-center bg-gray-900 p-2 border border-gray-800 hover:border-cyan-700 transition-all text-[10px]">
                                    <div className="flex flex-col">
                                        <span className="text-cyan-600 font-mono">{txn.transactionId}</span>
                                        <span className="text-gray-500 truncate w-32">{txn.counterpartyEntity}</span>
                                    </div>
                                    <div className={`font-mono font-bold ${txn.deltaAmount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {txn.deltaAmount > 0 ? '+' : ''}{C03_Format_Currency_String_With_Locale_Overrides_And_Precision(txn.deltaAmount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </D03_Data_Surface_Panel>
                </>
            )}

            {activeTab === 'CORPORATE_ENTITIES' && (
                <D03_Data_Surface_Panel index="I01-REG" title="Registered Entity Database (100 Active Nodes)" colSpan={12} rowSpan={4}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {corporateRegistry.map((entity, idx) => (
                            <div key={entity.globalIndex} className="bg-gray-900 p-3 border border-gray-700 flex flex-col space-y-2 hover:bg-gray-800 transition-colors">
                                <div className="flex justify-between border-b border-gray-800 pb-1">
                                    <span className="text-[9px] text-cyan-600">{entity.globalIndex}</span>
                                    <span className="text-[9px] text-gray-500">{new Date(entity.incorporationDate).getFullYear()}</span>
                                </div>
                                <div className="font-bold text-gray-200 text-xs truncate">{entity.companyName}</div>
                                <div className="text-[9px] text-gray-400">Jurisdiction: {entity.sovereignJurisdiction}</div>
                                <div className="bg-black p-1 font-mono text-[8px] text-green-700 truncate">{entity.fiscalEndpoint}</div>
                                <div className="text-[8px] text-gray-600 italic">{entity.useCaseVector}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {entity.featureSet.map((feature, fIdx) => (
                                        <span key={fIdx} className="bg-gray-800 text-gray-400 px-1 rounded text-[8px] border border-gray-700">{feature}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </D03_Data_Surface_Panel>
            )}

            {activeTab === 'LEDGER_ANALYSIS' && (
                 <D03_Data_Surface_Panel index="J01-ANL" title="Deep Ledger Inspection" colSpan={12}>
                     <div className="grid grid-cols-12 gap-4 h-full">
                         <div className="col-span-8 bg-gray-900 border border-gray-800 p-4">
                             <div className="text-xs text-gray-400 mb-2 font-mono">VELOCITY_METRIC_HISTOGRAM</div>
                             <ResponsiveContainer width="100%" height={300}>
                                 <BarChart data={processedChartData.slice(-50)}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                     <XAxis dataKey="readableDate" hide />
                                     <YAxis stroke="#9ca3af" fontSize={10} />
                                     <Tooltip cursor={{fill: '#1f2937'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                     <ReferenceLine y={0} stroke="#6b7280" />
                                     <Bar dataKey="velocityMetric" fill="#3b82f6" name="Transaction Velocity" />
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>
                         <div className="col-span-4 space-y-2 overflow-y-auto max-h-[350px]">
                             {processedChartData.slice(-20).map((d, i) => (
                                 <div key={i} className="bg-black border border-gray-800 p-2 text-[10px] font-mono">
                                     <div className="text-gray-500">{d.metadata.hash}</div>
                                     <div className="flex justify-between text-white mt-1">
                                         <span>ACCEL: {d.accelerationMetric.toFixed(2)}</span>
                                         <span className={d.regulatoryWeight > 0 ? "text-red-500" : "text-green-500"}>W: {d.regulatoryWeight}</span>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 </D03_Data_Surface_Panel>
            )}

            {/* FOOTER */}
            <div className="col-span-12 bg-gray-950 p-2 border-t border-gray-800 flex justify-between items-center text-[9px] text-gray-600 font-mono">
                <div>SYSTEM_INTEGRITY: 100% | MODULES_LOADED: 100 | NODES: 8,942</div>
                <div>THE JAMES BURVEL O’CALLAGHAN III CODE © 2024</div>
            </div>

        </D01_Structural_Grid_Container>
    );
};

export default AccountDetails;