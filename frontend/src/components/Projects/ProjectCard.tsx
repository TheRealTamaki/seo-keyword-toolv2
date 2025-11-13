import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, PencilIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  stats?: {
    totalKeywords: number;
    trackedKeywords: number;
    avgRank?: number;
    totalCompetitors: number;
  };
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, stats, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Link to={`/keywords?project=${project.id}`} className="flex items-center flex-1 min-w-0">
            <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
              <FolderIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
              <p className="text-sm text-gray-500 truncate">{project.domain}</p>
            </div>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 ml-2">
            <Link
              to={`/projects/${project.id}/settings`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Project Settings"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </Link>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(project);
                }}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                title="Edit Project"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(project);
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Project"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-4 text-sm text-gray-600 line-clamp-2">{project.description}</p>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium">Keywords</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {stats.trackedKeywords}/{stats.totalKeywords}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium">Competitors</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">{stats.totalCompetitors}</p>
            </div>
            {stats.avgRank !== undefined && (
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500 font-medium">Average Rank</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {stats.avgRank > 0 ? `#${stats.avgRank.toFixed(1)}` : 'No data'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
