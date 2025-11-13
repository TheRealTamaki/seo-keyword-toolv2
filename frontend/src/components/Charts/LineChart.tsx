import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';
import { chartTheme, getSeriesColor } from './chartTheme';
import ChartContainer from './ChartContainer';

export interface LineChartData {
  [key: string]: any;
}

export interface LineChartSeries {
  dataKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  dot?: boolean;
  strokeDasharray?: string;
}

interface LineChartProps {
  data: LineChartData[];
  series: LineChartSeries[];
  xAxisKey: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
  curved?: boolean;
}

const CustomTooltip: React.FC<
  TooltipProps<number, string> & { formatter?: (value: any, name: string) => [string, string] }
> = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

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
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => {
        const [value, name] = formatter
          ? formatter(entry.value, entry.name || '')
          : [entry.value, entry.name];
        return (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-gray-600">{name}:</span>
            <span className="font-medium text-gray-900">{value}</span>
          </div>
        );
      })}
    </div>
  );
};

const LineChart: React.FC<LineChartProps> = ({
  data,
  series,
  xAxisKey,
  title,
  subtitle,
  loading = false,
  error = null,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  xAxisLabel,
  yAxisLabel,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className = '',
  curved = true,
}) => {
  const noData = !data || data.length === 0;

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      noData={noData}
      height={height}
      className={className}
    >
      <RechartsLineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            stroke={chartTheme.grid.stroke}
            strokeDasharray={chartTheme.grid.strokeDasharray}
          />
        )}

        <XAxis
          dataKey={xAxisKey}
          stroke={chartTheme.axis.stroke}
          tick={{ fontSize: chartTheme.axis.fontSize }}
          tickFormatter={xAxisFormatter}
          label={
            xAxisLabel
              ? {
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: chartTheme.fontSize.sm },
                }
              : undefined
          }
        />

        <YAxis
          stroke={chartTheme.axis.stroke}
          tick={{ fontSize: chartTheme.axis.fontSize }}
          tickFormatter={yAxisFormatter}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: chartTheme.fontSize.sm },
                }
              : undefined
          }
        />

        {showTooltip && (
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        )}

        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: chartTheme.legend.fontSize }}
            iconType={chartTheme.legend.iconType}
            iconSize={chartTheme.legend.iconSize}
          />
        )}

        {series.map((s, index) => (
          <Line
            key={s.dataKey}
            type={curved ? 'monotone' : 'linear'}
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color || getSeriesColor(index)}
            strokeWidth={s.strokeWidth || 2}
            dot={s.dot !== undefined ? s.dot : true}
            strokeDasharray={s.strokeDasharray}
            activeDot={{ r: 6 }}
            animationDuration={chartTheme.animation.duration}
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
};

export default LineChart;
