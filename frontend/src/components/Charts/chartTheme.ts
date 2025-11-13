/**
 * Chart Theme Configuration
 * Central configuration for all chart styling and colors
 */

export const chartTheme = {
  // Primary color palette matching app theme
  colors: {
    primary: '#6366f1', // indigo-600
    secondary: '#8b5cf6', // violet-600
    success: '#10b981', // green-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    info: '#3b82f6', // blue-500

    // Chart-specific colors for multi-series data
    series: [
      '#6366f1', // indigo-600
      '#8b5cf6', // violet-600
      '#ec4899', // pink-500
      '#f59e0b', // amber-500
      '#10b981', // green-500
      '#3b82f6', // blue-500
      '#6366f1', // cyan-500
      '#f97316', // orange-500
    ],

    // Neutral colors
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // Font configuration
  fonts: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 11,
    base: 12,
    lg: 14,
    xl: 16,
  },

  // Grid and axis styling
  grid: {
    stroke: '#e5e7eb', // gray-200
    strokeDasharray: '3 3',
    strokeWidth: 1,
  },

  axis: {
    stroke: '#9ca3af', // gray-400
    fontSize: 11,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Tooltip styling
  tooltip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '12px',
    fontSize: 12,
  },

  // Legend styling
  legend: {
    fontSize: 11,
    iconSize: 12,
    iconType: 'circle' as const,
  },

  // Animation configuration
  animation: {
    duration: 800,
    easing: 'ease-in-out' as const,
  },

  // Responsive breakpoints
  responsive: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
  },
};

/**
 * Get a color from the series palette by index
 */
export const getSeriesColor = (index: number): string => {
  return chartTheme.colors.series[index % chartTheme.colors.series.length];
};

/**
 * Get gradient ID for a specific color
 */
export const getGradientId = (color: string): string => {
  return `gradient-${color.replace('#', '')}`;
};

/**
 * Format numbers for display in charts
 */
export const formatChartNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Format currency for display
 */
export const formatChartCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Format percentage for display
 */
export const formatChartPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Get color based on rank position (for SEO rankings)
 */
export const getRankColor = (rank: number): string => {
  if (rank <= 3) return chartTheme.colors.success; // Green for top 3
  if (rank <= 10) return chartTheme.colors.info; // Blue for top 10
  if (rank <= 20) return chartTheme.colors.warning; // Amber for top 20
  return chartTheme.colors.gray[400]; // Gray for beyond top 20
};

/**
 * Get color based on change value (positive/negative)
 */
export const getChangeColor = (change: number): string => {
  if (change > 0) return chartTheme.colors.success; // Green for improvement
  if (change < 0) return chartTheme.colors.danger; // Red for decline
  return chartTheme.colors.gray[500]; // Gray for no change
};

export default chartTheme;
