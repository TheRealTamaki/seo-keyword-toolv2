import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  noData?: boolean;
  height?: number | string;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  children,
  title,
  subtitle,
  loading = false,
  error = null,
  noData = false,
  height = 300,
  className = '',
}) => {
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
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
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
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
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
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
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
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartContainer;
