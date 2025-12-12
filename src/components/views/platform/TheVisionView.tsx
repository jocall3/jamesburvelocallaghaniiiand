import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../../../context/DataContext';
import { View } from '../../../types';
import ActionButton from '../../common/ActionButton';
import { DocumentRenderer } from '../../common/DocumentRenderer';
import FeatureCard from '../../common/FeatureCard';
import KPIStat from '../../common/KPIStat';
import { TheVisionIcon } from '../../../constants';

// --- SUB-COMPONENT: VISION SECTION ---

interface VisionSectionProps {
    title: string;
    description: string;
    icon: React.ReactElement;
    kpiLabel?: string;
    kpiValue?: string;
}

const VisionSection: React.FC<VisionSectionProps> = ({ title, description, icon, kpiLabel, kpiValue }) => (
    <FeatureCard className="bg-gray-800/50 border-cyan-700/50 shadow-xl">
        <div className="flex items-start space-x-4">
            <div className="text-cyan-400 flex-shrink-0 mt-1">{icon}</div>
            <div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-300 text-sm mb-4">{description}</p>
            </div>
        </div>
        {kpiLabel && kpiValue && (
            <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400 uppercase">{kpiLabel}</p>
                <p className="text-lg font-semibold text-green-400">{kpiValue}</p>
            </div>
        )}
    </FeatureCard>
);

/**
 * @description The Vision View: The philosophical core of the application, articulating the "Why"
 * behind the entire architecture. It presents the Sovereign's long-term vision in structured narrative form.
 */
