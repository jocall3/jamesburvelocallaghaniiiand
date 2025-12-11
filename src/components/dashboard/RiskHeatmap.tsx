```tsx
import React from 'react';
import { Chart, Geom, Tooltip, Axis, View } from 'bizcharts';
import { RiskIntensityData } from '@/types'; // Assuming RiskIntensityData is defined in your types

interface RiskHeatmapProps {
  data: RiskIntensityData[];
}

const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ data }) => {
  const cols = {
    domain: {
      type: 'cat',
      alias: 'Operational Domain',
    },
    intensity: {
      type: 'linear',
      alias: 'Risk Intensity',
      min: 0,
      max: 10,
      tickInterval: 1,
    },
  };

  return (
    <div className="rounded-lg shadow-lg p-6 bg-white dark:bg-gray-800 h-full flex items-center justify-center">
      {data && data.length > 0 ? (
        <Chart
          scale={cols}
          height={300}
          autoFit
          data={data}
          interactions={['hover', 'tooltip']}
        >
          <Tooltip shared={false} />
          <View data={data}>
            <Geom
              type="heatmap"
              position="domain*intensity"
              color="intensity"
              shape="heatmap"
              style={{
                radius: 4,
              }}
              label="intensity"
            />
          </View>
          <Axis name="domain" label={{ autoRotate: true, formatter: (text) => text.replace(/_/g, ' ') }} />
          <Axis name="intensity" grid={{ align: 'center', line: { style: { stroke: '#ffffff', lineWidth: 1, strokeOpacity: 0.2 }}}}/>
        </Chart>
      ) : (
        <div className="text-gray-500 dark:text-gray-400">No risk data available.</div>
      )}
    </div>
  );
};

export default RiskHeatmap;
```