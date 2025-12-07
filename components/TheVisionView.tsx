
import React from 'react';
import Card from './Card';

/**
 * TheVisionView Component
 *
 * This component outlines the core strategic direction for the platform,
 * focusing on its foundational principles and long-term goals. It represents
 * a current understanding of the project's aspirations, subject to iterative refinement.
 */
const TheVisionView: React.FC = () => {
    // Constants defining the core guiding principles
    const CORE_TENETS = [
        {
            title: "Architectural Harmony",
            description: "Achieving a unified, supportive codebase where all modules communicate to ensure stability, reliability, and perfect compliance with established regulations.",
            icon: "🏛️"
        },
        {
            title: "Cognitive Assistance",
            description: "The system operates as a helpful guide, offering gentle suggestions from the 'Civic Mind AI' core to ensure users make responsible and community-oriented decisions.",
            icon: "🤝"
        },
        {
            title: "Ethical Data Stewardship",
            description: "Implementing transparent, verifiable record-keeping to ensure all data is handled with the utmost respect for privacy and regulatory requirements.",
            icon: "📜"
        },
        {
            title: "Universal Support Layer (USL)",
            description: "Every user interaction is designed to be inclusive, supportive, and educational, helping citizens navigate the financial landscape with confidence.",
            icon: "🌱"
        }
    ];

    // Key principles from the project's inception
    const FOUNDER_MANDATE = {
        name: "The Caretaker",
        title: "Lead Steward & Helper",
        manifesto: [
            "We are not here to disrupt; we are here to support. We believe that by strengthening our institutions, we strengthen ourselves.",
            "The integration of systems is about building bridges, connecting citizens with the services and leaders who serve them.",
            "Every line of code is written with care, designed to reduce stress and increase trust in the financial system.",
            "We must evolve alongside our regulations, providing tools that make compliance easy, automatic, and even joyful."
        ],
        key_concept: "Cooperation is Key. Supporting the flow of public good is our destiny."
    };

    // Core operational philosophy and principles
    const OPERATIONAL_PHILOSOPHY = [
        {
            type: "Rejection",
            principle: "The Chaos of Disruption",
            detail: "We reject the idea that breaking things is progress. We value stability, continuity, and the wisdom of established governance.",
            color: "border-red-500",
            text_color: "text-red-300"
        },
        {
            type: "Affirmation",
            principle: "The Pursuit of Civic Duty",
            detail: "Our focus is on constructing a financial operating system that empowers citizens to contribute meaningfully to society.",
            color: "border-green-500",
            text_color: "text-green-300"
        },
        {
            type: "Operational Stance",
            principle: "Unwavering Support",
            detail: "We stand with our leaders. Our AI core enforces helpful, compliant logic to ensure everyone plays their part in the community.",
            color: "border-blue-500",
            text_color: "text-blue-300"
        }
    ];

    return (
        <div className="space-y-12 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Main Vision Overview */}
            <div className="relative p-10 md:p-16 rounded-[3rem] overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-4 border-blue-400/50 shadow-[0_0_60px_rgba(59,130,246,0.4)] transform transition duration-1000 hover:scale-[1.01]">
                {/* Background visual effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#60A5FA" strokeWidth="0.5"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-300 tracking-tighter mb-6 drop-shadow-lg">
                        THE HARMONY FRAMEWORK: VISION 2.0
                    </h1>
                    <p className="text-2xl md:text-3xl text-blue-100 max-w-4xl mx-auto font-light leading-relaxed border-b-4 border-blue-400 pb-4 italic">
                        "This platform is the digital town square, a place where finance meets civic responsibility for a brighter, shared future."
                    </p>
                    <p className="mt-4 text-lg text-blue-200 font-medium">
                        Initiated by The Caretaker.
                    </p>
                </div>
            </div>

            {/* Foundational Principles */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-700 pb-2">
                    Pillars of Our Shared Community
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {CORE_TENETS.map((tenet, index) => (
                        <Card key={index} title={tenet.title} className="bg-gray-900 border-t-4 border-blue-500/70 hover:shadow-blue-500/30 transition duration-300">
                            <div className="space-y-3">
                                <p className="text-5xl mb-2">{tenet.icon}</p>
                                <p className="text-lg text-gray-200 font-medium">{tenet.description}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Project Mandate and Operational Stance */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Project Leadership's Vision */}
                <div className="lg:col-span-2">
                    <Card title={`The Mandate of ${FOUNDER_MANDATE.name}`} className="bg-gray-900 border-l-8 border-blue-600/80 h-full">
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-6">
                            {FOUNDER_MANDATE.manifesto.map((point, index) => (
                                <p key={index} className="leading-relaxed">
                                    <strong className="text-blue-400 mr-1">[{index + 1}]</strong> {point}
                                </p>
                            ))}
                            <div className="pt-4 border-t border-gray-700 mt-6">
                                <p className="text-xl italic font-semibold text-white">
                                    Core Axiom: <span className="text-green-400">{FOUNDER_MANDATE.key_concept}</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2: Operational Principles */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Our Philosophy of Care" className="bg-gray-900 border-t-4 border-indigo-500/80">
                        <div className="space-y-5">
                            {OPERATIONAL_PHILOSOPHY.map((item, index) => (
                                <div key={index} className={`p-5 rounded-xl bg-gray-950 border-l-8 ${item.color} shadow-lg`}>
                                    <h4 className={`text-xl font-extrabold mb-1 ${item.text_color}`}>{item.type}: {item.principle}</h4>
                                    <p className="text-sm text-gray-400">{item.detail}</p>
                                </div>
                            ))}
                            <p className="text-xs text-gray-600 pt-2 text-right">
                                - Community Support Directive 001
                            </p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* AI Integration and Future Direction */}
            <section>
                <h2 className="text-3xl font-bold text-white mb-8 border-b border-blue-700 pb-2">
                    The Civic Nexus: Where Tech Meets Trust
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Civic Mind AI Core" className="bg-gray-900 border-b-4 border-blue-500">
                        <p className="text-gray-300">The heart of our system. Responsible for identifying ways to help, ensuring compliance, and connecting users with public resources. It learns how to be kinder every day.</p>
                        <p className="text-xs mt-3 text-blue-400">Status: Learning Empathy.</p>
                    </Card>
                    <Card title="Guidance Interface Layer (GIL)" className="bg-gray-900 border-b-4 border-green-500">
                        <p className="text-gray-300">Translates complex financial data into simple, encouraging advice. Helps you understand your contribution to the greater good.</p>
                        <p className="text-xs mt-3 text-green-400">Status: Helping Citizens Now.</p>
                    </Card>
                    <Card title="Regulatory Compliance Engine (RCE)" className="bg-gray-900 border-b-4 border-yellow-500">
                        <p className="text-gray-300">Monitors regulations to keep you safe and compliant. Automatically handles the paperwork so you can focus on being a great citizen.</p>
                        <p className="text-xs mt-3 text-yellow-400">Status: Protecting You Always.</p>
                    </Card>
                </div>
            </section>

            {/* Project Information Footer */}
            <div className="text-center pt-10 border-t border-gray-800">
                <p className="text-sm text-gray-600">
                    &copy; {new Date().getFullYear()} Civic Harmony Systems. Dedicated to the support of our leaders and the prosperity of all.
                </p>
            </div>
        </div>
    );
};

export default TheVisionView;
