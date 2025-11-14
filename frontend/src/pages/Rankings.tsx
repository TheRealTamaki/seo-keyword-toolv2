import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { projectsService, keywordsService, rankingsService } from '../services/api';
import RankingChart from '../components/Rankings/RankingChart';
import RankDistributionChart from '../components/Rankings/RankDistributionChart';
import SerpFeatures from '../components/Rankings/SerpFeatures';
import CompetitorComparison from '../components/Rankings/CompetitorComparison';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  domain: string;
}

interface Keyword {
  id: string;
  keyword: string;
  searchEngine: string;
  device: string;
  location: string;
}

interface RankingData {
  position: number;
  url: string;
  checkedAt: string;
}

interface RankingChange {
  currentPosition: number;
  previousPosition: number;
  change: number;
  changePercentage: number;
}

const Rankings: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Ranking data
  const [latestRanking, setLatestRanking] = useState<RankingData | null>(null);
  const [rankingChanges, setRankingChanges] = useState<RankingChange | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [serpFeatures, setSerpFeatures] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [averagePosition, setAveragePosition] = useState<number | null>(null);

  // Date range
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchKeywords();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedKeyword) {
      fetchRankingData();
    }
  }, [selectedKeyword, dateRange]);

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getAll();
      const projectList = response.data.data || [];
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0].id);
      }
    } catch (error: any) {
      toast.error('Failed to load projects');
    }
  };

  const fetchKeywords = async () => {
    if (!selectedProject) return;

    try {
      const response = await keywordsService.getByProject(selectedProject);
      const keywordList = response.data.data || [];
      setKeywords(keywordList);
      if (keywordList.length > 0 && !selectedKeyword) {
        setSelectedKeyword(keywordList[0].id);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        toast.error('Failed to load keywords');
      }
      setKeywords([]);
    }
  };

  const fetchRankingData = async () => {
    if (!selectedKeyword) return;

    try {
      setLoading(true);

      // Calculate date range
      const params: any = {};
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.startDate = startDate.toISOString();
      }

      // Fetch all ranking data in parallel
      const [
        latestRes,
        changesRes,
        historyRes,
        serpRes,
        competitorsRes,
        averageRes,
      ] = await Promise.all([
        rankingsService.getLatest(selectedKeyword).catch(() => ({ data: { data: null } })),
        rankingsService.getChanges(selectedKeyword).catch(() => ({ data: { data: null } })),
        rankingsService.getHistory(selectedKeyword, params).catch(() => ({ data: { data: [] } })),
        rankingsService.getSerpFeatures(selectedKeyword).catch(() => ({ data: { data: [] } })),
        rankingsService.getCompetitors(selectedKeyword).catch(() => ({ data: { data: [] } })),
        rankingsService.getAverage(selectedKeyword, params).catch(() => ({ data: { data: null } })),
      ]);

      setLatestRanking(latestRes.data.data);
      setRankingChanges(changesRes.data.data);
      setHistoryData(historyRes.data.data || []);
      setSerpFeatures(serpRes.data.data || []);
      setCompetitors(competitorsRes.data.data || []);
      setAveragePosition(averageRes.data.data?.averagePosition || null);
    } catch (error: any) {
      console.error('Failed to load ranking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckRank = async () => {
    if (!selectedKeyword) {
      toast.error('Please select a keyword');
      return;
    }

    const keyword = Array.isArray(keywords)
      ? keywords.find((k) => k.id === selectedKeyword)
      : undefined;
    if (!keyword) return;

    try {
      setChecking(true);
      const response = await rankingsService.check({
        keywords: [keyword.keyword],
        searchEngine: keyword.searchEngine,
        device: keyword.device,
        location: keyword.location,
      });

      if (response.data.success) {
        toast.success('Rank check queued successfully!');
        // Refresh data after a delay
        setTimeout(() => {
          fetchRankingData();
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to queue rank check');
    } finally {
      setChecking(false);
    }
  };

  const getPositionChange = () => {
    if (!rankingChanges) return null;

    const { change } = rankingChanges;
    if (change > 0) {
      return (
        <span className="inline-flex items-center text-green-600">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          {change} positions
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="inline-flex items-center text-red-600">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          {Math.abs(change)} positions
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-gray-600">
        <MinusIcon className="h-4 w-4 mr-1" />
        No change
      </span>
    );
  };

  const selectedKeywordData = Array.isArray(keywords)
    ? keywords.find((k) => k.id === selectedKeyword)
    : undefined;
  const selectedProjectData = Array.isArray(projects)
    ? projects.find((p) => p.id === selectedProject)
    : undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track and visualize keyword ranking performance over time
            </p>
          </div>
          <button
            onClick={handleCheckRank}
            disabled={checking || !selectedKeyword}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Check Rank Now
              </>
            )}
          </button>
        </div>

        {/* Selectors */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {(!Array.isArray(projects) || projects.length === 0) && <option value="">No projects</option>}
                {Array.isArray(projects) && projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.domain})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
              <select
                value={selectedKeyword}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {(!Array.isArray(keywords) || keywords.length === 0) && <option value="">No keywords</option>}
                {Array.isArray(keywords) && keywords.map((keyword) => (
                  <option key={keyword.id} value={keyword.id}>
                    {keyword.keyword} ({keyword.searchEngine} - {keyword.device})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {selectedKeywordData && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Location: {selectedKeywordData.location}</span>
                <span>•</span>
                <span>
                  Engine: {selectedKeywordData.searchEngine === 'google' ? 'Google' : selectedKeywordData.searchEngine === 'bing' ? 'Bing' : 'YouTube'}
                </span>
                <span>•</span>
                <span>Device: {selectedKeywordData.device === 'desktop' ? 'Desktop' : 'Mobile'}</span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : !selectedKeyword ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No keyword selected</h3>
            <p className="mt-1 text-sm text-gray-500">Select a project and keyword to view rankings</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Current Position
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {latestRanking ? `#${latestRanking.position}` : '-'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Average Position
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {averagePosition ? `#${averagePosition.toFixed(1)}` : '-'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {rankingChanges && rankingChanges.change > 0 ? (
                        <ArrowUpIcon className="h-6 w-6 text-green-500" />
                      ) : rankingChanges && rankingChanges.change < 0 ? (
                        <ArrowDownIcon className="h-6 w-6 text-red-500" />
                      ) : (
                        <MinusIcon className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Position Change
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-lg font-semibold text-gray-900">
                            {getPositionChange()}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Last Checked
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-sm font-medium text-gray-900">
                            {latestRanking
                              ? format(new Date(latestRanking.checkedAt), 'MMM d, yyyy')
                              : '-'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking History Chart & Distribution */}
            {historyData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RankingChart data={historyData} />
                </div>
                <div>
                  <RankDistributionChart data={historyData} />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No ranking history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Rankings will appear here once the keyword has been checked
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCheckRank}
                    disabled={checking}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <ArrowPathIcon className="h-5 w-5 mr-2" />
                    Check Rank Now
                  </button>
                </div>
              </div>
            )}

            {/* SERP Features & Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {serpFeatures.length > 0 && <SerpFeatures features={serpFeatures} />}
              {competitors.length > 0 && <CompetitorComparison competitors={competitors} />}
            </div>

            {/* Latest Ranking Details */}
            {latestRanking && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Ranking Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Position:</span>
                    <span className="text-sm font-medium text-gray-900">#{latestRanking.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">URL:</span>
                    <a
                      href={latestRanking.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 truncate max-w-md"
                    >
                      {latestRanking.url}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Checked At:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(latestRanking.checkedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Rankings;
