import React, { useState, useEffect } from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { competitorAnalysisService } from '../../services/api';

interface Competitor {
  _id: string;
  domain: string;
}

interface KeywordGap {
  keyword: string;
  yourPosition: number | null;
  competitorPosition: number;
  competitorDomain: string;
  searchVolume: number;
  difficulty: number;
  gap: 'missing' | 'losing' | 'winning';
}

interface KeywordGapAnalysisProps {
  projectId: string;
  competitors: Competitor[];
}

const KeywordGapAnalysis: React.FC<KeywordGapAnalysisProps> = ({
  projectId,
  competitors,
}) => {
  const [data, setData] = useState<KeywordGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [selectedGapType, setSelectedGapType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'position'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadKeywordGapData();
  }, [projectId, selectedCompetitor]);

  const loadKeywordGapData = async () => {
    setLoading(true);
    try {
      const params = selectedCompetitor ? { competitorId: selectedCompetitor } : undefined;
      const response = await competitorAnalysisService.getKeywordGap(projectId, params);
      setData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load keyword gap data');
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
      if (selectedGapType !== 'all' && item.gap !== selectedGapType) {
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
      } else {
        aVal = a.competitorPosition;
        bVal = b.competitorPosition;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Calculate stats
  const stats = {
    missing: data.filter((d) => d.gap === 'missing').length,
    losing: data.filter((d) => d.gap === 'losing').length,
    winning: data.filter((d) => d.gap === 'winning').length,
  };

  const getGapBadge = (gap: 'missing' | 'losing' | 'winning') => {
    const colors = {
      missing: 'bg-red-100 text-red-800',
      losing: 'bg-yellow-100 text-yellow-800',
      winning: 'bg-green-100 text-green-800',
    };
    return colors[gap];
  };

  const getGapLabel = (gap: 'missing' | 'losing' | 'winning') => {
    const labels = {
      missing: 'Missing',
      losing: 'Losing',
      winning: 'Winning',
    };
    return labels[gap];
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'text-green-600';
    if (difficulty < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSort = (column: 'volume' | 'difficulty' | 'position') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Missing Keywords</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.missing}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <MagnifyingGlassIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2">Competitors rank, you don't</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Losing Keywords</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.losing}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ArrowDownIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2">Competitors rank higher</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Winning Keywords</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.winning}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">You rank higher</p>
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
              Gap Type
            </label>
            <select
              value={selectedGapType}
              onChange={(e) => setSelectedGapType(e.target.value)}
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="missing">Missing</option>
              <option value="losing">Losing</option>
              <option value="winning">Winning</option>
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
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 mt-2">Loading keyword gap analysis...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No keyword gaps found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or adding more competitors
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gap Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Position
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('position')}
                  >
                    Competitor Position
                    {sortBy === 'position' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.keyword}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGapBadge(
                          item.gap
                        )}`}
                      >
                        {getGapLabel(item.gap)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.yourPosition ? `#${item.yourPosition}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      #{item.competitorPosition}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredData.length} of {data.length} keywords
          </div>
        </>
      )}
    </div>
  );
};

export default KeywordGapAnalysis;
