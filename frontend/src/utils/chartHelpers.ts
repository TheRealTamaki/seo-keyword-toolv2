/**
 * Chart Helper Functions
 * Utility functions for data manipulation and chart configuration
 */

import { format, parse, isValid, parseISO } from 'date-fns';

/**
 * Format date for chart display
 */
export const formatChartDate = (
  date: string | Date,
  formatString: string = 'MMM dd'
): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date range for chart titles
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  try {
    if (!isValid(startDate) || !isValid(endDate)) return '';
    return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '';
  }
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  current: number,
  previous: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Fill missing dates in time series data
 */
export const fillMissingDates = <T extends { date: string }>(
  data: T[],
  fillValue: Partial<T> = {}
): T[] => {
  if (data.length === 0) return data;

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filled: T[] = [];
  const startDate = new Date(sorted[0].date);
  const endDate = new Date(sorted[sorted.length - 1].date);

  let currentDate = new Date(startDate);
  let dataIndex = 0;

  while (currentDate <= endDate) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const existing = sorted.find((item) => item.date === dateStr);

    if (existing) {
      filled.push(existing);
      dataIndex++;
    } else {
      filled.push({
        ...fillValue,
        date: dateStr,
      } as T);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filled;
};

/**
 * Aggregate data by time period (day, week, month)
 */
export const aggregateByPeriod = <T extends { date: string; value: number }>(
  data: T[],
  period: 'day' | 'week' | 'month' = 'day'
): T[] => {
  if (data.length === 0) return data;

  const formatMap = {
    day: 'yyyy-MM-dd',
    week: 'yyyy-ww',
    month: 'yyyy-MM',
  };

  const grouped = data.reduce((acc, item) => {
    const date = parseISO(item.date);
    const key = format(date, formatMap[period]);

    if (!acc[key]) {
      acc[key] = { ...item, count: 1 };
    } else {
      acc[key].value += item.value;
      acc[key].count++;
    }

    return acc;
  }, {} as Record<string, T & { count: number }>);

  return Object.values(grouped).map((item) => {
    const { count, ...rest } = item;
    return rest as unknown as T;
  });
};

/**
 * Calculate moving average for smoothing data
 */
export const calculateMovingAverage = <T extends { value: number }>(
  data: T[],
  window: number = 7
): T[] => {
  if (data.length < window) return data;

  return data.map((item, index) => {
    if (index < window - 1) return item;

    const sum = data
      .slice(index - window + 1, index + 1)
      .reduce((acc, curr) => acc + curr.value, 0);

    return {
      ...item,
      value: sum / window,
    };
  });
};

/**
 * Find min and max values in dataset
 */
export const findDataRange = (
  data: any[],
  key: string
): { min: number; max: number } => {
  if (data.length === 0) return { min: 0, max: 100 };

  const values = data.map((item) => item[key]).filter((v) => typeof v === 'number');

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

/**
 * Calculate chart domain with padding
 */
export const calculateDomain = (
  data: any[],
  key: string,
  padding: number = 0.1
): [number, number] => {
  const { min, max } = findDataRange(data, key);
  const range = max - min;
  const paddingValue = range * padding;

  return [Math.max(0, min - paddingValue), max + paddingValue];
};

/**
 * Generate ticks for axis
 */
export const generateTicks = (
  min: number,
  max: number,
  count: number = 5
): number[] => {
  const range = max - min;
  const step = range / (count - 1);
  return Array.from({ length: count }, (_, i) => min + step * i);
};

/**
 * Format large numbers with suffixes (K, M, B)
 */
export const formatLargeNumber = (value: number, decimals: number = 1): string => {
  const absValue = Math.abs(value);

  if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(decimals)}B`;
  }
  if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(decimals)}M`;
  }
  if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(decimals)}K`;
  }

  return value.toFixed(decimals);
};

/**
 * Calculate trend direction (up, down, stable)
 */
export const calculateTrend = (
  data: number[]
): 'up' | 'down' | 'stable' => {
  if (data.length < 2) return 'stable';

  const first = data[0];
  const last = data[data.length - 1];
  const change = ((last - first) / first) * 100;

  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

/**
 * Group data for stacked charts
 */
export const groupStackedData = <T extends Record<string, any>>(
  data: T[],
  groupKey: string,
  valueKeys: string[]
): T[] => {
  return data.map((item) => {
    const grouped: any = { [groupKey]: item[groupKey] };

    valueKeys.forEach((key) => {
      grouped[key] = item[key] || 0;
    });

    return grouped as T;
  });
};

/**
 * Calculate percentage distribution for pie charts
 */
export const calculatePercentages = <T extends { value: number }>(
  data: T[]
): (T & { percentage: number })[] => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return data.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
  }));
};

/**
 * Sort data for better visualization
 */
export const sortChartData = <T extends Record<string, any>>(
  data: T[],
  key: string,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
};

/**
 * Limit data points for performance
 */
export const limitDataPoints = <T>(
  data: T[],
  maxPoints: number
): T[] => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
};

export default {
  formatChartDate,
  formatDateRange,
  calculatePercentageChange,
  fillMissingDates,
  aggregateByPeriod,
  calculateMovingAverage,
  findDataRange,
  calculateDomain,
  generateTicks,
  formatLargeNumber,
  calculateTrend,
  groupStackedData,
  calculatePercentages,
  sortChartData,
  limitDataPoints,
};
