import React, { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  LineData,
  DeepPartial,
  ChartOptions,
  AreaSeriesPartialOptions,
} from 'lightweight-charts';

/**
 * Defines the structure for a single data point in the financial chart.
 * 'time' should be a UNIX timestamp in UTC.
 * 'value' is the numerical value for that point in time.
 */
export type FinancialDataPoint = LineData<UTCTimestamp>;

/**
 * Props for the FinancialLineChart component.
 */
export interface FinancialLineChartProps {
  /** The array of data points for the chart. */
  data: FinancialDataPoint[];
  /** Optional custom colors for theming the chart. */
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    topColor?: string;
    bottomColor?: string;
    textColor?: string;
    gridColor?: string;
  };
  /** Advanced chart options to override defaults. See Lightweight Charts documentation. */
  chartOptions?: DeepPartial<ChartOptions>;
  /** Advanced series options to override defaults. See Lightweight Charts documentation. */
  seriesOptions?: DeepPartial<AreaSeriesPartialOptions>;
  /** Style for the container div. Defaults to 100% width/height. */
  containerStyle?: React.CSSProperties;
}

// Default colors for a modern, dark-themed trading chart.
const defaultColors = {
  backgroundColor: '#0A0E19',
  lineColor: '#2196F3',
  topColor: 'rgba(33, 150, 243, 0.2)',
  bottomColor: 'rgba(33, 150, 243, 0)',
  textColor: 'rgba(255, 255, 255, 0.85)',
  gridColor: 'rgba(255, 255, 255, 0.05)',
};

/**
 * A real-time, high-performance financial line chart component optimized for rendering
 * large datasets using the Lightweight Charts library. It is designed to look and feel
 * like a professional trading platform chart.
 */
const FinancialLineChart: React.FC<FinancialLineChartProps> = ({
  data,
  colors = {},
  chartOptions = {},
  seriesOptions = {},
  containerStyle = { position: 'relative', width: '100%', height: '100%' },
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // Using a ref to hold the chart and series instances to avoid re-creations.
  const chartRef = useRef<{ chart: IChartApi; series: ISeriesApi<'Area'> } | null>(null);

  const finalColors = { ...defaultColors, ...colors };

  // Effect for creating, configuring, and cleaning up the chart instance.
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      // Defaults for a "trading style" chart
      layout: {
        background: { color: finalColors.backgroundColor },
        textColor: finalColors.textColor,
        fontSize: 12,
      },
      grid: {
        vertLines: { color: finalColors.gridColor },
        horzLines: { color: finalColors.gridColor },
      },
      crosshair: {
        mode: 1, // Magnet mode for better UX
      },
      rightPriceScale: {
        borderColor: finalColors.gridColor,
      },
      timeScale: {
        borderColor: finalColors.gridColor,
        timeVisible: true,
        secondsVisible: false, // Common for most financial charts
      },
      // autoSize makes the chart responsive to container size changes.
      autoSize: true,
      // Merge with any user-provided overrides
      ...chartOptions,
    });

    const series = chart.addAreaSeries({
      lineColor: finalColors.lineColor,
      topColor: finalColors.topColor,
      bottomColor: finalColors.bottomColor,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
      // Merge with any user-provided overrides
      ...seriesOptions,
    });

    chartRef.current = { chart, series };

    // Cleanup function to remove the chart on component unmount.
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [
    // Re-create the chart only if the core theme/options change.
    // JSON.stringify is a pragmatic way to deep-compare these simple option objects.
    JSON.stringify(finalColors),
    JSON.stringify(chartOptions),
    JSON.stringify(seriesOptions),
  ]);

  // Effect for updating the chart's data.
  useEffect(() => {
    if (chartRef.current && data) {
      // `setData` is highly optimized to handle large datasets and diffs.
      // For streaming real-time data, you could use `series.update(newDataPoint)`.
      // This implementation handles both initial loads and full data refreshes efficiently.
      chartRef.current.series.setData(data);
    }
  }, [data]);

  return <div ref={chartContainerRef} style={containerStyle} />;
};

export default FinancialLineChart;