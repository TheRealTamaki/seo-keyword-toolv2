import React, { useState, useEffect } from 'react';
import { TrophyIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { competitorAnalysisService } from '../../services/api';
import BarChart from '../Charts/BarChart';
import PieChart from '../Charts/PieChart';
import PositionTierComparison from './PositionTierComparison';

interface Competitor {
  _id: string;
  domain: string;
}

interface VisibilityData {
  domain: string;
  visibilityScore: number;
  totalKeywords: number;
  avgPosition: number;
  top3Count: number;
  top10Count: number;
  estimatedTraffic: number;
}

interface VisibilityComparisonProps {
  projectId: string;
  projectDomain: string;
  competitors: Competitor[];
}

const VisibilityComparison: React.FC<VisibilityComparisonProps> = ({
  projectId,
  projectDomain,
  competitors,
}) => {
  const [data, setData] = useState<VisibilityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');

  useEffect(() => {
    loadVisibilityData();
  }, [projectId, selectedCompetitor]);

  const loadVisibilityData = async () => {
    setLoading(true);
    try {
      const params = selectedCompetitor ? { competitorId: selectedCompetitor } : undefined;
      const response = await competitorAnalysisService.getVisibility(projectId, params);
      setData(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load visibility data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = data.map((item) => ({
    domain: item.domain.length > 20 ? item.domain.substring(0, 20) + '...' : item.domain,
    fullDomain: item.domain,
    score: Math.round(item.visibilityScore),
    isYours: item.domain === projectDomain,
  }));

  // Find project data
  const projectData = data.find((d) => d.domain === projectDomain);
  const competitorData = data.filter((d) => d.domain !== projectDomain);

  // Prepare market share data (based on total keywords)
  const marketShareData = data.map((item) => ({
    name: item.domain.length > 25 ? item.domain.substring(0, 25) + '...' : item.domain,
    value: item.totalKeywords,
  }));

  // Color function for bar chart
  const colorScale = (value: number) => {
    // Find the item to determine if it's the project domain
    const item = chartData.find(d => d.score === value);
    return item?.isYours ? '#6366f1' : '#9ca3af'; // primary or gray
  };

  const tooltipFormatter = (value: any, name: string): [string, string] => {
    return [`Score: ${value}`, name];
  };

  const marketShareFormatter = (value: number) => `${value} keywords`;

  return (
    <div className="p-6">
      {/* Filter */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Filter by Competitor
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
          <p className="text-sm text-gray-500 mt-2">Loading visibility data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No visibility data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Track keywords to compare visibility with competitors
          </p>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Visibility Score Bar Chart - 2 columns */}
            <div className="lg:col-span-2">
              <BarChart
                data={chartData}
                series={[
                  {
                    dataKey: 'score',
                    name: 'Visibility Score',
                  },
                ]}
                xAxisKey="domain"
                title="Visibility Score Comparison"
                subtitle="Compare visibility scores across all domains"
                height={350}
                showGrid={true}
                showLegend={false}
                colorByValue={true}
                colorScale={colorScale}
                tooltipFormatter={tooltipFormatter}
                yAxisLabel="Score"
              />
            </div>

            {/* Market Share Pie Chart - 1 column */}
            <div>
              <PieChart
                data={marketShareData}
                title="Market Share"
                subtitle="Distribution by keyword count"
                height={350}
                showLegend={true}
                showLabels={false}
                showPercentage={true}
                valueFormatter={marketShareFormatter}
              />
            </div>
          </div>

          {/* Position Tier Comparison */}
          <div className="mb-6">
            <PositionTierComparison data={data} projectDomain={projectDomain} />
          </div>

          {/* Detailed Stats */}
          <div className="space-y-4">
            {/* Your Domain */}
            {projectData && (
              <div className="bg-primary-50 rounded-lg border border-primary-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <TrophyIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-sm font-medium text-primary-900">
                      Your Domain: {projectData.domain}
                    </h3>
                  </div>
                  <span className="text-2xl font-bold text-primary-900">
                    {Math.round(projectData.visibilityScore)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <p className="text-xs text-primary-600">Total Keywords</p>
                    <p className="text-sm font-medium text-primary-900">
                      {projectData.totalKeywords}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Avg Position</p>
                    <p className="text-sm font-medium text-primary-900">
                      {projectData.avgPosition.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Top 3</p>
                    <p className="text-sm font-medium text-primary-900">
                      {projectData.top3Count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Top 10</p>
                    <p className="text-sm font-medium text-primary-900">
                      {projectData.top10Count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600">Est. Traffic</p>
                    <p className="text-sm font-medium text-primary-900">
                      {projectData.estimatedTraffic.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Competitors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Competitors</h3>
              {competitorData
                .sort((a, b) => b.visibilityScore - a.visibilityScore)
                .map((competitor, index) => {
                  const scoreDiff = projectData
                    ? competitor.visibilityScore - projectData.visibilityScore
                    : 0;
                  const isAhead = scoreDiff > 0;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {competitor.domain}
                          </h4>
                          {projectData && (
                            <span
                              className={`ml-2 inline-flex items-center text-xs ${
                                isAhead ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {isAhead ? (
                                <ArrowUpIcon className="h-3 w-3 mr-0.5" />
                              ) : (
                                <ArrowDownIcon className="h-3 w-3 mr-0.5" />
                              )}
                              {Math.abs(Math.round(scoreDiff))} vs you
                            </span>
                          )}
                        </div>
                        <span className="text-xl font-bold text-gray-900 ml-4">
                          {Math.round(competitor.visibilityScore)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Keywords</p>
                          <p className="text-sm font-medium text-gray-900">
                            {competitor.totalKeywords}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Position</p>
                          <p className="text-sm font-medium text-gray-900">
                            {competitor.avgPosition.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Top 3</p>
                          <p className="text-sm font-medium text-gray-900">
                            {competitor.top3Count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Top 10</p>
                          <p className="text-sm font-medium text-gray-900">
                            {competitor.top10Count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Est. Traffic</p>
                          <p className="text-sm font-medium text-gray-900">
                            {competitor.estimatedTraffic.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VisibilityComparison;
