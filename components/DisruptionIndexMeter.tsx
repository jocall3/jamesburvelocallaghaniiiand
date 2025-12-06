
import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface DisruptionIndexMeterProps {
  indexValue: number; // Numerical value of the disruption index (0-100)
  maxValue?: number; // Maximum value for the index (defaults to 100)
  meterLabel?: string; // Optional label for the meter, e.g., "Disruption Index"
}

const DisruptionIndexMeter: React.FC<DisruptionIndexMeterProps> = ({
  indexValue,
  maxValue = 100,
  meterLabel = 'Disruption Index',
}) => {
  // Ensure indexValue is within the valid range (0-maxValue)
  const normalizedIndex = Math.min(maxValue, Math.max(0, indexValue));
  const percentage = (normalizedIndex / maxValue) * 100;

  // Define color stops for the meter's color gradient
  const colorStops = [
    { stop: 0, color: '#E53935' },   // Red (Low disruption)
    { stop: 50, color: '#FB8C00' },  // Orange (Medium disruption)
    { stop: 100, color: '#43A047' }, // Green (High disruption)
  ];

  // Function to interpolate color based on percentage
  const getMeterColor = (percent: number): string => {
    for (let i = 0; i < colorStops.length - 1; i++) {
      const currentStop = colorStops[i];
      const nextStop = colorStops[i + 1];

      if (percent <= nextStop.stop) {
        const progress = (percent - currentStop.stop) / (nextStop.stop - currentStop.stop);

        const r = Math.round(parseInt(currentStop.color.substring(1, 3), 16) * (1 - progress) +
                  parseInt(nextStop.color.substring(1, 3), 16) * progress);
        const g = Math.round(parseInt(currentStop.color.substring(3, 5), 16) * (1 - progress) +
                  parseInt(nextStop.color.substring(3, 5), 16) * progress);
        const b = Math.round(parseInt(currentStop.color.substring(5, 7), 16) * (1 - progress) +
                  parseInt(nextStop.color.substring(5, 7), 16) * progress);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      }
    }
    return colorStops[colorStops.length - 1].color; // Return last color if percentage exceeds
  };

  const meterColor = getMeterColor(percentage);

  return (
    <div style={{ width: '150px', margin: '0 auto', textAlign: 'center' }}>
      <CircularProgressbar
        value={percentage}
        text={`${normalizedIndex}`}
        styles={buildStyles({
          textColor: '#000',
          textSize: '16px',
          pathColor: meterColor,
          trailColor: '#eee',
        })}
      />
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
        {meterLabel}
      </div>
    </div>
  );
};

export default DisruptionIndexMeter;
