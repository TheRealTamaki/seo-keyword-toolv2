/**
 * Charts Components
 * Reusable chart wrappers built on Recharts library
 */

// Chart components
export { default as LineChart } from './LineChart';
export { default as AreaChart } from './AreaChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';
export { default as ChartContainer } from './ChartContainer';

// Types
export type { LineChartData, LineChartSeries } from './LineChart';
export type { AreaChartData, AreaChartSeries } from './AreaChart';
export type { BarChartData, BarChartSeries } from './BarChart';
export type { PieChartData } from './PieChart';

// Theme and utilities
export { chartTheme, getSeriesColor, getGradientId, formatChartNumber, formatChartCurrency, formatChartPercentage, getRankColor, getChangeColor } from './chartTheme';
export { default as chartHelpers, formatChartDate, formatDateRange, calculatePercentageChange, fillMissingDates, aggregateByPeriod, calculateMovingAverage, findDataRange, calculateDomain, generateTicks, formatLargeNumber, calculateTrend, groupStackedData, calculatePercentages, sortChartData, limitDataPoints } from '../../utils/chartHelpers';
