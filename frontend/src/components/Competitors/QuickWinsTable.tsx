import React, { useState, useEffect } from 'react';
import {
  TrophyIcon,
  ArrowUpIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { competitorAnalysisService } from '../../services/api';

interface Competitor {
  _id: string;
  domain: string;
}

interface QuickWin {
  keyword: string;
  yourPosition: number;
  competitorPosition: number;
  competitorDomain: string;
  searchVolume: number;
  difficulty: number;
  estimatedTraffic: number;
  positionsToGain: number;
}

interface QuickWinsTableProps {
  projectId: string;
  competitors: Competitor[];
}

const QuickWinsTable: React.FC<QuickWinsTableProps> = ({
  projectId,
  competitors,
}) => {
  const [data, setData] = useState<QuickWin[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState<number>(20);
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'traffic' | 'positions'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadQuickWins();
  }, [projectId, selectedCompetitor, limit]);

  const loadQuickWins = async () => {
    setLoading(true);
    try {
      const params: any = { limit };
      if (selectedCompetitor) {
        params.competitorId = selectedCompetitor;
      }
      const response = await competitorAnalysisService.getQuickWins(projectId, params);
      setData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load quick wins');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  const filteredData = data
    .filter((item) => {
      if (searchTerm && !item.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'volume') {
        aVal = a.searchVolume;
        bVal = b.searchVolume;
      } else if (sortBy === 'difficulty') {
        aVal = a.difficulty;
        bVal = b.difficulty;
      } else if (sortBy === 'traffic') {
        aVal = a.estimatedTraffic;
        bVal = b.estimatedTraffic;
      } else {
        aVal = a.positionsToGain;
        bVal = b.positionsToGain;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-600';
    if (difficulty < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSort = (column: 'volume' | 'difficulty' | 'traffic' | 'positions') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Calculate total potential traffic
  const totalPotentialTraffic = filteredData.reduce(
    (sum, item) => sum + item.estimatedTraffic,
    0
  );

  return (
    <div className="p-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 mb-6 border border-yellow-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <TrophyIcon className="h-6 w-6 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-900">Quick Wins</h3>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              Keywords where you rank on pages 2-3 (positions 11-30) and competitors rank in
              top 10. These are your best opportunities for quick ranking improvements.
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="text-2xl font-bold text-yellow-900">{filteredData.length}</p>
            <p className="text-xs text-yellow-600">Opportunities</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-yellow-700">Potential Monthly Traffic:</span>
            <span className="font-semibold text-yellow-900">
              {totalPotentialTraffic.toLocaleString()} visits
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Competitor
            </label>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Competitors</option>
              {competitors.map((comp) => (
                <option key={comp._id} value={comp._id}>
                  {comp.domain}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search Keyword
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter keywords..."
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Results Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value={10}>10 results</option>
              <option value={20}>20 results</option>
              <option value={50}>50 results</option>
              <option value={100}>100 results</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 mt-2">Finding quick wins...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No quick wins found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try tracking more keywords or adjusting your filters
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('positions')}
                  >
                    <div className="flex items-center">
                      Positions to Gain
                      {sortBy === 'positions' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Position
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competitor Pos.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Competitor
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('volume')}
                  >
                    Volume
                    {sortBy === 'volume' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('difficulty')}
                  >
                    Difficulty
                    {sortBy === 'difficulty' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('traffic')}
                  >
                    Est. Traffic
                    {sortBy === 'traffic' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.keyword}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                          {item.positionsToGain} spots
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        #{item.yourPosition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        #{item.competitorPosition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.competitorDomain}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.searchVolume.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getDifficultyColor(item.difficulty)}`}>
                        {item.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.estimatedTraffic.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredData.length} of {data.length} quick wins
          </div>
        </>
      )}
    </div>
  );
};

export default QuickWinsTable;
