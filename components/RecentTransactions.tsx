import React from 'react';

const RecentTransactions: React.FC = () => {
  return (
    <div className="bg-gray-50 font-serif antialiased">
      <main className="max-w-3xl mx-auto py-12 px-6 bg-white shadow-lg">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            I Found a Secret Manifesto in a React Component. It Changes Everything About Finance.
          </h1>
          <p className="text-lg text-gray-600">
            Hidden in the code comments of a simple transaction list lies a radical vision for our financial future.
          </p>
        </header>

        <article className="prose lg:prose-xl max-w-none text-gray-800">
          <p className="lead text-xl mb-8">
            We’ve all grown accustomed to the slick, sterile interfaces of our banking apps. They show us numbers—neat rows of debits and credits that quantify our lives. They’re useful, but they’re also profoundly uninspired. They feel like a digital filing cabinet, not a tool for empowerment. But what if that wasn't the whole story?
          </p>
          <p className="mb-12">
            While reviewing a seemingly mundane piece of code—a React component for displaying recent transactions—I stumbled upon a series of comments that stopped me in my tracks. They weren't notes for another developer. They were fragments of a philosophy, a manifesto for a new kind of financial existence. Here are the four most powerful takeaways that challenge everything we assume about our money.
          </p>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">
              1. This Isn't a Better App. It's a "Sovereign Financial Entity."
            </h2>
            <p className="mb-4">
              The first and most jarring idea is that the goal isn't to simply build a better banking app. The tech world is obsessed with "disruption," which usually just means putting a nicer interface on an old system. The vision here is far more ambitious: it's about <em>creation</em>.
            </p>
            <blockquote className="border-l-4 border-gray-300 pl-6 py-2 my-6 italic text-gray-600">
              <p>"O'Callaghan's vision wasn't about a better banking app. It's about a sovereign financial entity. This component? A simple nerve ending, feeding real-time data to the brain. The skeptics screech about disruption; they can't comprehend creation."</p>
            </blockquote>
            <p>
              Think about that. The user interface we see isn't the product; it's merely a "nerve ending." It’s a sensory organ for a much larger, more intelligent organism. This reframes our relationship with our finances from one of passive observation to active participation in a living system that we, the users, own and control.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">
              2. A Transaction Isn't Just a Number. It's a Story.
            </h2>
            <p className="mb-4">
              We see "$4.50, Coffee Shop" and our brain files it away. It's data. But the philosophy embedded in this code argues that we're missing the point. Every financial event is an action, a choice, a tiny piece of our life's story. The system should reflect that.
            </p>
            <blockquote className="border-l-4 border-gray-300 pl-6 py-2 my-6 italic text-gray-600">
              <p>"He understood symbolism. A transaction isn't just a number; it's an action, a story. These glyphs are the shorthand."</p>
            </blockquote>
            <p>
              This explains the careful choice of icons for categories like 'Dining' or 'Shopping'. They aren't just decorative flair. They are "glyphs," a shorthand for the story of that transaction. It’s a subtle but profound shift: from a sterile ledger to a personal chronicle. It asks us to see our financial lives not as a series of calculations, but as a narrative we are actively writing.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">
              3. True Financial Sovereignty Means Knowing the <em>Total</em> Cost.
            </h2>
            <p className="mb-4">
              Perhaps the most counter-intuitive feature in the component is a small "Carbon Footprint" badge next to a transaction. In a normal app, this would feel like a greenwashing gimmick. Here, it’s presented as a core tenet of financial control.
            </p>
            <blockquote className="border-l-4 border-gray-300 pl-6 py-2 my-6 italic text-gray-600">
              <p>"O'Callaghan knew that true financial sovereignty requires understanding total cost, not just the monetary one. This is a small but critical piece of that truth."</p>
            </blockquote>
            <p>
              The argument is radical: you can't be truly sovereign over your finances if you only understand one dimension of their impact. The monetary cost is just the beginning. By surfacing the environmental cost, the system forces a more holistic understanding of our consumption. It suggests that true ownership means taking responsibility for the full consequences of our actions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-4">
              4. The Interface is a Mirror, Not a Gatekeeper.
            </h2>
            <p className="mb-4">
              Most platforms want to mediate our reality. They use algorithms and design choices to shape our perception of our own data. This philosophy rejects that entirely. The role of the interface is not to interpret, but to reflect.
            </p>
            <blockquote className="border-l-4 border-gray-300 pl-6 py-2 my-6 italic text-gray-600">
              <p>"This component doesn't think. It reflects. It's a mirror for the user's recent history, fed from the central truth of the ledger."</p>
            </blockquote>
            <p>
              The data is described as a "stream of immutable facts" from a "central truth." The component is just a mirror held up to that truth. There is a powerful sense of integrity in this idea. It’s a promise that what you see is a direct, unfiltered view of your own history, free from judgment or manipulation. It puts the power of interpretation solely in the hands of the user.
            </p>
          </section>

          <footer className="mt-16 pt-8 border-t border-gray-200">
            <p className="mb-4">
              Taken together, these fragments paint a picture of a financial future that is more conscious, narrative-driven, and radically transparent. It's a move away from simply managing money to truly understanding the story it tells and the impact it has. It leaves us with a powerful question to ponder.
            </p>
            <p className="text-xl font-semibold text-center italic text-gray-700 mt-8">
              What if your bank didn't just show you what you spent, but what your spending <em>created</em>?
            </p>
          </footer>
        </article>
      </main>
    </div>
  );
};

export default RecentTransactions;