import React from 'react';
import BarChart from '../Charts/BarChart';
import { getRankColor } from '../Charts/chartTheme';

interface VisibilityData {
  domain: string;
  visibilityScore: number;
  totalKeywords: number;
  avgPosition: number;
  top3Count: number;
  top10Count: number;
  estimatedTraffic: number;
}

interface PositionTierComparisonProps {
  data: VisibilityData[];
  projectDomain: string;
}

const PositionTierComparison: React.FC<PositionTierComparisonProps> = ({
  data,
  projectDomain,
}) => {
  // Prepare data for stacked bar chart
  const chartData = data.map((item) => {
    // Calculate top20 count (keywords between position 11-20)
    // Since we don't have exact data, we can estimate or just show what we have
    const top4to10 = item.top10Count - item.top3Count; // Keywords in positions 4-10
    const beyond10 = item.totalKeywords - item.top10Count; // Keywords beyond position 10

    return {
      domain: item.domain.length > 15 ? item.domain.substring(0, 15) + '...' : item.domain,
      fullDomain: item.domain,
      'Top 3': item.top3Count,
      'Top 4-10': top4to10,
      'Beyond 10': beyond10,
      isYours: item.domain === projectDomain,
    };
  });

  // Series configuration with custom colors matching rank tiers
  const series = [
    {
      dataKey: 'Top 3',
      name: 'Top 3',
      color: getRankColor(1), // Green
    },
    {
      dataKey: 'Top 4-10',
      name: 'Top 4-10',
      color: getRankColor(5), // Blue
    },
    {
      dataKey: 'Beyond 10',
      name: 'Beyond 10',
      color: getRankColor(15), // Amber
    },
  ];

  const tooltipFormatter = (value: any, name: string): [string, string] => {
    return [`${value} keywords`, name];
  };

  return (
    <BarChart
      data={chartData}
      series={series}
      xAxisKey="domain"
      title="Position Tier Distribution"
      subtitle="Compare keyword distribution across position tiers"
      height={350}
      showGrid={true}
      showLegend={true}
      stacked={true}
      tooltipFormatter={tooltipFormatter}
      yAxisLabel="Keywords"
    />
  );
};

export default PositionTierComparison;
