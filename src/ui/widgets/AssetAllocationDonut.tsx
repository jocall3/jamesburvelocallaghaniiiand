import React, { useMemo } from 'react';
import { ResponsivePie, PieDatum, PieCustomLayerProps } from '@nivo/pie';

// Define the shape of the data points for asset allocation
export interface AssetAllocationData extends PieDatum {
  id: string;
  label: string;
  value: number;
  color?: string;
}

// Define the props for the component
export interface AssetAllocationDonutProps {
  /**
   * Array of asset data objects to display in the chart.
   */
  data: AssetAllocationData[];
  /**
   * The ISO 4217 currency code to use for formatting values (e.g., 'USD', 'EUR').
   * @default 'USD'
   */
  currencyCode?: string;
  /**
   * The locale to use for number and currency formatting.
   * @default 'en-US'
   */
  locale?: string;
}

const formatCurrency = (
  value: number,
  currency: string,
  locale: string
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const CenteredMetric = ({
  dataWithArc,
  centerX,
  centerY,
  currencyCode,
  locale,
}: PieCustomLayerProps<AssetAllocationData> & { currencyCode: string; locale: string }) => {
  const total = useMemo(
    () => dataWithArc.reduce((sum, datum) => sum + datum.value, 0),
    [dataWithArc]
  );

  const formattedTotal = formatCurrency(total, currencyCode, locale);

  return (
    <>
      <text
        x={centerX}
        y={centerY - 10}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '16px',
          fontWeight: 500,
          fill: '#666',
        }}
      >
        Total Value
      </text>
      <text
        x={centerX}
        y={centerY + 15}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fill: '#333',
        }}
      >
        {formattedTotal}
      </text>
    </>
  );
};

const CustomTooltip = ({ datum, currencyCode, locale }: { datum: PieDatum, currencyCode: string, locale: string }) => {
  const { id, label, value, color, formattedValue } = datum;
  
  const formattedCurrencyValue = formatCurrency(value as number, currencyCode, locale);

  return (
    <div
      style={{
        background: 'white',
        padding: '12px 16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ width: '12px', height: '12px', backgroundColor: color, marginRight: '8px', borderRadius: '50%' }} />
        <strong>{label || id}</strong>
      </div>
      <div>Value: {formattedCurrencyValue}</div>
      <div>Percent: {formattedValue}%</div>
    </div>
  );
};

export const AssetAllocationDonut: React.FC<AssetAllocationDonutProps> = ({
  data,
  currencyCode = 'USD',
  locale = 'en-US',
}) => {
  if (!data || data.length === 0) {
    return <div style={{ height: 400, display: 'grid', placeItems: 'center' }}>No allocation data available.</div>;
  }

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <ResponsivePie
        data={data}
        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
        innerRadius={0.6}
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={8}
        colors={{ scheme: 'category10' }}
        borderWidth={1}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        enableArcLinkLabels={false}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        enableArcLabels={false}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        valueFormat={(value) => `${formatCurrency(value, currencyCode, locale)}`}
        tooltip={({ datum }) => <CustomTooltip datum={datum} currencyCode={currencyCode} locale={locale} />}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 4,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#555',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 14,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
        layers={[
          'arcs',
          'arcLabels',
          'arcLinkLabels',
          'legends',
          (props) => (
            <CenteredMetric {...props} currencyCode={currencyCode} locale={locale} />
          ),
        ]}
      />
    </div>
  );
};

export default AssetAllocationDonut;