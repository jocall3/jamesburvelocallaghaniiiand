```typescript
import React from 'react';

interface Policy {
  id: string;
  name: string;
  provider: string;
  coverage: {
    [key: string]: string | number | boolean;
  };
  premium: number;
  deductible: number;
}

interface PolicyComparatorProps {
  policyA: Policy;
  policyB: Policy;
}

const PolicyComparator: React.FC<PolicyComparatorProps> = ({ policyA, policyB }) => {
  const allCoverageKeys = Array.from(
    new Set([...Object.keys(policyA.coverage), ...Object.keys(policyB.coverage)])
  );

  return (
    <div className="policy-comparator">
      <h2>Policy Comparison</h2>
      <div className="policies">
        <div className="policy">
          <h3>{policyA.name}</h3>
          <p>Provider: {policyA.provider}</p>
          <p>Premium: ${policyA.premium}</p>
          <p>Deductible: ${policyA.deductible}</p>
          <h4>Coverage Details:</h4>
          <ul>
            {allCoverageKeys.map((key) => (
              <li key={key}>
                {key}: {policyA.coverage[key] != null ? policyA.coverage[key].toString() : 'N/A'}
              </li>
            ))}
          </ul>
        </div>

        <div className="policy">
          <h3>{policyB.name}</h3>
          <p>Provider: {policyB.provider}</p>
          <p>Premium: ${policyB.premium}</p>
          <p>Deductible: ${policyB.deductible}</p>
          <h4>Coverage Details:</h4>
          <ul>
            {allCoverageKeys.map((key) => (
              <li key={key}>
                {key}: {policyB.coverage[key] != null ? policyB.coverage[key].toString() : 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PolicyComparator;
```