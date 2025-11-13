import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps,
  Cell,
} from 'recharts';
import { chartTheme, getSeriesColor } from './chartTheme';
import ChartContainer from './ChartContainer';

export interface BarChartData {
  [key: string]: any;
}

export interface BarChartSeries {
  dataKey: string;
  name: string;
  color?: string;
  radius?: number | [number, number, number, number];
}

interface BarChartProps {
  data: BarChartData[];
  series: BarChartSeries[];
  xAxisKey: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
  barSize?: number;
  colorByValue?: boolean;
  colorScale?: (value: number) => string;
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
              className="w-3 h-3 rounded"
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

const BarChart: React.FC<BarChartProps> = ({
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
  stacked = false,
  horizontal = false,
  xAxisLabel,
  yAxisLabel,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className = '',
  barSize,
  colorByValue = false,
  colorScale,
}) => {
  const noData = !data || data.length === 0;

  const renderBar = (s: BarChartSeries, index: number) => {
    const barColor = s.color || getSeriesColor(index);

    if (colorByValue && colorScale && series.length === 1) {
      return (
        <Bar
          key={s.dataKey}
          dataKey={s.dataKey}
          name={s.name}
          fill={barColor}
          radius={s.radius || [4, 4, 0, 0]}
          maxBarSize={barSize || 60}
          stackId={stacked ? '1' : undefined}
          animationDuration={chartTheme.animation.duration}
        >
          {data.map((entry, idx) => (
            <Cell
              key={`cell-${idx}`}
              fill={colorScale(entry[s.dataKey])}
            />
          ))}
        </Bar>
      );
    }

    return (
      <Bar
        key={s.dataKey}
        dataKey={s.dataKey}
        name={s.name}
        fill={barColor}
        radius={s.radius || [4, 4, 0, 0]}
        maxBarSize={barSize || 60}
        stackId={stacked ? '1' : undefined}
        animationDuration={chartTheme.animation.duration}
      />
    );
  };

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
      <RechartsBarChart
        data={data}
        layout={horizontal ? 'horizontal' : 'vertical'}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid
            stroke={chartTheme.grid.stroke}
            strokeDasharray={chartTheme.grid.strokeDasharray}
          />
        )}

        {horizontal ? (
          <>
            <XAxis
              type="number"
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
              type="category"
              dataKey={xAxisKey}
              stroke={chartTheme.axis.stroke}
              tick={{ fontSize: chartTheme.axis.fontSize }}
              tickFormatter={yAxisFormatter}
              width={100}
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
          </>
        ) : (
          <>
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
          </>
        )}

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

        {series.map((s, index) => renderBar(s, index))}
      </RechartsBarChart>
    </ChartContainer>
  );
};

export default BarChart;
