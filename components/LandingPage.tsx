import React from 'react';
import { Eye } from 'lucide-react';

const LandingPage: React.FC<{ onLoginClick?: () => void }> = ({ onLoginClick }) => {
    // A simple handler for navigation clicks in a static context.
    const handleNavClick = (path: string) => {
        if (onLoginClick) {
            onLoginClick();
        } else {
            // Fallback for standalone use, though routing is not part of this component.
            console.log(`Redirecting to ${path}`);
            window.location.href = path;
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-900/30 rounded-lg flex items-center justify-center border border-cyan-500/30">
                            <Eye size={24} className="text-cyan-400"/>
                        </div>
                        <div>
                            <h1 className="font-bold tracking-wider text-lg leading-none">MIND'S EYE</h1>
                            <span className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Orchestration</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleNavClick('/login')} className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            Log In
                        </button>
                        <button onClick={() => handleNavClick('/login')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20">
                            Enter Demo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content - The Blog Post */}
            <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
                <article className="prose prose-invert prose-lg max-w-none">
                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 mb-6 tracking-tight">
                        I Explored a Futuristic AI Finance Dashboard. Here Are 4 Things It Taught Me About Money's Future.
                    </h1>

                    {/* Introduction */}
                    <p className="text-xl text-gray-400 leading-relaxed">
                        We're told that the future of finance is a dizzying storm of algorithms, blockchains, and artificial intelligence. It feels complex, opaque, and frankly, a little intimidating. But what if you could peek behind the curtain? I recently stumbled upon a project called Mind's Eye Orchestration—a simulated financial dashboard—and it wasn't just a demo. It was a "living textbook," and its source code held some surprisingly profound lessons.
                    </p>
                    <p className="text-gray-400">
                        Here are the four most impactful takeaways that shifted my perspective on technology, value, and the future of our digital economy.
                    </p>

                    <hr className="my-12 border-gray-800" />

                    {/* Takeaway 1 */}
                    <h2 className="text-3xl font-bold text-white">1. The Best Way to Learn About Risk is to Remove It</h2>
                    <p>
                        The first thing you notice about Mind's Eye is a bold declaration: "This is a Simulation." All the data—the transactions, market movements, and balances—is fake. My initial thought was, "What's the point?" But then it clicked. The greatest barrier to understanding complex systems isn't their complexity; it's the fear of consequence.
                    </p>
                    <p>
                        By creating a production-grade sandbox, the platform transforms a high-stakes environment into a playground for curiosity. You can explore high-frequency trading algorithms or decentralized asset management without risking a single dollar. This isn't just a feature; it's a fundamental statement about education. The future of learning complex, high-risk subjects isn't about reading textbooks; it's about building sophisticated, safe environments to experiment within.
                    </p>

                    {/* Takeaway 2 */}
                    <h2 className="text-3xl font-bold text-white">2. Value Isn't a Number; It's a Vector</h2>
                    <p>
                        Buried in the project's "Foundational Texts" was a line that stopped me in my tracks. It reframes the entire concept of value in the digital age.
                    </p>
                    <blockquote className="border-l-4 border-cyan-500 pl-6 text-xl italic text-gray-300">
                        Value is not static; it is a vector quantity, possessing both magnitude and direction. In the digital age, value flows like energy through a circuit. To harness it, we must understand the resistance (regulation), the voltage (demand), and the current (liquidity).
                    </blockquote>
                    <p>
                        This is a powerful mental model. We're used to thinking of money as a static number in an account. But this perspective sees it as a dynamic force, a current flowing through a global circuit. An AI-driven system like Mind's Eye isn't just tracking balances; it's "visualizing the invisible forces that shape our economy." It's a paradigm shift from accounting to physics.
                    </p>

                    {/* Takeaway 3 */}
                    <h2 className="text-3xl font-bold text-white">3. The Interface is the Product</h2>
                    <p>
                        The system is built on a core axiom: "The interface is the product; the code is the truth." In an era of information overload, the ultimate value isn't just access to data, but its coherent synthesis. The "Orchestration Layer" of Mind's Eye does exactly this: it ingests data from disparate sources, uses an AI core to process it, and renders it all in a unified, intuitive dashboard.
                    </p>
                    <p>
                        The technical complexity under the hood is immense, but the user doesn't feel it. That's the point. The product isn't the powerful AI or the real-time data streams; it's the calm, clear visualization that allows for human decision-making. As our world gets more complex, the most valuable products will be those that create simplicity.
                    </p>

                    {/* Takeaway 4 */}
                    <h2 className="text-3xl font-bold text-white">4. Automation is the Only Hedge Against Complexity</h2>
                    <p>
                        Another of the project's axioms is that "Automation is the only hedge against complexity." This might sound dystopian, but it's deeply practical. The sheer volume and velocity of financial data have long surpassed human-scale comprehension. We can't keep up, and we don't have to.
                    </p>
                    <p>
                        The role of AI and automation, as framed here, isn't to replace human judgment but to augment it. The system handles the relentless task of pattern recognition and anomaly detection, freeing up the human operator to focus on strategy and higher-level decisions. It's not about man versus machine, but man *with* machine, using automation as a powerful tool to navigate a world too complex to manage alone.
                    </p>

                    <hr className="my-12 border-gray-800" />

                    {/* Conclusion */}
                    <h2 className="text-3xl font-bold text-white">A Glimpse of What's Next</h2>
                    <p>
                        Exploring Mind's Eye felt like reading a blueprint for the next generation of digital tools. It's a future where learning is experiential, value is dynamic, and complexity is managed through elegant design and intelligent automation. It's a reminder that the most powerful technologies aren't just about processing power; they're about providing clarity.
                    </p>
                    <p className="text-cyan-400 font-medium">
                        It leaves me with one final question: If our tools shape our thinking, what new thoughts will we be able to think when our dashboards are no longer just calculators, but cognitive partners?
                    </p>
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-800 bg-black py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Eye size={20} className="text-gray-600" />
                        <span className="font-bold text-gray-400">Mind's Eye Orchestration</span>
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                        COPYRIGHT © 2025 MIND'S EYE ORCHESTRATION.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;