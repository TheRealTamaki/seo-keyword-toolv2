import React from 'react';
import {
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export type ReportType =
  | 'ranking_performance'
  | 'keyword_research'
  | 'competitor_analysis'
  | 'project_overview'
  | 'custom';

export type ReportFormat = 'csv' | 'pdf' | 'json';

export interface ReportTemplate {
  id: string;
  projectId: string | null;
  name: string;
  description: string | null;
  reportType: ReportType;
  config: Record<string, any>;
  format: ReportFormat;
  branding: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ReportCardProps {
  report: ReportTemplate;
  projectName?: string;
  onEdit?: (report: ReportTemplate) => void;
  onDelete?: (report: ReportTemplate) => void;
  onSchedule?: (report: ReportTemplate) => void;
  onGenerate?: (report: ReportTemplate) => void;
}

const reportTypeLabels: Record<ReportType, string> = {
  ranking_performance: 'Ranking Performance',
  keyword_research: 'Keyword Research',
  competitor_analysis: 'Competitor Analysis',
  project_overview: 'Project Overview',
  custom: 'Custom Report',
};

const reportTypeColors: Record<ReportType, string> = {
  ranking_performance: 'bg-blue-100 text-blue-800',
  keyword_research: 'bg-green-100 text-green-800',
  competitor_analysis: 'bg-orange-100 text-orange-800',
  project_overview: 'bg-purple-100 text-purple-800',
  custom: 'bg-gray-100 text-gray-800',
};

const formatLabels: Record<ReportFormat, string> = {
  csv: 'CSV',
  pdf: 'PDF',
  json: 'JSON',
};

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  projectName,
  onEdit,
  onDelete,
  onSchedule,
  onGenerate,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1 min-w-0">
          <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
            <DocumentTextIcon className="h-6 w-6 text-primary-600" />
          </div>

          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{report.name}</h3>
              <span
                className={`ml-3 px-2 py-1 text-xs font-medium rounded ${
                  reportTypeColors[report.reportType]
                }`}
              >
                {reportTypeLabels[report.reportType]}
              </span>
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                {formatLabels[report.format]}
              </span>
            </div>

            {report.description && (
              <p className="text-sm text-gray-600 mb-3">{report.description}</p>
            )}

            {projectName && (
              <p className="text-xs text-gray-500 mb-2">Project: {projectName}</p>
            )}

            {/* Created Date */}
            <p className="text-xs text-gray-500">
              Created {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {onGenerate && (
            <button
              onClick={() => onGenerate(report)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Generate Report"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          )}

          {onSchedule && (
            <button
              onClick={() => onSchedule(report)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Schedule Report"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(report)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="Edit Template"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(report)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Template"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Config Preview */}
      {Object.keys(report.config).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Configuration:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.config).slice(0, 5).map(([key, value]) => (
              <span key={key} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                {key}: {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) + '...' : String(value)}
              </span>
            ))}
            {Object.keys(report.config).length > 5 && (
              <span className="px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded">
                +{Object.keys(report.config).length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCard;
