import React from 'react';
import PieChart from '../Charts/PieChart';
import { getRankColor } from '../Charts/chartTheme';

interface RankDistributionChartProps {
  data: Array<{
    position: number;
    checkedAt: string;
  }>;
}

const RankDistributionChart: React.FC<RankDistributionChartProps> = ({ data }) => {
  // Calculate distribution across rank tiers
  const distribution = {
    top3: 0,
    top10: 0,
    top20: 0,
    below20: 0,
  };

  data.forEach((item) => {
    if (item.position <= 3) {
      distribution.top3++;
    } else if (item.position <= 10) {
      distribution.top10++;
    } else if (item.position <= 20) {
      distribution.top20++;
    } else {
      distribution.below20++;
    }
  });

  // Transform to chart data
  const chartData = [
    {
      name: 'Top 3',
      value: distribution.top3,
    },
    {
      name: 'Top 10',
      value: distribution.top10,
    },
    {
      name: 'Top 20',
      value: distribution.top20,
    },
    {
      name: 'Below 20',
      value: distribution.below20,
    },
  ].filter((item) => item.value > 0); // Only show tiers with data

  // Custom colors matching rank tiers
  const colors = [
    getRankColor(1),   // Top 3 - green
    getRankColor(5),   // Top 10 - blue
    getRankColor(15),  // Top 20 - amber
    getRankColor(50),  // Below 20 - gray
  ];

  const valueFormatter = (value: number) => `${value} checks`;

  return (
    <PieChart
      data={chartData}
      title="Position Distribution"
      subtitle="Distribution of rankings across position tiers"
      height={300}
      showLegend={true}
      showLabels={false}
      showPercentage={true}
      colors={colors}
      valueFormatter={valueFormatter}
      innerRadius={60}
      centerLabel={{
        value: data.length.toString(),
        label: 'Total Checks',
      }}
    />
  );
};

export default RankDistributionChart;
