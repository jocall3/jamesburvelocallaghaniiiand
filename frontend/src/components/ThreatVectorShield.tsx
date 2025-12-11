import React from 'react';

// Define the shape of a threat vector
interface ThreatVector {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  // Add more fields as needed, e.g., 'count', 'lastDetected', 'status', 'resourceAffected'
}

// Define the props for the ThreatVectorShield component
interface ThreatVectorShieldProps {
  threatVectors: ThreatVector[];
  isLoading?: boolean;
  error?: string;
}

const ThreatVectorShield: React.FC<ThreatVectorShieldProps> = ({
  threatVectors,
  isLoading,
  error,
}) => {
  // Define colors for severities
  const severityColors = {
    CRITICAL: '#ef4444', // red-500
    HIGH: '#f97316',     // orange-500
    MEDIUM: '#eab308',   // yellow-500
    LOW: '#22c55e',      // green-500
  };

  // Sizing constants for the visualization
  const shieldCoreSize = 120; // Size of the central shield icon/info
  const vectorOrbitRadius = 200; // Distance of threat vectors from the center of the shieldWrapper
  const itemWidth = 100; // Width of a threat vector item
  const itemHeight = 30; // Height of a threat vector item

  // Calculate the wrapper size to contain the orbiting items
  // Max extent = orbitRadius + half of item's max dimension (width or height)
  // Wrapper size = 2 * max extent
  const shieldWrapperSize = (vectorOrbitRadius + Math.max(itemWidth / 2, itemHeight / 2)) * 2;

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading threat data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Active Threat Vectors</h2>
      <div style={{ ...styles.shieldWrapper, width: shieldWrapperSize, height: shieldWrapperSize }}>
        <div style={{ ...styles.shieldCore, width: shieldCoreSize, height: shieldCoreSize }}>
          🛡️
          <div style={styles.threatCount}>{threatVectors.length}</div>
          <div style={styles.threatLabel}>Threats</div>
        </div>

        {threatVectors.length === 0 ? (
          <div style={styles.noThreats}>No active threats detected.</div>
        ) : (
          threatVectors.map((vector, index) => {
            const angle = (index / threatVectors.length) * 360; // Distribute items evenly in a circle
            // Apply transformations:
            // 1. translate(-50%, -50%) to center the item's pivot point.
            // 2. rotate(angle) to rotate around the parent's center.
            // 3. translateY(-vectorOrbitRadius) to move the item outwards along its new local y-axis.
            const itemTransform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${vectorOrbitRadius}px)`;

            return (
              <div
                key={vector.id}
                style={{
                  ...styles.threatVectorItem,
                  width: itemWidth,
                  height: itemHeight,
                  backgroundColor: severityColors[vector.severity],
                  transform: itemTransform,
                }}
                title={`${vector.name}: ${vector.description || 'No description'}`}
              >
                {/* Rotate content back to keep text upright relative to the screen */}
                <div style={{ transform: `rotate(-${angle}deg)` }}>
                  <span style={styles.vectorName}>{vector.name.length > 15 ? vector.name.substring(0, 12) + '...' : vector.name}</span>
                  <span style={styles.vectorSeverity}>{vector.severity}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Basic inline styles for demonstration. In a real project, consider CSS modules or a styling library for better maintainability and reusability.
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#1f2937', // dark grey background
    color: '#e5e7eb', // light grey text
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    minWidth: '400px', // Ensure a minimum readable size
    margin: 'auto', // Center the component
  },
  title: {
    color: '#a78bfa', // purple-400
    marginBottom: '15px',
    fontSize: '1.8em',
  },
  loadingState: {
    fontSize: '1.2em',
    color: '#9ca3af',
    padding: '50px',
  },
  errorState: {
    fontSize: '1.2em',
    color: '#ef4444',
    padding: '50px',
  },
  noThreats: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '1.1em',
    color: '#9ca3af',
    textAlign: 'center',
    width: '80%', // Limit width to prevent overflow
  },
  shieldWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    border: '2px solid #a78bfa', // purple border
    boxShadow: '0 0 15px rgba(167, 139, 250, 0.7)',
    flexShrink: 0,
    marginTop: '20px',
  },
  shieldCore: {
    borderRadius: '50%',
    backgroundColor: '#4c1d95', // deep purple
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#e5e7eb',
    fontSize: '3em',
    fontWeight: 'bold',
    boxShadow: '0 0 10px rgba(167, 139, 250, 0.5), inset 0 0 10px rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  threatCount: {
    fontSize: '1em',
    marginTop: '5px',
    fontWeight: 'normal',
    color: '#e5e7eb',
  },
  threatLabel: {
    fontSize: '0.6em',
    color: '#e5e7eb',
  },
  threatVectorItem: {
    position: 'absolute',
    padding: '0px 10px',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '0.8em',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, background-color 0.3s ease',
    zIndex: 2,
    border: '1px solid rgba(255,255,255,0.3)',
    top: '50%', // Position at center of parent
    left: '50%', // Position at center of parent
  },
  vectorName: {
    fontWeight: 'bold',
    marginBottom: '2px',
  },
  vectorSeverity: {
    fontSize: '0.7em',
    opacity: 0.9,
  },
};

export default ThreatVectorShield;