import React from 'react';
import { format } from 'date-fns';
import LineChart from '../Charts/LineChart';
import { getRankColor } from '../Charts/chartTheme';

interface RankingChartProps {
  data: Array<{
    position: number;
    checkedAt: string;
  }>;
}

const RankingChart: React.FC<RankingChartProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.checkedAt), 'MMM d'),
    fullDate: format(new Date(item.checkedAt), 'MMM d, yyyy'),
    position: item.position,
  }));

  // Custom formatter for tooltip
  const tooltipFormatter = (value: any, name: string): [string, string] => {
    return [`Position #${value}`, 'Ranking'];
  };

  // Custom formatter for X-axis dates
  const xAxisFormatter = (value: any) => value;

  // Custom formatter for Y-axis positions
  const yAxisFormatter = (value: any) => `#${value}`;

  // Calculate Y-axis domain for better visualization
  const positions = data.map((d) => d.position);
  const minPosition = Math.min(...positions);
  const maxPosition = Math.max(...positions);
  const yAxisPadding = 5;

  // Since lower position is better, we need to reverse the scale
  // But Recharts LineChart doesn't support reversed domains directly in our wrapper
  // So we'll handle this in the wrapper or accept non-reversed

  return (
    <div className="space-y-4">
      <LineChart
        data={chartData}
        series={[
          {
            dataKey: 'position',
            name: 'Position',
            color: '#6366f1', // primary-600
            strokeWidth: 3,
          },
        ]}
        xAxisKey="date"
        title="Ranking History"
        subtitle="Track position changes over time (lower is better)"
        showGrid={true}
        showLegend={false}
        curved={true}
        height={350}
        xAxisFormatter={xAxisFormatter}
        tooltipFormatter={tooltipFormatter}
      />

      {/* Legend explaining rank tiers */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getRankColor(1) }}></div>
            <span>Top 3 (positions 1-3)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getRankColor(5) }}></div>
            <span>Top 10 (positions 4-10)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getRankColor(15) }}></div>
            <span>Top 20 (positions 11-20)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getRankColor(50) }}></div>
            <span>Below 20</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingChart;
