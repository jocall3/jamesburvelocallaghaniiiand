import React, { useState, useMemo, FC, ReactNode } from 'react';

// --- Helper Components (defined locally for self-containment) ---

const Card: FC<{ title?: string; children: ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg ${className}`}>
        {title && (
            <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
        )}
        <div className="p-6">{children}</div>
    </div>
);

const SearchIcon: FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChevronDownIcon: FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

// --- Type Definitions ---

interface HelpArticle {
    id: string;
    category: 'Getting Started' | 'Licenses' | 'Policies' | 'AI Checker' | 'Account';
    question: string;
    answer: ReactNode;
    keywords: string[];
}

// --- Mock Data ---

const helpArticles: HelpArticle[] = [
    {
        id: 'gs-01',
        category: 'Getting Started',
        question: 'What is the Regulatory Compliance & Licensing Hub?',
        answer: (
            <p>
                The Hub is a centralized platform designed to manage your organization's regulatory licenses, compliance policies, and regulatory updates. It leverages AI to provide proactive compliance checks for new features and helps you maintain a clear overview of your compliance posture.
            </p>
        ),
        keywords: ['introduction', 'overview', 'dashboard', 'purpose'],
    },
    {
        id: 'lic-01',
        category: 'Licenses',
        question: 'How do I add a new license?',
        answer: (
            <>
                <p>To add a new license, follow these steps:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-300">
                    <li>Navigate to the "License Repository" section on the main dashboard.</li>
                    <li>Click the "Add New License" button located at the top-right of the table.</li>
                    <li>Fill in the required details in the modal, such as License Name, Jurisdiction, and Expiry Date.</li>
                    <li>Click "Add License" to save the new entry.</li>
                </ol>
            </>
        ),
        keywords: ['add', 'create', 'new license', 'upload'],
    },
    {
        id: 'lic-02',
        category: 'Licenses',
        question: 'How can I track license renewal dates?',
        answer: (
            <p>
                The dashboard provides several ways to track renewals. The "Pending Renewals" card highlights licenses requiring attention soon. You can also sort the License Repository table by "Expiry Date" to see upcoming deadlines. Each license has a "Next Renewal Reminder Date" field that can be configured for proactive notifications.
            </p>
        ),
        keywords: ['renewal', 'expiry', 'track', 'deadline', 'reminder'],
    },
    {
        id: 'pol-01',
        category: 'Policies',
        question: 'What is the difference between a License and a Policy?',
        answer: (
            <p>
                A <strong>License</strong> is an official permit from a regulatory body allowing you to conduct specific business activities in a jurisdiction (e.g., a Money Transmitter License). A <strong>Policy</strong> is an internal document that outlines your company's rules and procedures to ensure you comply with the laws and regulations associated with your licenses (e.g., an Anti-Money Laundering Policy).
            </p>
        ),
        keywords: ['difference', 'license', 'policy', 'definition'],
    },
    {
        id: 'ai-01',
        category: 'AI Checker',
        question: 'How does the AI Compliance Checker work?',
        answer: (
            <p>
                The AI Compliance Checker uses a powerful generative AI model trained on regulatory knowledge. When you describe a new product feature, the AI analyzes it against our existing license portfolio and general regulatory principles. It then generates a report identifying potential new licensing requirements, key compliance risks, and mitigation strategies.
            </p>
        ),
        keywords: ['ai', 'checker', 'compliance', 'feature', 'how it works', 'gemini'],
    },
    {
        id: 'ai-02',
        category: 'AI Checker',
        question: 'Is the AI report legally binding advice?',
        answer: (
            <p>
                <strong>No.</strong> The AI-generated report is a powerful first-pass analysis and should be used for informational and guidance purposes only. It is not a substitute for professional legal or compliance advice. All AI outputs should be carefully reviewed by your internal compliance and legal teams before any business decisions are made.
            </p>
        ),
        keywords: ['legal', 'advice', 'disclaimer', 'binding'],
    },
    {
        id: 'acc-01',
        category: 'Account',
        question: 'How do I reset my password?',
        answer: (
            <p>
                To reset your password, click on your profile icon in the top-right corner of the screen, select "Account Settings," and then navigate to the "Security" tab. You will find an option to change your password there. If you are logged out, you can use the "Forgot Password" link on the login page.
            </p>
        ),
        keywords: ['password', 'reset', 'account', 'security', 'forgot'],
    },
];

const categories = Array.from(new Set(helpArticles.map(a => a.category)));

// --- Main Component ---

const HelpCenter: FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());

    const filteredArticles = useMemo(() => {
        if (!searchTerm.trim()) {
            // Show a curated list of popular FAQs by default
            return helpArticles.slice(0, 5);
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return helpArticles.filter(article =>
            article.question.toLowerCase().includes(lowercasedTerm) ||
            article.keywords.some(keyword => keyword.toLowerCase().includes(lowercasedTerm))
        );
    }, [searchTerm]);

    const toggleFaq = (id: string) => {
        setExpandedFaqs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-8 text-gray-200">
            {/* Header and Search */}
            <div className="text-center py-12 bg-gray-800/30 rounded-lg">
                <h1 className="text-4xl font-bold text-white">Help Center</h1>
                <p className="mt-2 text-lg text-gray-400">How can we help you today?</p>
                <div className="mt-6 max-w-2xl mx-auto">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for articles (e.g., 'add license')"
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Categories */}
                <div className="lg:col-span-1">
                    <Card title="Browse by Category">
                        <ul className="space-y-2">
                            {categories.map(category => (
                                <li key={category}>
                                    <a href="#" className="block p-3 rounded-md hover:bg-gray-700/50 transition text-cyan-400">
                                        {category}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

                {/* FAQ / Search Results */}
                <div className="lg:col-span-2">
                    <Card title={searchTerm ? `Search Results for "${searchTerm}"` : 'Frequently Asked Questions'}>
                        {filteredArticles.length > 0 ? (
                            <div className="space-y-4">
                                {filteredArticles.map(article => (
                                    <div key={article.id} className="border-b border-gray-700 last:border-b-0">
                                        <button
                                            onClick={() => toggleFaq(article.id)}
                                            className="w-full flex justify-between items-center text-left py-4"
                                        >
                                            <h4 className="font-semibold text-white">{article.question}</h4>
                                            <ChevronDownIcon
                                                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedFaqs.has(article.id) ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                        {expandedFaqs.has(article.id) && (
                                            <div className="pb-4 pr-6 text-gray-300 space-y-3">
                                                {article.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">
                                No articles found matching your search. Please try different keywords.
                            </p>
                        )}
                    </Card>
                </div>
            </div>

            {/* Contact Support */}
            <Card>
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white">Still need help?</h2>
                    <p className="mt-2 text-gray-400">
                        If you can't find the answer you're looking for, our support team is here to assist you.
                    </p>
                    <button className="mt-6 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition">
                        Contact Support
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default HelpCenter;