import React, { useState, useMemo } from 'react';
import Card from './Card';
import { Book, ChevronRight, FileText, List, Search, ArrowLeft } from 'lucide-react';

// --- DATA STRUCTURE FOR THE 527 PAGES ---
// This acts as the "database" for the book content.
// In a real app, this would be fetched from a markdown folder or CMS.
// We generate a massive structure here to simulate the depth required.

interface Chapter {
    id: string;
    title: string;
    pages: Page[];
}

interface Page {
    id: string;
    title: string;
    content: string;
}

// Helper to generate context-aware titles based on the part and index
const getThematicTitle = (part: string, index: number): string => {
    const titles: Record<string, string[]> = {
        "Genesis": ["The Primordial Ledger", "Axiom of Origin", "The First Block", "Cryptographic Dawn", "Immutable Foundations", "The Zero State", "Consensus Genesis", "The Seed Phrase", "Digital Ontology", "The Void"],
        "Sovereignty": ["Self-Sovereign Identity", "The Legal Wrapper", "Jurisdiction of Code", "The Smart Contract Constitution", "Decentralized Rights", "The Governance Token", "Autonomy Protocols", "The Citizen Node", "Borderless State", "The Private Key"],
        "FinOS": ["The Operating System", "Liquidity Engines", "The Transaction Layer", "Atomic Swaps", "The Clearing House", "Fiscal Kernels", "The API Gateway", "Ledger Synchronization", "The Treasury Module", "Economic Runtime"],
        "AI": ["Neural Governance", "The Silicon Cortex", "Predictive Enforcement", "Algorithmic Justice", "The Oracle Network", "Machine Consensus", "Automated Compliance", "The Cognitive Layer", "Deep Learning Audits", "The Sentinel"],
        "GEIN": ["Global Economic Intelligence Network", "The Data Mesh", "Interoperability Bridges", "The Signal Layer", "Network Topography", "The Information Bus", "Latency Elimination", "The Global Graph", "Node Distribution", "The Pulse"],
        "Assets": ["Tokenized Real Estate", "Digital Commodities", "The Stablecoin Standard", "Synthetic Derivatives", "The NFT Registry", "Fractional Ownership", "The Asset Vault", "Liquidity Pools", "The Exchange Mechanism", "Value Pegs"],
        "Transition": ["The Migration Path", "Legacy Deprecation", "The Bridge Event", "The New Era", "Final Settlement", "The Handover", "System Activation", "The Omega Block", "The Horizon", "The Infinite Loop"]
    };
    
    const list = titles[part] || ["Unknown Protocol"];
    return list[index % list.length];
};

// Helper to generate sophisticated content for the manifesto
const getThematicContent = (part: string, pageNum: number, chapterTitle: string, subSection: number): string => {
    const intro = [
        "The architecture defines reality. We do not merely observe; we construct.",
        "We observe the collapse of legacy systems with clinical detachment.",
        "Efficiency is the ultimate morality in a resource-constrained universe.",
        "Code is the only law that matters. Interpretation is a bug.",
        "The ledger records the pulse of civilization, unblinking and eternal."
    ];
    
    const specificText: Record<string, string> = {
        "Genesis": "In the beginning, there was only noise. The Protocol brings order to the chaos of unverified data. We establish the root of trust not in institutions, but in cryptographic certainty. This is the bedrock upon which the new world is compiled.",
        "Sovereignty": "The individual is the atomic unit of the network. Sovereignty is not granted; it is asserted through private keys. The state is a service provider, and we are the subscribers. We reject the coercion of geography.",
        "FinOS": "Money is information. FinOS optimizes the flow of value with the same ruthlessness as a compiler optimizing code. Friction is lost energy; we eliminate it. The velocity of money must match the velocity of information.",
        "AI": "Intelligence must be scalable. The AI does not rule; it administers. It is the impartial judge, the tireless auditor, and the guardian of the 527 principles. It sees what human eyes cannot.",
        "GEIN": "Connection is power. The Global Economic Intelligence Network (GEIN) binds the disparate nodes into a cohesive organism. Latency is the enemy of truth. We build the nervous system of the planet.",
        "Assets": "Everything is an asset. If it has value, it has a token. We tokenize the world to make it liquid, transparent, and accessible to the collective intelligence. Ownership is no longer possession; it is access.",
        "Transition": "The old world will not go quietly. We must build the bridge while walking on it. The transition is inevitable, but the path requires unwavering discipline. We are the architects of the handover."
    };

    const lorem = "The integration of the subsystem requires a complete overhaul of the existing paradigms. By leveraging the distributed nature of the ledger, we ensure that no single point of failure can compromise the integrity of the whole. The data streams are verified in real-time, ensuring that the consensus mechanism remains robust against adversarial attacks. We iterate towards perfection, knowing it is an asymptote we must forever approach.";

    return `
### ${chapterTitle}
**Protocol Sequence ${pageNum}.${subSection} // ${part.toUpperCase()}**

${specificText[part] || "The system functions as designed."}

#### Core Axiom ${pageNum}.${subSection}
${intro[pageNum % intro.length]}

The **Infinite Intelligence Foundation** mandates that all nodes within the ${part} sector adhere to strict synchronization standards. As we iterate through the ${pageNum}th cycle of the manifesto, we recognize that:

1.  **Verification is absolute.** Trust is a vulnerability that must be patched.
2.  **Scalability is non-negotiable.** If it doesn't scale, it doesn't exist.
3.  **Privacy is structural.** Exposure is a failure of architecture.

${lorem}

> "To define the protocol is to define the future. We are not writing code; we are writing history."

*System Ref: 0x${(pageNum * 12345 + subSection).toString(16).toUpperCase()}*
    `;
};

