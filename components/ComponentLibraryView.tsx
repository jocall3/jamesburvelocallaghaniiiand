import React from 'react';
import { Cpu, Shield, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const ComponentLibraryView: React.FC = () => {
    return (
        <div className="blog-container p-6 max-w-4xl mx-auto text-gray-200 font-sans leading-relaxed">
            <h1 className="text-4xl font-extrabold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Beyond the Pixels: 3 Surprising Lessons from an AI Banking UI
            </h1>

            <p className="mb-6 text-lg text-center text-gray-400">
                Ever wonder what truly goes into crafting an intuitive and powerful user interface, especially in a domain as critical as AI banking? We often see the polished final product, but the design decisions beneath the surface tell a fascinating story. Today, we're diving into the core of a modern UI component library for an "AI Banking University" platform to uncover some impactful, perhaps even counter-intuitive, takeaways that elevate a good design to a great one.
            </p>

            <section className="mb-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    1. Dark Mode Isn't Just a Trend; It's a Strategic Brand Statement
                </h2>
                <p className="mb-4">
                    While many platforms default to a light theme, this AI Banking University UI boldly embraces a dark mode first approach. Notice the immediate `text-white` and deep `bg-gray-800/50` backgrounds. This isn't merely an aesthetic choice; it's a deliberate statement that communicates sophistication, modernity, and often, a focus on data-intensive applications where reduced eye strain is a welcome bonus.
                </p>
                <p className="mb-4">
                    Against this elegant dark canvas, the brand's vibrant `cyan-400` and `purple-500` gradients truly pop, creating a distinctive visual identity that feels both cutting-edge and trustworthy. It's a powerful example of how a foundational design decision can amplify brand messaging and set a premium tone from the first glance.
                </p>
                <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-300 my-4">
                    "In the digital realm, your aesthetic is your first handshake. A dark theme, when executed well, whispers 'premium' and 'precision'."
                </blockquote>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    2. Designing for Intent: Guiding Users with Purpose-Built Components
                </h2>
                <p className="mb-4">
                    It's easy to create a generic button or a simple card. What truly stands out here is the intentionality behind each component's design. Buttons aren't just styled differently; they're semantically named: "Primary Action," "Secondary Action," "Neutral Action," "Outline Action." This isn't just developer convenience; it guides users and developers alike on the hierarchy and expected impact of each interaction, streamlining decision-making.
                </p>
                <p className="mb-4">
                    The same principle applies to cards. We don't just have "a card"; we have a "Feature Card," a "Stat Card" (with its green `Activity` icon and financial data), and a striking "Alert Card" (featuring a `Shield` icon and a red theme). Each is meticulously crafted to convey a specific type of information and urgency, transforming simple containers into powerful communication tools. This level of detail ensures clarity, especially in a high-stakes environment like banking.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                    3. The Subtle Art of Feedback: Micro-Interactions That Matter
                </h2>
                <p className="mb-4">
                    Often overlooked, the small details make a huge difference in user experience. This component library is rich with subtle micro-interactions that provide crucial feedback. Notice the `hover:bg-cyan-500` on buttons, the `transition-all` for smooth state changes, and the `focus:border-cyan-500` on form elements. These aren't just decorative; they confirm user actions, indicate interactivity, and make the interface feel responsive and alive.
                </p>
                <p className="mb-4">
                    Even effects like `shadow-lg` and `backdrop-blur-sm` on cards add depth and a premium feel, enhancing the perceived quality and polish of the application. These seemingly minor touches collectively elevate the user's journey from merely functional to genuinely delightful, fostering trust and engagement.
                </p>
            </section>

            <div className="text-center mt-10 pt-6 border-t border-gray-700">
                <p className="text-lg mb-4">
                    From strategic color choices to purpose-driven components and the magic of micro-interactions, this AI Banking University UI offers a masterclass in thoughtful design. It reminds us that every pixel, every transition, and every semantic choice contributes to a larger narrative of user experience and brand identity.
                </p>
                <p className="text-xl font-semibold text-purple-400">
                    What hidden design gems have you discovered in the code you work with?
                </p>
            </div>
        </div>
    );
};

export default ComponentLibraryView;