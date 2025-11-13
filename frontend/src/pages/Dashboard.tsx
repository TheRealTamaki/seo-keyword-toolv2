import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import {
  ChartBarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  BellIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/Layout/DashboardLayout';
import {
  StatsCard,
  RecentChanges,
  ProjectOverview,
  QuickActions,
  TopKeywords,
} from '../components/Dashboard';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalProjects: number;
  totalKeywords: number;
  trackedKeywords: number;
  avgRank: number | null;
  totalCompetitors: number;
  totalAlerts: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalKeywords: 0,
    trackedKeywords: 0,
    avgRank: null,
    totalCompetitors: 0,
    totalAlerts: 0,
  });
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [projectsOverview, setProjectsOverview] = useState<any[]>([]);
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [worstKeywords, setWorstKeywords] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingChanges, setLoadingChanges] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingKeywords, setLoadingKeywords] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [statsRes, changesRes, projectsRes, topRes, worstRes] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getRecentChanges({ limit: 10 }),
        dashboardService.getProjectsOverview({ limit: 5 }),
        dashboardService.getTopKeywords({ limit: 5 }),
        dashboardService.getWorstKeywords({ limit: 5 }),
      ]);

      // Handle stats
      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.data);
      }
      setLoading(false);

      // Handle recent changes
      if (changesRes.status === 'fulfilled' && changesRes.value.data.success) {
        setRecentChanges(changesRes.value.data.data || []);
      }
      setLoadingChanges(false);

      // Handle projects overview
      if (projectsRes.status === 'fulfilled' && projectsRes.value.data.success) {
        setProjectsOverview(projectsRes.value.data.data || []);
      }
      setLoadingProjects(false);

      // Handle keywords
      if (topRes.status === 'fulfilled' && topRes.value.data.success) {
        setTopKeywords(topRes.value.data.data || []);
      }
      if (worstRes.status === 'fulfilled' && worstRes.value.data.success) {
        setWorstKeywords(worstRes.value.data.data || []);
      }
      setLoadingKeywords(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
      setLoadingChanges(false);
      setLoadingProjects(false);
      setLoadingKeywords(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your SEO performance and keyword tracking
          </p>
        </div>

        {/* Getting Started Banner - Show if no projects */}
        {stats.totalProjects === 0 && (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200 p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FolderIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Welcome to SEO Keyword Tool!
                </h3>
                <p className="text-sm text-primary-700 mb-4">
                  Get started by creating your first project to track keywords and monitor your
                  search engine rankings.
                </p>
                <Link
                  to="/projects"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <FolderIcon className="h-5 w-5 mr-2" />
                  Create Your First Project
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            name="Total Projects"
            value={stats.totalProjects}
            icon={FolderIcon}
            href="/projects"
            color="bg-blue-500"
          />
          <StatsCard
            name="Keywords Tracked"
            value={`${stats.trackedKeywords}/${stats.totalKeywords}`}
            icon={CheckCircleIcon}
            href="/keywords"
            color="bg-green-500"
          />
          <StatsCard
            name="Avg. Rank"
            value={stats.avgRank !== null ? `#${stats.avgRank.toFixed(1)}` : 'N/A'}
            icon={ChartBarIcon}
            href="/rankings"
            color="bg-yellow-500"
          />
          <StatsCard
            name="Total Keywords"
            value={stats.totalKeywords}
            icon={MagnifyingGlassIcon}
            href="/keywords"
            color="bg-purple-500"
          />
          <StatsCard
            name="Competitors"
            value={stats.totalCompetitors}
            icon={UserGroupIcon}
            href="/competitors"
            color="bg-orange-500"
          />
          <StatsCard
            name="Active Alerts"
            value={stats.totalAlerts}
            icon={BellIcon}
            href="/alerts"
            color="bg-red-500"
          />
        </div>

        {/* Main Content Grid */}
        {stats.totalProjects > 0 && (
          <>
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <RecentChanges changes={recentChanges} loading={loadingChanges} />
                <TopKeywords keywords={topKeywords} loading={loadingKeywords} type="top" />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <ProjectOverview projects={projectsOverview} loading={loadingProjects} />
                <TopKeywords
                  keywords={worstKeywords}
                  loading={loadingKeywords}
                  type="worst"
                  title="Keywords to Improve"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
