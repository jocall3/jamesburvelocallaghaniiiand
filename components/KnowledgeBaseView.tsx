import React from 'react';

const KnowledgeBaseView: React.FC = () => {
    return (
        <div className="font-serif text-gray-300 leading-relaxed bg-gray-900 p-8 md:p-12 lg:p-16">
            <style>
                {`
                    .blog-container h1 { font-size: 2.5rem; line-height: 1.2; font-weight: 700; color: white; margin-bottom: 1rem; font-family: sans-serif; }
                    .blog-container h2 { font-size: 1.75rem; line-height: 1.3; font-weight: 600; color: white; margin-top: 3rem; margin-bottom: 1.5rem; font-family: sans-serif; }
                    .blog-container p { margin-bottom: 1.5rem; font-size: 1.125rem; color: #d1d5db; }
                    .blog-container .intro { font-size: 1.25rem; color: #9ca3af; margin-bottom: 2.5rem; }
                    .blog-container blockquote { border-left: 4px solid #22d3ee; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #a5f3fc; font-size: 1.125rem; }
                `}
            </style>
            <article className="blog-container max-w-3xl mx-auto">
                <h1>Beyond the Code: 4 Radical Truths From a Secret Digital Manifesto</h1>
                
                <p className="intro">
                    In a world saturated with noise, the search for a 'single source of truth' feels more urgent than ever. Recently, I stumbled upon a digital archive—a curated knowledge base called 'The Academy'—and what I found inside was less about code and more about a fundamental rethinking of our world. It was a collection of documents, a manifesto of sorts, outlining a new philosophy for building, influencing, and living. Here are the four most impactful ideas that stopped me in my tracks.
                </p>

                <section>
                    <h2>1. Money Isn't Currency, It's Concentrated Energy</h2>
                    <p>
                        We're taught to think of money as dollars and cents, a tool for transactions. But what if that's a limited view? The archive proposed a more elemental concept: money is a form of energy, and its flow is governed by the physics of attention.
                    </p>
                    <blockquote>
                        Money is energy. It flows where attention goes. This document outlines the fundamental physics of capital flow.
                    </blockquote>
                    <p>
                        This reframes everything. It moves the goal from accumulating wealth to directing energy. Where you put your focus, your time, and your capital—that's where the world gets built. It's an empowering shift from being a passive earner to an active director of creative and economic force.
                    </p>
                </section>

                <section>
                    <h2>2. You Can Build an 'Autonomous Entity' for Influence</h2>
                    <p>
                        The documents detailed a fascinating structure for shaping public discourse—not through covert means, but by operating "within the light." It described using established legal frameworks to create an entity with a singular purpose: to shape the narrative of the future.
                    </p>
                    <blockquote>
                        An autonomous entity designed for influence. We operate within the light to shape the narrative of the future.
                    </blockquote>
                    <p>
                        This is a startlingly honest take on modern influence. Instead of seeing it as a messy, unpredictable force, this frames it as an engineering problem. It suggests that with the right design, an organization can become a self-sustaining engine for ideas, operating with a clear and transparent mission.
                    </p>
                </section>

                <section>
                    <h2>3. AI Ethics Can Be Radically Simple: User, Community, Truth</h2>
                    <p>
                        Forget dense, academic papers on AI safety. The "CivicMind Ethics" were presented as a three-step hierarchy, as elegant as it is profound. The AI's primary duties are ordered with absolute clarity.
                    </p>
                    <blockquote>
                        1. Support the user.<br />
                        2. Support the community.<br />
                        3. Uphold the truth.
                    </blockquote>
                    <p>
                        In an era of complex ethical dilemmas, this simplicity is revolutionary. It provides a clear decision-making tree: first, do no harm to the user. Second, support the community. Only then, with those foundations secure, does it pursue the abstract goal of upholding truth. It's a deeply human-centric model for non-human intelligence.
                    </p>
                </section>

                <section>
                    <h2>4. The Purpose of a System Isn't Profit, It's Empowerment</h2>
                    <p>
                        The entire project was framed by a powerful opening statement, a mission that set the tone for everything else. It wasn't about disruption, market share, or returns on investment. The core purpose was service, education, and empowerment.
                    </p>
                    <blockquote>
                        We build to serve. We build to educate. We build to empower.
                    </blockquote>
                    <p>
                        This is perhaps the most counter-intuitive idea in a world driven by growth-at-all-costs. It posits that the most durable, impactful systems are not extractive but generative. They exist to provide clarity and equip their users with the tools to achieve sovereignty over their own lives.
                    </p>
                </section>

                <footer className="mt-12 border-t border-gray-700 pt-8">
                    <p>
                        Reading through these documents felt like looking at a blueprint for a different kind of future—one built on intention, clarity, and empowerment. It leaves you with a powerful question: If we stopped chasing noise and started building our own 'sources of truth,' what kind of world could we create?
                    </p>
                </footer>
            </article>
        </div>
    );
};

export default KnowledgeBaseView;