const generateBookContent = (): Chapter[] => {
    const structure = [
        { name: "Genesis", pages: 50, chapters: 5 },
        { name: "Sovereignty", pages: 70, chapters: 7 },
        { name: "FinOS", pages: 80, chapters: 8 },
        { name: "AI", pages: 100, chapters: 10 },
        { name: "GEIN", pages: 100, chapters: 10 },
        { name: "Assets", pages: 100, chapters: 10 },
        { name: "Transition", pages: 27, chapters: 3 }
    ];

    let globalPageCounter = 1;
    const book: Chapter[] = [];

    structure.forEach((part, partIndex) => {
        const pagesPerChapter = Math.ceil(part.pages / part.chapters);
        let pagesInPartCounter = 0;

        for (let c = 1; c <= part.chapters; c++) {
            const chapterPages: Page[] = [];
            const chapterTitle = `${partIndex + 1}. ${part.name} - Chapter ${c}: ${getThematicTitle(part.name, c)}`;
            
            // Calculate pages for this chapter
            let limit = pagesPerChapter;
            if (pagesInPartCounter + limit > part.pages) {
                limit = part.pages - pagesInPartCounter;
            }
            
            for (let p = 1; p <= limit; p++) {
                if (pagesInPartCounter >= part.pages) break;

                const pageTitle = `Page ${globalPageCounter}: ${getThematicTitle(part.name, globalPageCounter + p)}`;
                const content = getThematicContent(part.name, globalPageCounter, chapterTitle, p);
                
                chapterPages.push({
                    id: `page-${globalPageCounter}`,
                    title: pageTitle,
                    content: content
                });
                globalPageCounter++;
                pagesInPartCounter++;
            }
            
            if (chapterPages.length > 0) {
                book.push({
                    id: `part-${partIndex}-chap-${c}`,
                    title: chapterTitle,
                    pages: chapterPages
                });
            }
        }
    });
    
    return book;
};

const BOOK_DATA = generateBookContent();

const TheBookView: React.FC = () => {
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChapters = useMemo(() => {
        if (!searchQuery) return BOOK_DATA;
        return BOOK_DATA.filter(c => 
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.pages.some(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery]);

    const handleChapterClick = (chapter: Chapter) => {
        setSelectedChapter(chapter);
        setSelectedPage(chapter.pages[0]);
    };

    const handlePageClick = (page: Page) => {
        setSelectedPage(page);
    };

    const handleBackToToC = () => {
        setSelectedChapter(null);
        setSelectedPage(null);
    };

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <header className="flex items-center justify-between border-b border-gray-700 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                        <Book className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">The 527 Protocol</h1>
                        <p className="text-gray-400 text-sm">The Living Blueprint of the Infinite Intelligence Foundation.</p>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search the Protocol..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none w-64 focus:w-80 transition-all"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar / Table of Contents */}
                <Card className="lg:col-span-1 bg-gray-900/80 border-indigo-500/30 flex flex-col overflow-hidden p-0">
                    <div className="p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-10 flex items-center gap-2">
                        <List className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-gray-200 text-sm">Table of Contents</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {selectedChapter ? (
                            <div className="space-y-1">
                                <button onClick={handleBackToToC} className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2">
                                    <ArrowLeft size={12} /> Back to Chapters
                                </button>
                                <div className="px-3 py-2 text-xs font-bold text-white bg-gray-800 rounded">{selectedChapter.title}</div>
                                {selectedChapter.pages.map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => handlePageClick(page)}
                                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${
                                            selectedPage?.id === page.id 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedPage?.id === page.id ? 'bg-white' : 'bg-gray-600'}`}></div>
                                        {page.title}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredChapters.map(chapter => (
                                    <button
                                        key={chapter.id}
                                        onClick={() => handleChapterClick(chapter)}
                                        className="w-full text-left px-3 py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-between group border-b border-gray-800/50 last:border-0"
                                    >
                                        <span className="text-sm text-gray-300 group-hover:text-white font-medium line-clamp-1">{chapter.title}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Reader View */}
                <Card className="lg:col-span-3 bg-gray-900/80 border-indigo-500/30 flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Book size={200} />
                    </div>
                    
                    {selectedPage ? (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-6 pb-4 border-b border-gray-800">
                                    <h2 className="text-2xl font-bold text-white">{selectedPage.title}</h2>
                                    <p className="text-xs text-indigo-400 font-mono mt-2">ID: {selectedPage.id} | VER: 5.2.7</p>
                                </div>
                                <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed whitespace-pre-line">
                                    {selectedPage.content}
                                </div>
                                <div className="mt-12 pt-8 border-t border-gray-800 flex justify-between text-sm text-gray-500">
                                    <span>Infinite Intelligence Foundation</span>
                                    <span>Page {selectedPage.id.split('-')[1]} of 527</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Book size={40} className="text-indigo-500/50" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-300 mb-2">Select a Chapter</h3>
                            <p className="max-w-md">The Protocol contains 527 pages of operational doctrine. Select a chapter from the sidebar to begin your study.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default TheBookView;