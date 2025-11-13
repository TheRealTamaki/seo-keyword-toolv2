import React from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Insight {
  type: 'improvement' | 'decline' | 'opportunity' | 'achievement';
  title: string;
  description: string;
  value?: string;
}

interface QuickInsightsProps {
  insights: Insight[];
  loading?: boolean;
}

const QuickInsights: React.FC<QuickInsightsProps> = ({ insights, loading = false }) => {
  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'improvement':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />;
      case 'decline':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />;
      case 'opportunity':
        return <LightBulbIcon className="h-5 w-5 text-yellow-600" />;
      case 'achievement':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'improvement':
        return 'bg-green-50 border-green-200';
      case 'decline':
        return 'bg-red-50 border-red-200';
      case 'opportunity':
        return 'bg-yellow-50 border-yellow-200';
      case 'achievement':
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type: Insight['type']) => {
    switch (type) {
      case 'improvement':
        return 'text-green-900';
      case 'decline':
        return 'text-red-900';
      case 'opportunity':
        return 'text-yellow-900';
      case 'achievement':
        return 'text-blue-900';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No insights yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Insights will appear as you track keywords and monitor rankings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
        <span className="text-xs text-gray-500">{insights.length} insights</span>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">{getIcon(insight.type)}</div>
              <div className="ml-3 flex-1 min-w-0">
                <p className={`text-sm font-medium ${getTextColor(insight.type)}`}>
                  {insight.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                {insight.value && (
                  <p className={`text-sm font-semibold mt-1 ${getTextColor(insight.type)}`}>
                    {insight.value}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickInsights;
