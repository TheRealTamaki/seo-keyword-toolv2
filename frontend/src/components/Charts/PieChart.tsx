import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  TooltipProps,
  ResponsiveContainer,
} from 'recharts';
import { chartTheme, getSeriesColor } from './chartTheme';

export interface PieChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
  centerLabel?: {
    value: string | number;
    label: string;
  };
}

const CustomTooltip: React.FC<
  TooltipProps<number, string> & {
    formatter?: (value: number) => string;
    showPercentage?: boolean;
  }
> = ({ active, payload, formatter, showPercentage }) => {
  if (!active || !payload || !payload.length) return null;

  const entry = payload[0];
  const value = entry.value as number;
  const percentage = entry.payload.percentage || 0;

  return (
    <div
      style={{
        backgroundColor: chartTheme.tooltip.backgroundColor,
        border: chartTheme.tooltip.border,
        borderRadius: chartTheme.tooltip.borderRadius,
        boxShadow: chartTheme.tooltip.boxShadow,
        padding: chartTheme.tooltip.padding,
        fontSize: chartTheme.tooltip.fontSize,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.payload.fill }}
        ></div>
        <span className="font-medium text-gray-900">{entry.name}</span>
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">
          {formatter ? formatter(value) : value}
        </span>
        {showPercentage && (
          <span className="ml-2 text-gray-500">
            ({percentage.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
};

const renderLabel = (entry: any, showPercentage: boolean, formatter?: (value: number) => string) => {
  if (showPercentage) {
    return `${entry.percentage.toFixed(1)}%`;
  }
  return formatter ? formatter(entry.value) : entry.value;
};

const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  loading = false,
  error = null,
  height = 300,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  showPercentage = true,
  valueFormatter,
  className = '',
  innerRadius = 0,
  outerRadius,
  colors,
  centerLabel,
}) => {
  const noData = !data || data.length === 0;

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentages = data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));

  // Determine colors
  const getColor = (index: number) => {
    if (colors && colors[index]) return colors[index];
    return getSeriesColor(index);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            )}
            {subtitle && (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
        )}
        <div
          className="bg-gray-50 rounded animate-pulse"
          style={{ height: `${height}px` }}
        ></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        )}
        <div
          className="flex items-center justify-center bg-red-50 rounded border border-red-200"
          style={{ height: `${height}px` }}
        >
          <div className="text-center p-4">
            <p className="text-sm text-red-600 font-medium">Failed to load chart</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (noData) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        )}
        <div
          className="flex items-center justify-center bg-gray-50 rounded"
          style={{ height: `${height}px` }}
        >
          <div className="text-center p-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 font-medium">No data available</p>
            <p className="text-xs text-gray-400 mt-1">Add data to see the chart</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal state with chart
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithPercentages}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius || (height * 0.35)}
            fill="#8884d8"
            dataKey="value"
            label={showLabels ? (entry) => renderLabel(entry, showPercentage, valueFormatter) : false}
            labelLine={showLabels}
            animationDuration={chartTheme.animation.duration}
          >
            {dataWithPercentages.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(index)} />
            ))}
          </Pie>

          {showTooltip && (
            <Tooltip
              content={
                <CustomTooltip
                  formatter={valueFormatter}
                  showPercentage={showPercentage}
                />
              }
            />
          )}

          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: chartTheme.legend.fontSize }}
              iconType={chartTheme.legend.iconType}
              iconSize={chartTheme.legend.iconSize}
            />
          )}

          {/* Center label for donut charts */}
          {centerLabel && innerRadius > 0 && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              <tspan
                x="50%"
                dy="-0.5em"
                fontSize={chartTheme.fontSize.xl}
                fontWeight="600"
                fill={chartTheme.colors.gray[900]}
              >
                {centerLabel.value}
              </tspan>
              <tspan
                x="50%"
                dy="1.5em"
                fontSize={chartTheme.fontSize.sm}
                fill={chartTheme.colors.gray[600]}
              >
                {centerLabel.label}
              </tspan>
            </text>
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
