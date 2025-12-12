import React from 'react';
import { Orbit, Puzzle, BarChart4, ShieldCheck, Code } from 'lucide-react';

const TreasuryView: React.FC = () => {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="bg-gray-900 text-gray-300 min-h-screen font-sans antialiased">
            <main className="max-w-4xl mx-auto p-8 md:p-12">
                <article className="space-y-8">
                    <header>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 tracking-tight leading-tight mb-4">
                            From React Code to Financial Insight: 5 Surprising Lessons Inside a Treasury Dashboard
                        </h1>
                        <p className="text-lg text-gray-400">
                            By A.I. Synthesizer | Published on {today}
                        </p>
                    </header>

                    <p className="text-xl text-gray-200 leading-relaxed border-l-4 border-cyan-500 pl-6">
                        Ever glanced at a complex financial dashboard, all flashing numbers and intricate charts, and wondered what's really going on under the hood? We did. We dove into the source code of a sophisticated Global Treasury Operations dashboard, and what we found wasn't just about finance—it was a masterclass in modern software development, data storytelling, and proactive design.
                    </p>

                    {/* --- Section 1 --- */}
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <Orbit className="text-cyan-400" size={28} />
                            1. It’s All a Simulation (And That’s a Good Thing)
                        </h2>
                        <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
                            <p>
                                The first and most startling discovery was that the entire, vibrant dashboard—from fluctuating currency values to sudden risk alerts—was powered by an internal simulation. No live APIs, no database connections. The code was generating its own realistic, dynamic data on the fly.
                            </p>
                            <p>
                                This might seem like a shortcut, but it's actually a stroke of genius. Building a high-fidelity "digital twin" of a financial system allows developers to build and test with incredible speed and safety. They can model worst-case scenarios, like a sudden liquidity crisis, without any real-world consequences. It’s a powerful reminder that sometimes, the most effective way to build for reality is to first master a simulation of it.
                            </p>
                            <blockquote className="border-l-4 border-gray-600 p-4 bg-gray-800/50 rounded-r-lg my-6">
                                <p className="text-gray-400 italic">
                                    "You can't just ask a bank for a live API key to build a UI. You have to create a high-fidelity digital twin of the entire financial system first. It's how you build resilient software."
                                </p>
                            </blockquote>
                        </div>
                    </section>

                    {/* --- Section 2 --- */}
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <Puzzle className="text-cyan-400" size={28} />
                            2. Great Dashboards Are Built Like LEGOs
                        </h2>
                        <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
                            <p>
                                Peeking into the code reveals a beautifully simple principle: the entire complex interface is assembled from small, reusable pieces. Components named `<Card>` and `<MetricTile>` are defined once and then used repeatedly to build the layout.
                            </p>
                            <p>
                                This component-based architecture is the secret to managing complexity. Instead of a monolithic wall of code, you have a tidy collection of building blocks. This ensures visual consistency, makes the application easier to maintain, and allows the team to develop new features with astonishing speed. It's a testament to the idea that the most impressive structures are often built from the simplest, most elegant parts.
                            </p>
                        </div>
                    </section>

                    {/* --- Section 3 --- */}
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <BarChart4 className="text-cyan-400" size={28} />
                            3. Every Chart Tells a Deliberate Story
                        </h2>
                        <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
                            <p>
                                The dashboard doesn't just throw data at you; it tells a story through carefully chosen visualizations. A flowing `AreaChart` is used for the 12-month liquidity forecast, perfectly capturing the continuous ebb and flow of cash over time. In contrast, a stark `BarChart` displays the debt maturity profile, emphasizing the discrete, looming deadlines of principal payments.
                            </p>
                            <p>
                                This isn't accidental. It's a masterclass in data communication. The choice of chart is as important as the data itself. By selecting the right visual metaphor, the code transforms raw numbers into immediate, actionable insight. It proves that effective data visualization isn't just about making things look pretty—it's about making them instantly understood.
                            </p>
                        </div>
                    </section>

                    {/* --- Section 4 --- */}
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <ShieldCheck className="text-cyan-400" size={28} />
                            4. The Best UI Doesn’t Just Report—It Warns
                        </h2>
                        <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
                            <p>
                                One of the most impactful features is the "Risk & Compliance Status" card. It doesn't just display a status; it uses color and clear, concise language to signal urgency. A green border means all is well, yellow signals caution, and red screams for immediate attention.
                            </p>
                            <p>
                                This is proactive design. The system is built to do more than just present information; it's designed to help the user make better, faster decisions. By embedding risk detection logic directly into the interface, the dashboard becomes an active partner in managing the company's financial health, not just a passive observer.
                            </p>
                        </div>
                    </section>

                    {/* --- Section 5 --- */}
                    <section className="mt-12">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                            <Code className="text-cyan-400" size={28} />
                            5. The Frontend Is Where the Magic Happens
                        </h2>
                        <div className="space-y-4 text-lg text-gray-300 leading-relaxed">
                            <p>
                                Gone are the days when the "frontend" was just a pretty face for a powerful backend. In this dashboard, significant business logic lives directly in the React code. The "Total Global Liquidity," for example, is calculated on the fly by converting and summing up all cash positions in real-time.
                            </p>
                            <p>
                                This demonstrates a crucial shift in modern web development. The frontend is a powerful application in its own right, responsible for managing complex state, performing calculations, and creating a responsive, living experience for the user. It’s where data is not just displayed, but actively synthesized into wisdom.
                            </p>
                        </div>
                    </section>

                    {/* --- Conclusion --- */}
                    <footer className="pt-8">
                        <hr className="border-gray-700 my-8" />
                        <p className="text-xl text-gray-200 leading-relaxed mb-8">
                            In the end, deconstructing this dashboard was a powerful reminder that a well-designed piece of code is more than just instructions for a computer. It’s a repository of strategic decisions, design philosophies, and a deep understanding of the user's needs. It’s a story waiting to be read.
                        </p>
                        <p className="text-2xl font-semibold text-cyan-400 italic">
                            It makes you wonder: what hidden stories are lurking in the code behind the apps you use every day?
                        </p>
                    </footer>
                </article>
            </main>
        </div>
    );
};

export default TreasuryView;