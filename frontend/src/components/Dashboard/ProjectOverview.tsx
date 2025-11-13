import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, MagnifyingGlassIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Project } from '../../types';

interface ProjectStats {
  project: Project;
  keywordCount: number;
  trackedCount: number;
  avgRank: number | null;
  competitorCount: number;
}

interface ProjectOverviewProps {
  projects: ProjectStats[];
  loading?: boolean;
}

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h2>
        <div className="text-center py-8">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No projects yet</p>
          <Link
            to="/projects"
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Your First Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
        <Link to="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {projects.map((projectStats) => (
          <Link
            key={projectStats.project.id}
            to={`/keywords?project=${projectStats.project.id}`}
            className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center min-w-0 flex-1">
                <div className="bg-primary-100 p-2 rounded flex-shrink-0">
                  <FolderIcon className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {projectStats.project.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{projectStats.project.domain}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Keywords</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {projectStats.trackedCount}/{projectStats.keywordCount}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Avg Rank</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {projectStats.avgRank !== null ? `#${projectStats.avgRank.toFixed(1)}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="h-4 w-4 mr-2 flex-shrink-0">
                  <svg className="text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Competitors</p>
                  <p className="text-sm font-semibold text-gray-900">{projectStats.competitorCount}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectOverview;
