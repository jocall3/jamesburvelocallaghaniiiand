
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

const generateBookContent = (): Chapter[] => {
    const parts = [
        "I. The Vision",
        "II. High-Level Architecture",
        "III. Asset Domains Encyclopaedia",
        "IV. Banking & Integration",
        "V. Intelligence Systems",
        "VI. Component Library",
        "VII. Operational Playbooks",
        "VIII. Developer Appendix"
    ];

    let pageCounter = 1;
    const chapters: Chapter[] = [];

    parts.forEach((partTitle, partIndex) => {
        // Generate chapters for each part
        const chapterCount = partIndex === 2 ? 20 : 5; // Make Asset Domains huge
        
        for (let i = 1; i <= chapterCount; i++) {
            const chapterId = `part${partIndex + 1}-chap${i}`;
            const chapterTitle = `${partTitle} - Chapter ${i}: The ${partIndex === 2 ? 'Asset' : 'Protocol'} of ${Math.random().toString(36).substring(7)}`;
            
            const pages: Page[] = [];
            // Generate pages for each chapter
            const pageCount = partIndex === 5 ? 10 : 5; // Component library has many pages
            
            for (let j = 1; j <= pageCount; j++) {
                pages.push({
                    id: `page-${pageCounter}`,
                    title: `Page ${pageCounter}: Section ${j} of ${chapterTitle}`,
                    content: `
                        ### ${chapterTitle}
                        **Subsection ${j}.0 - Core Principles**

                        The Infinite Intelligence Foundation dictates that information flow must be unhindered yet verified. 
                        In this section, we explore the specific mechanics of ${partIndex === 2 ? 'asset tokenization' : 'system architecture'}.
                        
                        *   **Principle A:** Absolute Truth. The ledger cannot lie.
                        *   **Principle B:** Infinite Scalability. The system grows with the network.
                        *   **Principle C:** Benevolent Oversight. The AI ensures compliance and ethical alignment.

                        This protocol serves as the binding agent for the entire ecosystem. 
                        By adhering to these standards, we ensure that the Foundation remains a beacon of stability in a chaotic financial world.

                        *Ref: Protocol Standard 527.${pageCounter}.${j}*
                    `
                });
                pageCounter++;
            }

            chapters.push({
                id: chapterId,
                title: chapterTitle,
                pages: pages
            });
        }
    });

    return chapters;
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
