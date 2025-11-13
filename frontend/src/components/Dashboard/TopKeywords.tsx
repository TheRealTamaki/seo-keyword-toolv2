import React from 'react';
import { Link } from 'react-router-dom';
import { ChartBarIcon } from '@heroicons/react/24/outline';

interface KeywordRanking {
  keywordId: string;
  keyword: string;
  projectId: string;
  projectName: string;
  rank: number;
  previousRank?: number;
  url: string;
  searchEngine: string;
}

interface TopKeywordsProps {
  keywords: KeywordRanking[];
  loading?: boolean;
  title?: string;
  type?: 'top' | 'worst';
}

const TopKeywords: React.FC<TopKeywordsProps> = ({
  keywords,
  loading = false,
  title,
  type = 'top',
}) => {
  const displayTitle = title || (type === 'top' ? 'Top Ranking Keywords' : 'Keywords to Improve');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{displayTitle}</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
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

  if (keywords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{displayTitle}</h2>
        <div className="text-center py-8">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No ranking data available</p>
          <p className="text-xs text-gray-400 mt-1">Add keywords and check rankings to see data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{displayTitle}</h2>
        <Link to="/rankings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-2">
        {keywords.map((kw, index) => {
          const rankColor =
            kw.rank <= 3
              ? 'bg-green-100 text-green-800'
              : kw.rank <= 10
              ? 'bg-blue-100 text-blue-800'
              : kw.rank <= 20
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800';

          return (
            <Link
              key={`${kw.keywordId}-${kw.rank}`}
              to={`/keywords?project=${kw.projectId}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center flex-1 min-w-0">
                <span
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded font-semibold text-sm ${rankColor}`}
                >
                  {kw.rank}
                </span>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{kw.keyword}</p>
                  <p className="text-xs text-gray-500 truncate">{kw.projectName}</p>
                </div>
              </div>

              <div className="ml-4 flex-shrink-0 text-right">
                {kw.previousRank !== undefined && kw.previousRank !== kw.rank && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      kw.rank < kw.previousRank
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {kw.rank < kw.previousRank ? '↑' : '↓'}{' '}
                    {Math.abs(kw.rank - kw.previousRank)}
                  </span>
                )}
                <p className="text-xs text-gray-400 mt-1 capitalize">{kw.searchEngine}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TopKeywords;
