import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsService } from '../services/api';
import { ChartBarIcon, FolderIcon, MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/Layout/DashboardLayout';

interface Stats {
  totalProjects: number;
  totalKeywords: number;
  totalAlerts: number;
  avgPosition: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalKeywords: 0,
    totalAlerts: 0,
    avgPosition: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await projectsService.getAll();
      if (response.data.success) {
        const projects = response.data.data || [];
        setStats({
          totalProjects: projects.length,
          totalKeywords: 0, // TODO: Aggregate from API
          totalAlerts: 0, // TODO: Get from alerts API
          avgPosition: 0, // TODO: Calculate from rankings
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Total Projects', value: stats.totalProjects, icon: FolderIcon, href: '/projects', color: 'bg-blue-500' },
    { name: 'Keywords Tracked', value: stats.totalKeywords, icon: MagnifyingGlassIcon, href: '/keywords', color: 'bg-green-500' },
    { name: 'Avg. Position', value: stats.avgPosition || 'N/A', icon: ChartBarIcon, href: '/rankings', color: 'bg-yellow-500' },
    { name: 'Active Alerts', value: stats.totalAlerts, icon: BellIcon, href: '/alerts', color: 'bg-red-500' },
  ];

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to your SEO keyword tracking dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Link
              key={stat.name}
              to={stat.href}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/projects"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700">Create Project</span>
            </Link>
            <Link
              to="/keywords"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700">Add Keywords</span>
            </Link>
            <Link
              to="/reports"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <span className="font-medium text-gray-700">View Reports</span>
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        {stats.totalProjects === 0 && (
          <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Get Started</h3>
            <p className="text-sm text-primary-700 mb-4">
              Create your first project to start tracking your keywords and rankings.
            </p>
            <Link
              to="/projects"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FolderIcon className="h-5 w-5 mr-2" />
              Create Your First Project
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