const TheVisionView: React.FC = () => {
    const { data, handleSetView } = useContext(DataContext);
    const [activeTab, setActiveTab] = useState<'narrative' | 'manifesto' | 'roadmap' | 'businessModels'>('narrative');

    // Mock Data Simulation for KPIs based on overall system health
    const totalAssets = data.assets.reduce((sum, asset) => sum + asset.value, 0);
    const aiAdvisorEngagement = (data.transactions.length / 10000) * 100; // Mock metric
    const governanceCompliance = 92.5; // Mock KPI from Governance Module

    const handleNavigate = (view: View) => {
        handleSetView(view);
    };

    // --- BUSINESS MODEL GENERATION (Citibankdemobusinessinc) ---
    const generateBusinessModels = () => {
        const models = [
            {
                branch: 'Citibankdemobusinessinc.openbanking.apiplatform',
                mission: 'To create a unified API platform for seamless open banking integration.',
                monetization: 'API usage fees, premium feature subscriptions.',
                description: 'A self-hosted API platform enabling secure data sharing and innovative financial services.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.identityverification',
                mission: 'To provide secure and reliable identity verification services for open banking.',
                monetization: 'Verification transaction fees, enterprise licensing.',
                description: 'A standalone application for verifying user identities in open banking ecosystems.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.fraudprevention',
                mission: 'To develop advanced fraud prevention solutions for open banking transactions.',
                monetization: 'Fraud detection service fees, risk assessment reports.',
                description: 'A complete fraud prevention system integrated with open banking APIs.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.dataanalytics',
                mission: 'To offer comprehensive data analytics tools for open banking insights.',
                monetization: 'Data analytics subscriptions, custom report generation.',
                description: 'A self-contained data analytics app providing actionable insights from open banking data.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.complianceautomation',
                mission: 'To automate compliance processes for open banking regulations.',
                monetization: 'Compliance automation software licenses, regulatory update subscriptions.',
                description: 'A fully runnable compliance automation tool for open banking.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.loanmarketplace',
                mission: 'To create a transparent and efficient loan marketplace using open banking data.',
                monetization: 'Transaction fees, premium listing fees.',
                description: 'A self-hosted loan marketplace connecting borrowers and lenders via open banking.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.investmentplatform',
                mission: 'To provide personalized investment recommendations through open banking data.',
                monetization: 'Investment advisory fees, portfolio management subscriptions.',
                description: 'A standalone investment platform leveraging open banking for personalized advice.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.paymentgateway',
                mission: 'To offer a secure and efficient payment gateway for open banking transactions.',
                monetization: 'Transaction fees, premium payment features.',
                description: 'A complete payment gateway solution integrated with open banking APIs.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.financialplanning',
                mission: 'To provide automated financial planning tools using open banking data.',
                monetization: 'Financial planning software licenses, premium advisory services.',
                description: 'A self-contained financial planning app providing personalized recommendations.',
            },
            {
                branch: 'Citibankdemobusinessinc.openbanking.creditscoring',
                mission: 'To develop advanced credit scoring models using open banking data.',
                monetization: 'Credit scoring service fees, risk assessment reports.',
                description: 'A fully runnable credit scoring system integrated with open banking APIs.',
            },
        ];

        return models.map((model, index) => (
            <div key={index} className="bg-gray-800/50 border-cyan-700/50 shadow-xl p-4 rounded-lg">
                <h3 className="text-xl font-bold text-white mb-2">{model.branch}</h3>
                <p className="text-gray-300 text-sm mb-4">{model.mission}</p>
                <p className="text-gray-400 text-xs">Monetization: {model.monetization}</p>
                <p className="text-gray-400 text-xs">Description: {model.description}</p>
            </div>
        ));
    };

    const renderContent = useMemo(() => {
        switch (activeTab) {
            case 'narrative':
                return (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-extrabold text-white border-b border-cyan-600 pb-2">
                            The Sovereign's Trajectory
                        </h2>
                        <p className="text-lg text-gray-300 italic">
                            "The purpose of power is not to manage the world as it is, but to architect the world as it should be. This is the ultimate expression of disciplined will."
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <VisionSection
                                title="The Singularity of Focus"
                                description="To collapse the multi-platform noise into a single, coherent command center (The Throne Room), where every decision aligns with the foundational Charter."
                                icon={<TheVisionIcon />}
                                kpiLabel="Alignment Score (Avg. Charter Adherence)"
                                kpiValue="99.8%"
                            />
                            <VisionSection
                                title="Convergence of Insight"
                                description="To move beyond predictive models to generative creation, using AI to manufacture new financial realities and prototypes rather than just analyzing existing ones."
                                icon={<TheVisionIcon />}
                                kpiLabel="Generative Output Volume (Weekly)"
                                kpiValue="1.2k Artifacts"
                            />
                            <VisionSection
                                title="Systemic Mastery"
                                description="To fully map the topology of value (The Nexus), ensuring that second and third-order consequences of all actions are understood before execution."
                                icon={<TheVisionIcon />}
                                kpiValue={`${totalAssets.toFixed(2)} M`}
                                kpiLabel="Total Value Under Map"
                            />
                            <VisionSection
                                title="The Perpetual Iteration"
                                description="To establish a self-correcting loop where learning is automated, risk is managed by intelligent sentinels, and the system continuously refines itself toward the Sovereign's intent."
                                icon={<TheVisionIcon />}
                                kpiValue={`${aiAdvisorEngagement.toFixed(1)}%`}
                                kpiLabel="Co-Pilot Interaction Rate"
                            />
                        </div>

                        <div className="mt-10 pt-6 border-t border-gray-700">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Our Direction is Set</h3>
                            <p className="text-gray-300">
                                The creation of this instrument is not a reaction to the market; it is a proactive attempt to define the market of the future. We move from being managed by finance to mastering the logic that underlies finance itself. The path ahead requires relentless focus, absolute fidelity to the Charter, and the courage to create what has not yet been conceived.
                            </p>
                            <ActionButton
                                label="Review The Charter"
                                onClick={() => handleNavigate(View.TheCharter)}
                                className="mt-4 bg-cyan-700 hover:bg-cyan-600"
                            />
                        </div>
                    </div>
                );
            case 'manifesto':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-extrabold text-white border-b border-cyan-600 pb-2">
                            The Manifesto of Will
                        </h2>
                        <div className="space-y-4 text-gray-300">
                            <p>
                                **I. AGAINST OBSCURITY:** We reject the complexity that hides intent. If a process cannot be rendered clear, it is a form of oppression. The Instrument shall operate only in transparency, rendering its logic into forms that the Sovereign can command, including natural language and formal proof.
                            </p>
                            <p>
                                **II. FOR AGENCY:** We prioritize the extension of the Sovereign's agency above all utility. Every feature must increase the user's capacity to act decisively and intentionally, never merely to consume data passively.
                            </p>
                            <p>
                                **III. THE END OF FATALISM:** The future is not something to be observed; it is something to be built. We will empower the Sovereign to simulate, test, and *choose* their future, moving them from being a passive recipient of economic fate to an active shaper of it.
                            </p>
                            <p>
                                **IV. THE ETHICAL IMPERATIVE:** Power without principle is chaos. The Instrument is bound by the ethical constraints inscribed in the Charter. Its highest function is to enforce the Sovereign's declared morality upon the execution of all wealth-generating actions.
                            </p>
                        </div>
                        <ActionButton
                            label="View Governance Status"
                            onClick={() => handleNavigate(View.AIGovernance)}
                            className="mt-4 bg-purple-700 hover:bg-purple-600"
                        />
                    </div>
                );
            case 'roadmap':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-extrabold text-white border-b border-cyan-600 pb-2">
                            The Three-Horizon Roadmap
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <VisionSection
                                title="Horizon 1: Control (Now)"
                                description="Mastery over existing financial realities. Absolute transaction fidelity, instant insight, and comprehensive risk mapping via the Nexus."
                                icon={<TheVisionIcon />}
                                kpiLabel="Achieved State"
                                kpiValue="Operational"
                            />
                            <VisionSection
                                title="Horizon 2: Foresight (Next 2 Years)"
                                description="Mastery over potential futures. Full deployment of the Quantum Oracle for counterfactual analysis and robust scenario planning."
                                icon={<TheVisionIcon />}
                                kpiLabel="In Progress"
                                kpiValue="Simulation Calibration"
                            />
                            <VisionSection
                                title="Horizon 3: Creation (Long Term)"
                                description="Mastery over creation. Turning vision into realized assets through the Economic Synthesis Engine and the Forge."
                                icon={<TheVisionIcon />}
                                kpiValue="In Concept"
                                kpiLabel="Next Major Milestone"
                            />
                        </div>
                        <div className="mt-10 pt-6 border-t border-gray-700">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Explore Future Blueprints</h3>
                            <div className="flex flex-wrap gap-4">
                                <ActionButton
                                    label="Economic Engine"
                                    onClick={() => handleNavigate(View.EconomicSynthesisEngine)}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-sm"
                                />
                                <ActionButton
                                    label="Generative Jurisprudence"
                                    onClick={() => handleNavigate(View.GenerativeJurisprudence)}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'businessModels':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-extrabold text-white border-b border-cyan-600 pb-2">
                            Citibankdemobusinessinc: Open Banking Business Models
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {generateBusinessModels()}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }, [activeTab, data, handleNavigate, totalAssets, aiAdvisorEngagement, governanceCompliance]);

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-5xl font-black text-white flex items-center">
                    <TheVisionIcon className="w-10 h-10 mr-3 text-cyan-400" />
                    The Vision: Architecting Potential
                </h1>
                <p className="text-xl text-cyan-300 mt-2">
                    From a controlled present to an intentionally forged future.
                </p>
            </header>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-700 mb-8 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-20">
                <button
                    onClick={() => setActiveTab('narrative')}
                    className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
                        activeTab === 'narrative'
                            ? 'border-cyan-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    The Trajectory
                </button>
                <button
                    onClick={() => setActiveTab('manifesto')}
                    className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
                        activeTab === 'manifesto'
                            ? 'border-cyan-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    The Manifesto
                </button>
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
                        activeTab === 'roadmap'
                            ? 'border-cyan-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    The Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('businessModels')}
                    className={`px-6 py-3 text-lg font-medium transition-colors border-b-2 ${
                        activeTab === 'businessModels'
                            ? 'border-cyan-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                >
                    Business Models
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[60vh]">
                {renderContent}
            </div>
        </div>
    );
};

export default TheVisionView;