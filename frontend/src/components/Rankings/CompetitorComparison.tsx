import React, { useState } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import BarChart from '../Charts/BarChart';
import { getRankColor } from '../Charts/chartTheme';

interface Competitor {
  domain: string;
  position: number;
  url: string;
  previousPosition?: number;
}

interface CompetitorComparisonProps {
  competitors: Competitor[];
}

const CompetitorComparison: React.FC<CompetitorComparisonProps> = ({ competitors }) => {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  const getPositionChange = (current: number, previous?: number) => {
    if (!previous) return null;

    const change = previous - current; // Positive means improvement (moved up)

    if (change > 0) {
      return (
        <span className="inline-flex items-center text-green-600 text-xs">
          <ArrowUpIcon className="h-3 w-3 mr-0.5" />
          {change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center text-red-600 text-xs">
          <ArrowDownIcon className="h-3 w-3 mr-0.5" />
          {Math.abs(change)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-gray-500 text-xs">
        <MinusIcon className="h-3 w-3 mr-0.5" />
        0
      </span>
    );
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600 font-semibold';
    if (position <= 10) return 'text-yellow-600 font-medium';
    return 'text-gray-600';
  };

  // Prepare data for bar chart
  const chartData = competitors
    .sort((a, b) => a.position - b.position) // Sort by position
    .map((competitor) => ({
      domain: competitor.domain.length > 20
        ? competitor.domain.substring(0, 20) + '...'
        : competitor.domain,
      fullDomain: competitor.domain,
      position: competitor.position,
    }));

  // Color function based on position
  const colorScale = (position: number) => getRankColor(position);

  const tooltipFormatter = (value: any, name: string): [string, string] => {
    return [`Position #${value}`, 'Ranking'];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Competitor Rankings</h3>
          <p className="text-sm text-gray-500 mt-1">See how competitors rank for this keyword</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ListBulletIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'chart'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChartBarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {competitors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No competitor data available</p>
        </div>
      ) : viewMode === 'list' ? (
        <>
          <div className="space-y-3">
            {competitors
              .sort((a, b) => a.position - b.position)
              .map((competitor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-lg font-semibold ${getPositionColor(competitor.position)}`}>
                        #{competitor.position}
                      </span>
                      {getPositionChange(competitor.position, competitor.previousPosition)}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mt-1">
                      {competitor.domain}
                    </p>
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:text-primary-700 truncate block mt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {competitor.url}
                    </a>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full mr-1.5"></div>
                  <span>Top 3</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full mr-1.5"></div>
                  <span>Top 10</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-600 rounded-full mr-1.5"></div>
                  <span>Other</span>
                </div>
              </div>
              <span>{competitors.length} competitors</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-2">
          <BarChart
            data={chartData}
            series={[
              {
                dataKey: 'position',
                name: 'Position',
              },
            ]}
            xAxisKey="domain"
            height={400}
            horizontal={true}
            showGrid={true}
            showLegend={false}
            colorByValue={true}
            colorScale={colorScale}
            tooltipFormatter={tooltipFormatter}
            yAxisLabel="Position"
          />
        </div>
      )}
    </div>
  );
};

export default CompetitorComparison;
