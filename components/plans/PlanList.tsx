import React from 'react';
import PlanCard from './PlanCard';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  ctaText: string;
}

interface PlanListProps {
  plans: Plan[];
}

const PlanList: React.FC<PlanListProps> = ({ plans }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          price={plan.price}
          features={plan.features}
          ctaText={plan.ctaText}
        />
      ))}
    </div>
  );
};

export default PlanList;