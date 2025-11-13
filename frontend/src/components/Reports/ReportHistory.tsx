import React from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { ReportFormat } from './ReportCard';

export interface ReportHistoryItem {
  id: string;
  templateId: string;
  templateName: string;
  reportType: string;
  format: ReportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath: string | null;
  fileSize: number | null;
  generatedAt: string;
  error: string | null;
}

interface ReportHistoryProps {
  history: ReportHistoryItem[];
  loading?: boolean;
  onDownload?: (item: ReportHistoryItem) => void;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: ClockIcon,
  processing: ClockIcon,
  completed: CheckCircleIcon,
  failed: ExclamationCircleIcon,
};

const formatLabels: Record<ReportFormat, string> = {
  csv: 'CSV',
  pdf: 'PDF',
  json: 'JSON',
};

const ReportHistory: React.FC<ReportHistoryProps> = ({
  history,
  loading = false,
  onDownload,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report History</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report History</h2>
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No reports have been generated yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Report History ({history.length})
      </h2>

      <div className="space-y-3">
        {history.map((item) => {
          const StatusIcon = statusIcons[item.status];

          return (
            <div
              key={item.id}
              className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start flex-1 min-w-0">
                <div className="bg-primary-100 p-2 rounded-lg flex-shrink-0">
                  <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                </div>

                <div className="ml-3 flex-1 min-w-0">
                  {/* Title and Status */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {item.templateName}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded flex items-center ${
                        statusColors[item.status]
                      }`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {item.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {formatLabels[item.format]}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      Generated: {new Date(item.generatedAt).toLocaleString()}
                    </span>
                    {item.fileSize && (
                      <span>Size: {formatFileSize(item.fileSize)}</span>
                    )}
                  </div>

                  {/* Error Message */}
                  {item.status === 'failed' && item.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700">{item.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button */}
              {item.status === 'completed' && item.filePath && onDownload && (
                <button
                  onClick={() => onDownload(item)}
                  className="ml-3 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors flex-shrink-0"
                  title="Download Report"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportHistory;
