import React from 'react';
import { CONSTITUTIONAL_ARTICLES } from '../../../data/constitutionalArticles';
import { motion } from 'framer-motion';

interface ConstitutionalArticleViewProps {
    articleNumber: number;
}

const ConstitutionalArticleView: React.FC<ConstitutionalArticleViewProps> = ({ articleNumber }) => {
    const article = CONSTITUTIONAL_ARTICLES.find(a => a.id === articleNumber);

    if (!article) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                    <h2 className="text-2xl font-serif text-gray-400 mb-2">Article Not Found</h2>
                    <p>The requested article of the Constitution does not exist in the current ledger.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-950 text-gray-100 overflow-hidden relative">
            {/* Background seal/watermark effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Section */}
            <div className="flex-none p-8 border-b border-gray-800 z-10 bg-gray-950/80 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <span className="block text-amber-500 font-serif tracking-widest text-sm uppercase mb-2">
                        The Sovereign's Ledger &mdash; Article {article.romanNumeral}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mb-4">
                        {article.title}
                    </h1>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto opacity-50" />
                </motion.div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto z-10 custom-scrollbar">
                <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-12">
                    
                    {/* The Doctrine (The Law) */}
                    <section className="space-y-6">
                        <motion.h2 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-xl text-cyan-400 font-medium flex items-center gap-3 uppercase tracking-wider text-xs"
                        >
                            <span className="w-8 h-[1px] bg-cyan-400/50"></span>
                            The Doctrine
                            <span className="w-8 h-[1px] bg-cyan-400/50"></span>
                        </motion.h2>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="prose prose-invert prose-lg max-w-none font-serif leading-relaxed text-gray-200"
                        >
                            {/* Render content paragraphs */}
                            {Array.isArray(article.content) ? (
                                article.content.map((paragraph: string, idx: number) => (
                                    <p key={idx} className="mb-4 first-letter:text-3xl first-letter:font-bold first-letter:text-amber-500 first-letter:mr-1 float-none">
                                        {paragraph}
                                    </p>
                                ))
                            ) : (
                                <p className="whitespace-pre-wrap">{article.content}</p>
                            )}
                        </motion.div>
                    </section>

                    {/* Divider */}
                    <div className="flex items-center justify-center py-4 opacity-30">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                        <div className="mx-4 text-amber-500 text-xl">§</div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent"></div>
                    </div>

                    {/* The Philosophical Basis (Commentary) */}
                    {article.commentary && (
                        <section className="space-y-6 relative">
                            {/* Decorative Quote Mark */}
                            <div className="absolute -top-8 -left-8 text-8xl text-gray-800 font-serif opacity-20 pointer-events-none">“</div>

                            <motion.h2 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-xl text-amber-400 font-medium flex items-center gap-3 uppercase tracking-wider text-xs"
                            >
                                <span className="w-8 h-[1px] bg-amber-400/50"></span>
                                The Architect's Commentary
                                <span className="w-8 h-[1px] bg-amber-400/50"></span>
                            </motion.h2>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.6 }}
                                className="bg-gray-900/50 border-l-2 border-amber-500/30 p-6 md:p-8 rounded-r-lg italic text-gray-400"
                            >
                                <p className="leading-relaxed">
                                    {article.commentary}
                                </p>
                            </motion.div>
                        </section>
                    )}

                    {/* Key Principles / Clauses Grid if available */}
                    {article.clauses && article.clauses.length > 0 && (
                        <section className="mt-12">
                             <motion.h2 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-center text-xs uppercase tracking-widest text-gray-500 mb-8"
                            >
                                Core Principles
                            </motion.h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {article.clauses.map((clause: any, index: number) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 + (index * 0.1) }}
                                        className="bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors duration-300"
                                    >
                                        <h3 className="text-cyan-400 font-medium mb-2 text-sm uppercase tracking-wide">
                                            {clause.title || `Clause ${index + 1}`}
                                        </h3>
                                        <p className="text-gray-400 text-sm leading-relaxed">
                                            {clause.text}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Footer / Signature Block */}
                    <div className="pt-16 pb-8 flex justify-center opacity-40">
                        <div className="text-center space-y-2">
                            <div className="h-px w-48 bg-gray-600 mx-auto"></div>
                            <p className="text-xs font-serif italic text-gray-500">Ratified by The Sovereign</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConstitutionalArticleView;