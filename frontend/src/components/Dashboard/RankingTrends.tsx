import React from 'react';
import AreaChart from '../Charts/AreaChart';
import { format } from 'date-fns';

interface TrendData {
  date: string;
  avgPosition: number;
  top3Count?: number;
  top10Count?: number;
}

interface RankingTrendsProps {
  data: TrendData[];
  loading?: boolean;
  timeRange?: '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d') => void;
}

const RankingTrends: React.FC<RankingTrendsProps> = ({
  data,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
}) => {
  // Transform data for chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    'Avg Position': item.avgPosition,
    'Top 3': item.top3Count || 0,
    'Top 10': item.top10Count || 0,
  }));

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ranking Trends</h2>
        {onTimeRangeChange && (
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as any)}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <AreaChart
        data={chartData}
        series={[
          {
            dataKey: 'Top 3',
            name: 'Top 3 Keywords',
            color: '#10b981',
            fillOpacity: 0.6,
          },
          {
            dataKey: 'Top 10',
            name: 'Top 10 Keywords',
            color: '#3b82f6',
            fillOpacity: 0.4,
          },
        ]}
        xAxisKey="date"
        subtitle="Keywords ranking in top positions over time"
        loading={loading}
        height={280}
        showGrid={true}
        showLegend={true}
        stacked={false}
      />
    </div>
  );
};

export default RankingTrends;
