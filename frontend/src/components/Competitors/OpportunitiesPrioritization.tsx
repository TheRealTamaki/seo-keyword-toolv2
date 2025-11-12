import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  LightBulbIcon,
  FunnelIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { competitorAnalysisService } from '../../services/api';

interface Competitor {
  _id: string;
  domain: string;
}

interface Opportunity {
  keyword: string;
  effort: number; // 1-100 (lower = easier)
  impact: number; // 1-100 (higher = more impact)
  yourPosition: number | null;
  competitorPosition: number;
  searchVolume: number;
  difficulty: number;
  estimatedTraffic: number;
  priority: 'high' | 'medium' | 'low';
}

interface OpportunitiesPrioritizationProps {
  projectId: string;
  competitors: Competitor[];
}

const OpportunitiesPrioritization: React.FC<OpportunitiesPrioritizationProps> = ({
  projectId,
  competitors,
}) => {
  const [data, setData] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOpportunities();
  }, [projectId, selectedCompetitor]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const params = selectedCompetitor ? { competitorId: selectedCompetitor } : undefined;
      const response = await competitorAnalysisService.getOpportunities(projectId, params);
      setData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Filter data
  const filteredData = data.filter((item) => {
    if (searchTerm && !item.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
      return false;
    }
    return true;
  });

  // Prepare chart data
  const chartData = filteredData.map((item) => ({
    ...item,
    x: item.effort,
    y: item.impact,
  }));

  // Calculate stats
  const stats = {
    high: data.filter((d) => d.priority === 'high').length,
    medium: data.filter((d) => d.priority === 'medium').length,
    low: data.filter((d) => d.priority === 'low').length,
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return '#10b981'; // green
    if (priority === 'medium') return '#f59e0b'; // yellow
    return '#6b7280'; // gray
  };

  // Get priority badge
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return colors[priority];
  };

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    const labels = {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority',
    };
    return labels[priority];
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: Opportunity = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{item.keyword}</p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Effort:</span> {item.effort}/100
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Impact:</span> {item.impact}/100
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Volume:</span> {item.searchVolume.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-medium">Est. Traffic:</span> {item.estimatedTraffic.toLocaleString()}
            </p>
            <span
              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getPriorityBadge(
                item.priority
              )}`}
            >
              {getPriorityLabel(item.priority)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">High Priority</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.high}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2">Low effort, high impact</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.medium}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <LightBulbIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2">Moderate effort/impact</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Priority</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.low}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <LightBulbIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">High effort or low impact</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
              Priority Level
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-500 mt-2">Loading opportunities...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or adding more competitors
          </p>
        </div>
      ) : (
        <>
          {/* Effort vs Impact Matrix */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Effort vs Impact Matrix
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Effort"
                    domain={[0, 100]}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'Effort (Lower is Better) →',
                      position: 'bottom',
                      style: { fontSize: '12px', fill: '#6b7280' },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Impact"
                    domain={[0, 100]}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'Impact (Higher is Better) →',
                      angle: -90,
                      position: 'left',
                      style: { fontSize: '12px', fill: '#6b7280' },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={50} stroke="#9ca3af" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Scatter data={chartData}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPriorityColor(entry.priority)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span>High Priority (Low Effort, High Impact)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span>Medium Priority</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span>Low Priority</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effort
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Pos.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Traffic
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData
                  .sort((a, b) => {
                    // Sort by priority (high > medium > low), then by impact (desc)
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                      return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }
                    return b.impact - a.impact;
                  })
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.keyword}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(
                            item.priority
                          )}`}
                        >
                          {getPriorityLabel(item.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[80px]">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${100 - item.effort}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{item.effort}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[80px]">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${item.impact}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{item.impact}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.yourPosition ? `#${item.yourPosition}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.searchVolume.toLocaleString()}
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
            Showing {filteredData.length} of {data.length} opportunities
          </div>
        </>
      )}
    </div>
  );
};

export default OpportunitiesPrioritization;
