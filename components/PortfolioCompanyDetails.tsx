import React from 'react';

interface PortfolioCompanyDetailsProps {
  companyId: string;
}

export const PortfolioCompanyDetails: React.FC<PortfolioCompanyDetailsProps> = ({ companyId }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-300 font-sans animate-in fade-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
        The VC Insider's View: 4 Metrics That Reveal a Startup’s True Potential
      </h1>
      
      <p className="text-lg text-gray-400 mb-12">
        Ever wonder what separates a venture-backed rocket ship from a promising idea that fizzles out? It's not just about the charismatic founder or the flashy pitch deck. The real story is in the numbers—the cold, hard data that lands on the desks of partners at firms like Sequoia and a16z. Let's pull back the curtain and decode the four key metrics that truly matter.
      </p>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-white mb-3 border-l-4 border-cyan-400 pl-4">
            1. ARR Isn't Just Revenue; It's the Heartbeat
          </h2>
          <p className="mb-4">
            Forget one-time sales. In the world of software and subscription businesses, Annual Recurring Revenue (ARR) is king. It’s the predictable, stable income a company can expect over the next twelve months. It’s a measure of health, customer loyalty, and product-market fit all rolled into one.
          </p>
          <p className="mb-4">
            When a company like the hypothetical 'Nexus AI' reports an ARR of <strong>$12.5M</strong>, it tells investors they've built something people are willing to pay for consistently. It’s the foundation upon which all future growth is built. It’s not just a number; it’s a signal of a sustainable business model.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-3 border-l-4 border-green-400 pl-4">
            2. Growth Is the Story, But Context Is King
          </h2>
          <p className="mb-4">
            A staggering <strong>140% Year-over-Year (YoY) growth</strong> figure will make any investor sit up straight. It’s the narrative engine of a startup, proving that the company is not just stable, but rapidly capturing a market. It screams momentum.
          </p>
          <blockquote className="border-l-4 border-gray-500 pl-4 py-2 my-4 text-gray-400 italic">
            "Growth solves most problems. It's the single most important indicator of a startup's potential to become a category-defining company."
          </blockquote>
          <p className="mb-4">
            But top-tier investors dig deeper. Is this growth efficient? Is the cost of acquiring a new customer sustainable? 140% growth is phenomenal, but it’s the *quality* of that growth that separates a future giant from a flash in the pan.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-3 border-l-4 border-red-400 pl-4">
            3. The Burn Rate: A Ticking Clock or a Rocket Engine?
          </h2>
          <p className="mb-4">
            Seeing a company burn through <strong>$450k per month</strong> might sound alarming. And sometimes, it is. The "burn rate" is the speed at which a company is spending its cash reserves. A high burn with low growth is a five-alarm fire.
          </p>
          <p className="mb-4">
            However, in a high-growth startup, burn is often a strategic choice. It’s investment. That $450k could be going into hiring top engineering talent, aggressive marketing campaigns, or scaling infrastructure. The crucial question isn't *how much* is being burned, but *what is the return* on that investment? Is it buying market share? Is it accelerating product development? In the right context, burn is the fuel for the rocket engine.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-3 border-l-4 border-yellow-400 pl-4">
            4. Runway: The Ultimate Reality Check
          </h2>
          <p className="mb-4">
            If burn rate is the speed, runway is the distance you have left. It’s the number of months a company can survive at its current burn rate before the cash runs out. For our case study, an <strong>18-month runway</strong> is a position of strength.
          </p>
          <p className="mb-4">
            This single metric reveals so much about a company's leadership and operational discipline. A healthy runway means the team isn't operating out of desperation. It gives them time to execute their strategy, navigate unexpected challenges, and raise their next round of funding from a position of power, not panic. It's the ultimate measure of strategic foresight.
          </p>
        </section>

        <hr className="border-gray-700 my-8" />
        
        <section>
          <h2 className="text-3xl font-bold text-white mb-4">
            The Full Picture
          </h2>
          <p className="text-lg text-gray-400 mb-6">
            None of these metrics exist in a vacuum. A high burn rate is terrifying with a short runway but exciting with explosive growth. High ARR is great, but meaningless if it's stagnant. Together, they paint a vivid picture of a company's journey—its stability, its ambition, its efficiency, and its odds of survival. They transform a simple investment from a blind bet into a calculated risk.
          </p>
          <p className="text-xl text-white font-semibold">
            So, the next time you read about a startup's funding round, look past the headline figure. Ask about the engine beneath the hood. If you had to judge a company's future on just one of these four metrics, which would you choose?
          </p>
        </section>
      </div>
    </div>
  );
};