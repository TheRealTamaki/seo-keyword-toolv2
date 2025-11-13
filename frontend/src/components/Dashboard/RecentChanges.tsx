import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { ClockIcon } from '@heroicons/react/24/outline';

interface RankingChange {
  keywordId: string;
  keyword: string;
  projectName: string;
  projectId: string;
  previousRank: number;
  currentRank: number;
  change: number;
  checkedAt: string;
}

interface RecentChangesProps {
  changes: RankingChange[];
  loading?: boolean;
}

const RecentChanges: React.FC<RecentChangesProps> = ({ changes, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Ranking Changes</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (changes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Ranking Changes</h2>
        <div className="text-center py-8">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No recent ranking changes</p>
          <p className="text-xs text-gray-400 mt-1">Start tracking keywords to see ranking updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Ranking Changes</h2>
        <Link to="/rankings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {changes.map((change) => {
          const isImprovement = change.change < 0; // Lower rank number = better
          const isDecline = change.change > 0;

          return (
            <Link
              key={`${change.keywordId}-${change.checkedAt}`}
              to={`/keywords?project=${change.projectId}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    isImprovement
                      ? 'bg-green-100'
                      : isDecline
                      ? 'bg-red-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {isImprovement ? (
                    <ArrowUpIcon className="h-5 w-5 text-green-600" />
                  ) : isDecline ? (
                    <ArrowDownIcon className="h-5 w-5 text-red-600" />
                  ) : (
                    <MinusIcon className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{change.keyword}</p>
                  <p className="text-xs text-gray-500 truncate">{change.projectName}</p>
                </div>
              </div>

              <div className="ml-4 flex-shrink-0 text-right">
                <div className="flex items-center space-x-2">
                  <div className="text-sm">
                    <span className="text-gray-400">#{change.previousRank}</span>
                    <span className="mx-1 text-gray-400">→</span>
                    <span className="font-semibold text-gray-900">#{change.currentRank}</span>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isImprovement
                        ? 'bg-green-100 text-green-800'
                        : isDecline
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {change.change > 0 ? '+' : ''}
                    {change.change}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(change.checkedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecentChanges;
