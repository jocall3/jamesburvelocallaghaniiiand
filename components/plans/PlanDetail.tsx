import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface PlanFeature {
  name: string;
  available: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: PlanFeature[];
  ctaText: string;
  isPopular?: boolean;
}

interface PlanDetailProps {
  plan: Plan;
  onSubscribe: (planId: string) => void;
}

const PlanDetail: React.FC<PlanDetailProps> = ({ plan, onSubscribe }) => {
  return (
    <Card className={`relative w-full max-w-sm ${plan.isPopular ? 'border-2 border-primary' : ''}`}>
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Most Popular
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold">{plan.price}</div>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature.name} className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className={`h-5 w-5 ${feature.available ? 'text-primary' : 'text-gray-400'}`} />
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSubscribe(plan.id)} className="w-full">
          {plan.ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PlanDetail;