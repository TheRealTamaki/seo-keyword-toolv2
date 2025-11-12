import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface RankingChartProps {
  data: Array<{
    position: number;
    checkedAt: string;
  }>;
}

const RankingChart: React.FC<RankingChartProps> = ({ data }) => {
  // Transform data for the chart
  const chartData = data.map((item) => ({
    ...item,
    date: format(new Date(item.checkedAt), 'MMM d'),
    formattedDate: format(new Date(item.checkedAt), 'MMM d, yyyy'),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Position #{payload[0].value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{payload[0].payload.formattedDate}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate min and max positions for better Y-axis scaling
  const positions = data.map((d) => d.position);
  const minPosition = Math.min(...positions);
  const maxPosition = Math.max(...positions);
  const yAxisPadding = 5;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Ranking History</h3>
          <p className="text-sm text-gray-500 mt-1">Track position changes over time</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full mr-1"></div>
            <span>Position</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              reversed
              domain={[
                Math.max(1, minPosition - yAxisPadding),
                Math.min(100, maxPosition + yAxisPadding),
              ]}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6b7280' }}
              label={{
                value: 'Position',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: '#6b7280' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Reference lines for top 3 and top 10 */}
            <ReferenceLine
              y={3}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{
                value: 'Top 3',
                position: 'right',
                style: { fontSize: '10px', fill: '#10b981' },
              }}
            />
            <ReferenceLine
              y={10}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                value: 'Top 10',
                position: 'right',
                style: { fontSize: '10px', fill: '#f59e0b' },
              }}
            />

            <Line
              type="monotone"
              dataKey="position"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ fill: '#4f46e5', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-green-500 mr-2"></div>
          <span>Top 3 (positions 1-3)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-yellow-500 mr-2"></div>
          <span>Top 10 (positions 1-10)</span>
        </div>
      </div>
    </div>
  );
};

export default RankingChart;
