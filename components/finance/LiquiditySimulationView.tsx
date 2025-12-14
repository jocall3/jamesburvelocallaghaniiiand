import React, { useState, useEffect } from 'react';

function LiquiditySimulationView({ initialLcr, initialNSFR }) {
  const [lcr, setLcr] = useState(initialLcr);
  const [nsfr, setNSFR] = useState(initialNSFR);

  useEffect(() => {
    // Simulate LCR and NSFR changes based on user input or external data
    const simulateLCR = () => {
      setLcr(initialLcr + 0.1);
    };

    const simulateNSFR = () => {
      setNSFR(initialNSFR + 0.05);
    };

    simulateLCR();
    simulateNSFR();
  }, []);

  return (
    <div>
      <h1>Liquidity Simulation</h1>
      <p>LCR: {lcr}</p>
      <p>NSFR: {nsfr}</p>
      <button onClick={simulateLCR}>Simulate LCR Change</button>
      <button onClick={simulateNSFR}>Simulate NSFR Change</button>
    </div>
  );
}

export default LiquiditySimulationView;