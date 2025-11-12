import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ChartPieIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { competitorAnalysisService } from '../../services/api';

interface Competitor {
  _id: string;
  domain: string;
}

interface OverlapData {
  competitorDomain: string;
  sharedKeywords: number;
  uniqueToYou: number;
  uniqueToCompetitor: number;
  totalYourKeywords: number;
  totalCompetitorKeywords: number;
  overlapPercentage: number;
  sharedKeywordsList: Array<{
    keyword: string;
    yourPosition: number;
    competitorPosition: number;
    searchVolume: number;
  }>;
}

interface CompetitorOverlapProps {
  projectId: string;
  competitors: Competitor[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

const CompetitorOverlap: React.FC<CompetitorOverlapProps> = ({
  projectId,
  competitors,
}) => {
  const [data, setData] = useState<OverlapData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    loadOverlapData();
  }, [projectId, selectedCompetitor]);

  const loadOverlapData = async () => {
    setLoading(true);
    try {
      const params = selectedCompetitor ? { competitorId: selectedCompetitor } : undefined;
      const response = await competitorAnalysisService.getOverlap(projectId, params);
      setData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load overlap data');
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {payload[0].value.toLocaleString()} keywords
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      {/* Filter */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Select Competitor
        </label>
        <select
          value={selectedCompetitor}
          onChange={(e) => setSelectedCompetitor(e.target.value)}
          className="w-full md:w-1/3 text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Competitors</option>
          {competitors.map((comp) => (
            <option key={comp._id} value={comp._id}>
              {comp.domain}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 mt-2">Analyzing keyword overlap...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ChartPieIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No overlap data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Track keywords to analyze overlap with competitors
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map((competitor, index) => {
            const isExpanded = expandedCompetitor === competitor.competitorDomain;
            const pieData = [
              { name: 'Shared Keywords', value: competitor.sharedKeywords },
              { name: 'Unique to You', value: competitor.uniqueToYou },
              { name: 'Unique to Competitor', value: competitor.uniqueToCompetitor },
            ];

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <ArrowsRightLeftIcon className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0" />
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {competitor.competitorDomain}
                      </h3>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        {Math.round(competitor.overlapPercentage)}%
                      </p>
                      <p className="text-xs text-gray-500">Overlap</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-900">
                        {competitor.sharedKeywords}
                      </p>
                      <p className="text-xs text-primary-600 mt-1">Shared Keywords</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-900">
                        {competitor.uniqueToYou}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Unique to You</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-900">
                        {competitor.uniqueToCompetitor}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">Unique to Competitor</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">
                        {competitor.totalYourKeywords} / {competitor.totalCompetitorKeywords}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Your / Their Total</p>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Keyword Distribution
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Shared Keywords Toggle */}
                  {competitor.sharedKeywordsList.length > 0 && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedCompetitor(
                            isExpanded ? null : competitor.competitorDomain
                          )
                        }
                        className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                      >
                        {isExpanded ? '▼' : '▶'} View Shared Keywords (
                        {competitor.sharedKeywordsList.length})
                      </button>

                      {isExpanded && (
                        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Keyword
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Your Position
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Their Position
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Volume
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Winner
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {competitor.sharedKeywordsList.map((keyword, idx) => {
                                  const youWin = keyword.yourPosition < keyword.competitorPosition;
                                  return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {keyword.keyword}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                            youWin
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          #{keyword.yourPosition}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                            !youWin
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-gray-100 text-gray-800'
                                          }`}
                                        >
                                          #{keyword.competitorPosition}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-900">
                                        {keyword.searchVolume.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                            youWin
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {youWin ? 'You' : 'Them'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetitorOverlap;
