import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { getChangeColor } from '../Charts/chartTheme';

export interface SparklineData {
  value: number;
  date?: string;
}

interface SparklineProps {
  data: SparklineData[];
  color?: string;
  height?: number;
  showTrend?: boolean;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  color,
  height = 40,
  showTrend = true,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Determine trend color based on data
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const trend = lastValue - firstValue;

  // Use provided color or determine from trend
  const lineColor = color || getChangeColor(trend);

  // Find min and max for better Y-axis domain
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 1;

  return (
    <div className={`${className}`} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            hide
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Sparkline;
